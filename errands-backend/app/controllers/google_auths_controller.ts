import type { HttpContext } from '@adonisjs/core/http'
import { cuid } from '@adonisjs/core/helpers'
import User from '#models/user'
import sendMail from '../helpers/send_mail.js'

export default class GoogleAuthController {
  async redirect({ ally }: HttpContext) {
    return ally.use('google').redirect()
  }

  async callback({ ally, response, logger }: HttpContext) {
    const google = ally.use('google')

    if (google.accessDenied()) {
      return response.status(401).json({
        message: 'Access was denied',
        error: 'UNAUTHORISED',
        statusCode: 401,
        status: false,
      })
    }

    if (google.stateMisMatch()) {
      return response.status(400).json({
        message: 'Bad Request',
        error: 'INVALID STATE',
        statusCode: 400,
        status: false,
      })
    }

    if (google.hasError()) {
      return response.status(400).json({
        message: 'Bad Request',
        error: google.getError(),
        statusCode: 400,
        status: false,
      })
    }

    const user = await google.user()

    const securePassword = cuid() + Date.now()

    const existingUser = await User.firstOrCreate(
      { email: user.email! },
      {
        email: user.email!,
        password: securePassword,
        loginType: 2,
        oauthId: user.id,
        emailConfirmed: true,
        roleId: 2,
      }
    )

    // Compare oauthId for returning users
    if (existingUser.oauthId !== user.id) {
      return response.status(403).json({
        message: 'OAuth ID does not match',
        error: 'OAUTH_ID_MISMATCH',
        statusCode: 403,
        status: false,
      })
    }

    // Generate token
    const token = await User.accessTokens.create(existingUser, ['*'], {
      expiresIn: '30 days',
    })

    logger.info(`Token generated for Google login: ${token}`)

    // Send mail
    sendMail(
      'Errands Account Login Notification',
      `Someone just logged into your Errands account. If this wasn't you, please change your password immediately.`,
      existingUser.email
    )

    return response.status(200).json({
      message: 'Login successful',
      token,
      statusCode: 200,
      status: true,
    })
  }
}
