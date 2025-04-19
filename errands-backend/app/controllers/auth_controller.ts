import User from '#models/user'
import {
  ChangePassword,
  ChangePasswordConfirmation,
  LoginValidator,
  RegisterValidator,
  ValidateOTPAndEmail,
} from '#validators/auth'
import type { HttpContext } from '@adonisjs/core/http'
import { errors as authErrors } from '@adonisjs/auth'
import Otp from '#models/otp'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'
import sendMail from '../helpers/send_mail.js'
import Rating from '#models/rating'
import { UpdateAvatarValidator } from '#validators/update_profile'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import drive from '@adonisjs/drive/services/main'
import RatingEnum from '../enums/rating_enums.js'
import EmailService from '#services/email_service'
import { inject } from '@adonisjs/core'

@inject()
export default class AuthController {
  constructor(protected emailService: EmailService) {}
  async register({ request, response, logger }: HttpContext) {
    try {
      const data = await request.validateUsing(RegisterValidator)
      const user = await User.create(data)
      logger.info('Registering user ' + user)
      // send a mail
      const otp = await this.newOTP()

      const saved = await this.saveOtpDatabase(user.email, otp)

      if (saved === 'EMAIL_NOT_FOUND_OR_EMAIL_IS_ALREADY_CONFIRMED') {
        return response.status(400).json({
          message: 'Bad Request',
          error: 'Email not found or Email has already been confirmed',
          statusCode: 400,
          status: false,
        })
      }
      sendMail(
        'Errands OTP Registration Notifiction and Email Confirmation',
        `Kindly goto your email to confirm your email .Your OTP code is <strong>${otp}</strong>.'
        +'It will expire in 10 minutes.`,
        user.email
      )

      return response.status(201).json({
        message: 'User Registered',
        data: user,
        statusCode: 201,
        status: false,
      })
    } catch (error) {
      if (error.code === 'E_VALIDATION_ERROR') {
        return response.status(422).json({
          message: 'Validation failed',
          errors: error.messages,
          statusCode: 422,
          status: false,
        })
      }
      logger.error('Error Registering user ' + error)
      return response.status(500).json({
        message: 'An error occured',
        error: 'Internal Server Error',
        statusCode: 401,
        status: false,
      })
    }
  }
  async login({ request, response, logger }: HttpContext) {
    console.log(app.makePath('public/images/logo.png'))
    try {
      logger.info('Validating credentials')
      const { email, password } = await request.validateUsing(LoginValidator)
      logger.info('Credentials validated')
      const userExists = await User.findBy('email', email)

      if (!userExists) {
        return response.status(401).json({
          message: 'Invalid email or password',
          error: 'EMAIL_DOES_NOT_EXIST',
          statusCode: 401,
          status: false,
        })
      }

      if (!userExists.emailConfirmed) {
        return response.status(400).json({
          message: 'You need to confirm your email first',
          error: 'EMAIL_NOT_CONFIRMED',
          statusCode: 400,
          status: false,
        })
      }
      // Verify user credentials
      const user = await User.verifyCredentials(email, password)
      logger.info(`verifying credentials ${user.email}`)

      const token = await User.accessTokens.create(user, ['*'], {
        expiresIn: '30 days',
      })
      logger.info(`token ${token}`)

      logger.info(`user  ${userExists}`)

      if (userExists) {
        userExists.lastLogin = DateTime.now().toISO()
        userExists.loggedIn = true
      }
      await userExists.save()
      logger.info(`Token generated: ${token}`)
      // send a mail
      const info = `Errands Account Login  Notification '
       Someone logged in into your account.
       It you are the one please change your password.
       if it is you do nothing`
      await user.load('profile')
      this.emailService.sendWelcomeEmail(
        'Errands Login Notification',
        user!.profile.firstName,
        info,
        user.email
      )
      sendMail(
        'Errands Account Login  Notification ',
        `Someone logged in into your account.
       It you are the one please change your password.
       if it is you do nothing`,
        user.email
      )

      return response.status(200).json({
        message: 'Login successful',
        data: token,
        statusCode: 200,
        status: true,
      })
    } catch (error) {
      if (error.code === 'E_VALIDATION_ERROR') {
        return response.status(422).json({
          message: 'Validation failed',
          errors: error.messages,
          statusCode: 422,
          status: false,
        })
      }
      return response.status(500).json({
        message: 'Internal Server Error',
        statusCode: 500,
        status: false,
      })
    }
  }

