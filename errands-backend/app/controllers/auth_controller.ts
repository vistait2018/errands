import User from '#models/user'
import { LoginValidator, RegisterValidator, ValidateOTPAndEmail } from '#validators/auth'
import type { HttpContext } from '@adonisjs/core/http'
import { errors as authErrors } from '@adonisjs/auth'
import mail from '@adonisjs/mail/services/main'
import Otp from '#models/otp'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'
import router from '@adonisjs/core/services/router'

export default class AuthController {
  async register({ request, response, logger }: HttpContext) {
    try {
      const data = await request.validateUsing(RegisterValidator)
      const user = await User.create(data)
      logger.info('Registering user ' + user)
      return response.status(201).json({
        message: 'User Registerd',
        data: user,
        statusCode: 201,
        status: false,
      })
    } catch (error) {
      logger.error('Error Registering user ' + error)
      return response.status(401).json({
        message: 'Bad Request',
        statusCode: 401,
        status: false,
      })
    }
  }
  async login({ request, response, logger }: HttpContext) {
    try {
      logger.info('Validating credentials')
      const { email, password } = await request.validateUsing(LoginValidator)
      logger.info('Credentials validated')
      const userExists = await User.findBy('email', email)

      if (!userExists) {
        return response.status(401).json({
          message: 'Invalid email or password',
          data: null,
          statusCode: 401,
          status: false,
        })
      }
      // Verify user credentials
      const user = await User.verifyCredentials(email, password)
      // Generate authentication token
      const token = await User.accessTokens.create(user, ['*'], {
        expiresIn: '30 days',
      })

      logger.info(`Token generated: ${token}`)

      return response.status(200).json({
        message: 'Login successful',
        token: token,
        statusCode: 200,
        status: true,
      })
    } catch (error) {
      logger.error(error.message)
      return response.status(401).json({
        message: 'Bad Request',
        statusCode: 401,
        status: false,
      })
    }
  }

  async logout({ auth, response, logger }: HttpContext) {
    try {
      const user = auth.user!

      if (!user) {
        return response.status(401).json({
          message: "You can'/t log out since you are not logged in",
          data: 'Unauthenticated',
          statusCode: 404,
          status: false,
        })
      }
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)
      logger.info('Access token deleted ')
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
          data: 'Unauthenticated',
          statusCode: 404,
          status: false,
        })
      }

      return response.status(500).json({
        message: `Error during logout ${error}`,
        statusCode: 500,
        status: false,
      })
    }
  }

  async me({ auth, response }: HttpContext) {
    try {
      // Check if the user is authenticated
      if (await auth.check()) {
        const user = await User.find(auth.user!.id)
        await user?.load('profile')
        await user?.load('bvn')
        await user?.load('nin')
        await user?.load('star')
        await user?.load('rating')
        return response.status(200).json({
          message: 'Your info retrieved successfully',
          data: user,
          statusCode: 200,
          status: true,
        })
      }

      return response.status(401).json({
        message: 'You are not logged in',
        data: null,
        statusCode: 401,
        status: false,
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
      const email = request.input('email')
      console.log('email ' + email)
      const saved = await this.saveOtpDatabase(email, otp)
      console.log(` saved ${saved}`)
      if (saved === 'EMAIL_NOT_FOUND_OR_EMAIL_IS_ALREADY_CONFIRMED') {
        return response.status(400).json({
          message: 'Bad Request',
          error: 'Email not found or Email has already been confirmed',
          statusCode: 400,
          status: false,
        })
      }

      await mail.send((message) => {
        message
          .to('jidedorcas@gmail.com')
          .from('test@alphaclinic.com.ng')
          .subject(' Errands OTP ')
          .html(`<p>Your OTP code is <strong>${otp}</strong>. It will expire in 10 minutes.</p>`)
      })
      return response.status(200).json({
        message: 'Email sent successful: OTP sent for EMail Confirmation',
        data: null,
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
      await mail.send((message) => {
        message
          .to('jidedorcas@gmail.com')
          .from('test@alphaclinic.com.ng')
          .subject(' Email COnfirmed ').html(`<p>Your email has been confirmed.</p>
            <p><a href="${router.makeUrl('auth.login')}">Click here to login</a></p>
          `)
      })
      return response.status(200).json({
        message: 'Email confirm succesfully',
        data: null,
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
}
