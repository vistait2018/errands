import { getBvnAndNINKey } from '#config/bvn'
import { NINValidation } from '#validators/update_profile'
import type { HttpContext } from '@adonisjs/core/http'
import { request as myRequest } from 'undici'

export default class NinValidationController {
  async validateNin({ response, request, auth }: HttpContext) {
    try {
      if (!(await auth.check)) {
        return response.status(403).json({
          message: 'You are not logged in',
          error: 'UN_AUTHENTICATED',
          statusCode: 403,
          status: false,
        })
      }

      const user = await auth.authenticate()
      await user.load('profile')

      // Validate the NIN
      const nin = await request.validateUsing(NINValidation)
      if (!nin) {
        return response.status(400).json({
          message: 'NIN IS REQUIRED',
          error: 'BAD_REQUEST',
          statusCode: 400,
          status: false,
        })
      }

      // Validation object with user profile data (first name, last name, and date of birth)
      const validationObject = {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        dateOfBirth: user.profile.dateOfBirth,
      }

      // Payload for the API request
      const payload = {
        id: nin.nin, // This is the NIN passed by the user
        isSubjectConsent: true, // Consent flag
        validation: validationObject, // Validation details
        premiumNIN: true, // Ensure you're using premium NIN validation
      }

      console.log(payload)

      // Send request to the NIN verification API
      const { body, statusCode } = await myRequest(
        'https://doc.youverify.co/v2/api/identity/ng/nin', // NIN validation endpoint (example)
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getBvnAndNINKey()}`, // Use your NIN API key
          },
          body: JSON.stringify(payload),
        }
      )

      // Parse the response as JSON
      const result = await body.json()

      // Return the result to the client
      return response.status(statusCode).send({
        message: 'NIN verification result',
        data: result,
      })
    } catch (error) {
      // Handle validation errors
      if (error.code === 'E_VALIDATION_ERROR') {
        return response.status(422).json({
          message: 'Validation failed',
          errors: error.messages,
          statusCode: 422,
          status: false,
        })
      }

      // General error handling
      return response.status(500).json({
        message: 'Failed to validate NIN',
        error: error.message,
        statusCode: 500,
        status: false,
      })
    }
  }
}