  async logout({ auth, response, logger }: HttpContext) {
    try {
      if (!(await auth.check())) {
        return response.status(401).json({
          message: "You can'/t log out since you are not logged in",
          data: 'Unauthenticated',
          statusCode: 404,
          status: false,
        })
      }
      const user = auth.user!

      user!.loggedIn = false

      await User.accessTokens.delete(user, user.currentAccessToken.identifier)
      logger.info('Access token deleted ')
      user!.loggedIn = false
      await user.save()
      return response.status(200).json({
        message: 'Logout successful',
        data: null,
        statusCode: 200,
        status: true,
      })
    } catch (error) {
      logger.error(`Error deleting Access token deleted ${error}`)
      if (error instanceof authErrors.E_UNAUTHORIZED_ACCESS) {
        return response.status(401).json({
          message: "You can'/t log out since you are not logged in",
          error: 'Unauthenticated',
          statusCode: 404,
          status: false,
        })
      }

      return response.status(500).json({
        message: `Error during logout ${error}`,
        error: 'Internal Server Error',
        statusCode: 500,
        status: false,
      })
    }
  }

  async me({ auth, response }: HttpContext) {
    try {
      // Check if the user is authenticated
      if (!(await auth.check())) {
        return response.status(403).json({
          message: 'You are not logged in',
          error: 'UN_AUTHENITCATED',
          statusCode: 403,
          status: false,
        })
      }
      const user = await User.find(auth.user!.id)
      await user?.load('profile')
      await user?.load('bvn')
      await user?.load('nin')
      await user?.load('star')
      await user?.load('errands')
      await user?.load('ratings')
      await user?.load('feedbacks')

      const totalRating = await Rating.query().where('userId', user!.id).exec()
      const total = totalRating.reduce((sum, rating) => +sum + +rating.rating!, 0)
      const noOfRatings = totalRating.length
      const calculatedRating = Math.floor((total / (noOfRatings * 5)) * 5)
      if (user) {
        user.agregatedRating = RatingEnum[calculatedRating]
      }
      return response.status(200).json({
        message: 'Your info retrieved successfully',
        data: user,
        statusCode: 200,
        status: true,
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Internal server error',
        error: error.message,
        statusCode: 500,
        status: false,
      })
    }
  }

  async emailConfirmed({ response, request }: HttpContext) {
    try {
      const otp = await this.newOTP()
      const { email } = await request.validateUsing(ChangePassword)

      const saved = await this.saveOtpDatabase(email, otp)

      if (saved === 'EMAIL_NOT_FOUND_OR_EMAIL_IS_ALREADY_CONFIRMED') {
        return response.status(400).json({
          message: 'Bad Request',
          error: 'Email not found or Email has already been confirmed',
          statusCode: 400,
          status: false,
        })
      }
      sendMail(
        ' Errands OTP',
        `Your OTP code is <strong>${otp}</strong>. It will expire in 10 minutes.`,
        email
      )

      return response.status(200).json({
        message: 'Email sent successful: OTP sent for EMail Confirmation',
        data: null,
        statusCode: 200,
        status: true,
      })
    } catch (error) {
      if (error.code === 'E_VALIDATION_ERROR') {
        return response.status(422).json({
          message: 'Validation failed',
          errors: error.messages,
          statusCode: 422,
          status: false,
        })
      }
      return response.status(500).json({
        message: 'Internal server error',
        data: error.message,
        statusCode: 500,
        status: false,
      })
    }
  }

