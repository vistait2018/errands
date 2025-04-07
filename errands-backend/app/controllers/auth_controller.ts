import User from '#models/user'
import { LoginValidator, RegisterValidator } from '#validators/auth'
import type { HttpContext } from '@adonisjs/core/http'
import { errors as authErrors } from '@adonisjs/auth'

export default class AuthController {
  async register({ request, response, logger }: HttpContext) {
    const data = await request.validateUsing(RegisterValidator)
    try {
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
    } catch (ex) {
      return response.status(500).json({
        message: 'Internal server error',
        error: ex.message,
        statusCode: 500,
        status: false,
      })
    }
  }
}
