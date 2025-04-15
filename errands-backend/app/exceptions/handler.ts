import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction

  async handle(error: any, ctx: HttpContext) {
    const { response } = ctx

    // Handle 413 Payload Too Large
    if (error.status === 413 || error.code === 'E_REQUEST_ENTITY_TOO_LARGE') {
      return response.status(413).json({
        message: 'Uploaded file is too large. Maximum allowed size is 2MB.',
        statusCode: 413,
        status: false,
        error: error.messages,
      })
    }

    // Handle VineJS validation errors
    if (error.code === 'E_VALIDATION_ERROR') {
      return response.status(422).json({
        message: 'Validation failed',
        errors: error.messages,
        statusCode: 422,
        status: false,
      })
    }

    // Fallback for all other errors
    return response.status(error.status || 500).json({
      message: 'Something went wrong',
      error: this.debug ? error.message : 'Internal Server Error',
      statusCode: error.status || 500,
      status: false,
    })
  }

  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