  async validateYourEmail({ response, request }: HttpContext) {
    // locate otp
    const data = await request.validateUsing(ValidateOTPAndEmail)
    try {
      const user = await User.findBy('email', data.email)
      if (!user || user === null) {
        return response.status(404).json({
          message: 'User not found',
          error: 'Invalide Email',
          statusCode: 404,
          status: false,
        })
      }

      const otpRecord = await Otp.query()
        .where('userId', user.id)
        .andWhere('invalidate', false)
        .orderBy('created_at', 'desc')
        .first()

      if (!otpRecord) {
        return response.status(404).json({
          message: 'otp not found',
          error: 'OTP_NOT_FOUND',
          statusCode: 404,
          status: false,
        })
      }

      if (DateTime.utc() > otpRecord.expiresAt) {
        await otpRecord.delete()
        return response.status(400).json({
          message: 'Bad Request',
          error: 'OTP_EXPIRED',
          statusCode: 400,
          status: false,
        })
      }
      const isValid = await hash.verify(otpRecord.otp, data.otp.toString())
      if (!isValid) {
        return response.status(400).json({
          message: 'Bad Request',
          error: 'INVALID_OTPD',
          statusCode: 400,
          status: false,
        })
      }
      // Update user email confirmation
      user.emailConfirmed = true
      const savedUser = await user.save()

      // Invalidate or delete OTP

      await Otp.query().where('userId', savedUser.id).delete()

      // send a mail
      sendMail(' Email COnfirmed', `Your email has been confirmed.`, user.email)

      return response.status(200).json({
        message: 'Email confirm succesfully',
        data: null,
        statusCode: 200,
        status: true,
      })
    } catch (error) {
      if (error.code === 'E_VALIDATION_ERROR') {
        return response.status(422).json({
          message: 'Validation failed',
          errors: error.messages,
          statusCode: 422,
          status: false,
        })
      }
      return response.status(500).json({
        message: 'Internal server error',
        error: error.message,
        statusCode: 500,
        status: false,
      })
    }
  }
  private async newOTP(length: number = 6): Promise<string> {
    let otp = ''
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10).toString() // Random digit between 0-9
    }
    return otp
  }
  private async saveOtpDatabase(email: string, otp: string): Promise<boolean | string> {
    try {
      const verifyEmail = await User.query()
        .where('email', email)
        .andWhere('emailConfirmed', false)
        .first()
      if (!verifyEmail) {
        return 'EMAIL_NOT_FOUND_OR_EMAIL_IS_ALREADY_CONFIRMED'
      }
      console.log(`verifyEmailId ${verifyEmail.id}`)
      const createdOtp = await Otp.create({
        userId: verifyEmail.id,
        expiresAt: DateTime.utc().plus({ minutes: 10 }),
        otp: await hash.make(otp),
        invalidate: false,
      })
      console.log(`verifyEmailId ${verifyEmail.id}`)
      if (createdOtp) return true
      return false
    } catch (error) {
      console.error('Error in saveOtpDatabase:', error)
      return false
    }
  }

  async passwordConfirm({ response, request, logger }: HttpContext) {
    try {
      const { email } = await request.validateUsing(ChangePassword)
      const verifyEmail = await User.query().where('email', email).first()
      logger.info('checking if user email exists')
      if (!verifyEmail) {
        return response.status(400).json({
          message: 'Bad Request',
          data: 'NO_SUCH_EMAIL',
          statusCode: 400,
          status: false,
        })
      }
      logger.info(`user email exists ${verifyEmail.email}`)
      const otp = await this.newOTP()
      logger.info(`generating new Otp ${otp}`)
      await this.saveOtpDatabase(email, otp)
      logger.info(`otp saved in db ${otp}`)

      // send a mail
      sendMail('Change Password', `Use this OTP  ${otp} to change Password.`, verifyEmail.email)

      return response.status(200).json({
        message: 'Request to change password has been sent successfully',
        data: null,
        statusCode: 200,
        status: true,
      })
    } catch (error) {
      if (error.code === 'E_VALIDATION_ERROR') {
        return response.status(422).json({
          message: 'Validation failed',
          errors: error.messages,
          statusCode: 422,
          status: false,
        })
      }
      return response.status(500).json({
        message: 'Internal server error',
        data: error.message,
        statusCode: 500,
        status: false,
      })
    }
  }

  async changePassword({ request, response, logger }: HttpContext) {
    try {
      const { password, newPassword, confirmPassword, otp, email } = await request.validateUsing(
        ChangePasswordConfirmation
      )

      const user = await User.query().where('email', email).first()
      logger.info('checking if user email exists')
      if (!user) {
        return response.status(400).json({
          message: 'Bad Request',
          data: 'NO_SUCH_EMAIL',
          statusCode: 500,
          status: false,
        })
      }

      // Verify current password
      const isValidPassword = await hash.verify(user.password, password)
      if (!isValidPassword) {
        return response.status(400).json({
          message: 'Current password is incorrect',
          data: 'INCORRECT_CURRENT_PASSORD',
          statusCode: 400,
          status: false,
        })
      }

      // Confirm new password matches confirmation
      if (newPassword !== confirmPassword) {
        return response.status(400).json({
          message: 'New password and confirmation do not match',
          data: 'NEW PASSWORD AND CONFIRM PASSWORD DO NOT MATCH',
          statusCode: 400,
          status: false,
        })
      }

      // If OTP is involved, add verification logic here

      const otpRecord = await Otp.query()
        .where('userId', user.id)
        .andWhere('invalidate', false)
        .orderBy('created_at', 'desc')
        .first()

      if (!otpRecord) {
        return response.status(404).json({
          message: 'otp not found',
          error: 'OTP_NOT_FOUND',
          statusCode: 404,
          status: false,
        })
      }

      if (DateTime.utc() > otpRecord.expiresAt) {
        await otpRecord.delete()
        return response.status(400).json({
          message: 'Bad Request',
          error: 'OTP_EXPIRED',
          statusCode: 400,
          status: false,
        })
      }
      const isValidOtp = await hash.verify(otpRecord.otp, otp.toString())
      if (!isValidOtp) {
        return response.status(400).json({
          message: 'Bad Request',
          error: 'INVALID_OTPD',
          statusCode: 400,
          status: false,
        })
      }
      // Update password
      user.password = newPassword
      const savedUser = await user.save()
      // Invalidate or delete OTP

      await Otp.query().where('userId', savedUser.id).delete()

      // send a mail
      sendMail('Password Reset', `Password Reset Successfully.`, user.email)

      return response.status(200).json({
        message: 'Password changed successfully',
        data: null,
        statusCode: 200,
        status: true,
      })
    } catch (error) {
      if (error.code === 'E_VALIDATION_ERROR') {
        return response.status(422).json({
          message: 'Validation failed',
          errors: error.messages,
          statusCode: 422,
          status: false,
        })
      }
      return response.status(500).json({
        message: 'Internal server error',
        data: error.message,
        statusCode: 500,
        status: false,
      })
    }
  }

  async uploadUserImage({ request, response, auth }: HttpContext) {
    try {
      const disk = drive.use()
      if (!(await auth.check())) {
        return response.status(403).json({
          message: 'You are not logged in',
          error: 'UN_AUTHENTICATED',
          statusCode: 403,
          status: false,
        })
      }

      const { avatar } = await request.validateUsing(UpdateAvatarValidator)

      // Enforce file size manually (if not handled by validator)
      if (avatar.size > 2 * 1024 * 1024) {
        return response.status(422).json({
          message: 'Validation failed',
          errors: 'Image too large (max 2MB)',
          statusCode: 422,
          status: false,
        })
      }

      const user = await User.find(auth.user!.id)
      if (!user) {
        return response.notFound({ message: 'User not found', status: false, statusCode: 404 })
      }

      // Delete existing image if it exists
      if (user.imagePath) {
        const oldImagePath = `${user.imagePath}`
        console.log(`path ${oldImagePath}`)
        const exists = await disk.exists(oldImagePath)
        if (!exists) {
          console.log(`image ${oldImagePath} does not exist`)
        }
        await disk.delete(oldImagePath)
      }

      // Save new image
      const fileName = `${cuid()}.${avatar.extname}`
      await avatar.move(app.makePath('storage/uploads'), {
        name: fileName,
        overwrite: true,
      })

      user.imagePath = fileName
      await user.save()

      return response.status(200).json({
        message: 'Image uploaded successfully',
        data: fileName,
        statusCode: 200,
        status: true,
      })
    } catch (error) {
      if (error.message === 'request entity too large') {
        return response.status(422).json({
          message: 'Validation failed',
          errors: 'Image Too Large',
          statusCode: 422,
          status: false,
        })
      }

      return response.status(500).json({
        message: 'Internal server error',
        data: error.message,
        statusCode: 500,
        status: false,
      })
    }
  }
}
