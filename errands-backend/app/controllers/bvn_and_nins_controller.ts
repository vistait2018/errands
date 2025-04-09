import { getBvnAndNINKey } from '#config/bvn'
import type { HttpContext } from '@adonisjs/core/http'
import { request as myRequest } from 'undici'
export default class BvnAndNinsController {
  async validateBvn({ response, request, auth }: HttpContext) {
    if (!(await auth.isAuthenticated)) {
      return response.status(403).json({
        message: 'You are not logged in',
        error: 'UN_AUTHENITCATED',
        statusCode: 403,
        status: false,
      })
    }
    const user = await auth.user!

    const bvn = request.input('bvn')
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
      lastName: user.profile.lastname,
      dateOfBirth: user.profile.dateOfBirth,
    }
    const payload = {
      id: bvn,
      isSubjectConsent: true,
      validation: validationObject,
      premiumBVN: true,
    }
    const { body, statusCode } = await myRequest(
      'https://doc.youverify.co/v2/api/identity/ng/bvn',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getBvnAndNINKey()}`,
        },
        body: JSON.stringify(payload),
      }
    )

    const result = await body.json()

    return response.status(statusCode).send({
      message: 'BVN verification result',
      data: result,
    })
  }
}
