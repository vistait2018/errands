import { getBvnAndNINKey } from '#config/bvn'
import { BVNValidation } from '#validators/update_profile'
import type { HttpContext } from '@adonisjs/core/http'
import { request as myRequest } from 'undici'
export default class BvnAndNinsController {
  async validateBvn({ response, request, auth }: HttpContext) {
    try {
      if (!(await auth.check)) {
        return response.status(403).json({
          message: 'You are not logged in',
          error: 'UN_AUTHENITCATED',
          statusCode: 403,
          status: false,
        })
      }
      const user = await auth.authenticate()
      await user.load('profile')

      const bvn = request.validateUsing(BVNValidation)
      if (!bvn) {
        return response.status(400).json({
          message: 'BVN IS REQUIRED',
          error: 'BAD_REQUEST',
          statusCode: 400,
          status: false,
        })
      }
      const validationObject = {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        dateOfBirth: user.profile.dateOfBirth,
      }
      const payload = {
        id: bvn,
        isSubjectConsent: true,
        validation: validationObject,
        premiumBVN: true,
      }
      console.log(payload)
      const { body, statusCode } = await myRequest(
        'https://doc.youverify.co/v2/api/identity/ng/bvn',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getBvnAndNINKey()}`,
          },
          body: JSON.stringify(payload),
        }
      )
      const textBody = await body.text() // Get raw response text
      console.log(textBody)

      let result
      result = JSON.parse(textBody)
      return response.status(statusCode).send({
        message: 'BVN verification result',
        data: result,
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
        message: 'Failed to update profile',
        error: error.message,
        statusCode: 500,
        status: false,
      })
    }
  }
}
