import { healthChecks } from '#start/health'
import type { HttpContext } from '@adonisjs/core/http'

export default class HealthChecksController {
  async handle({ response, auth }: HttpContext) {
    if (!auth.isAuthenticated) {
      return response.status(403).json({
        message: 'You are not logged in',
        error: 'UN_AUTHENITCATED',
        statusCode: 403,
        status: false,
      })
    }
    const report = await healthChecks.run()

    if (report.isHealthy) {
      return response.ok(report)
    }

    return response.serviceUnavailable(report)
  }
}
