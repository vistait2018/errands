import type { HttpContext } from '@adonisjs/core/http'

export function ensureAuthenticated({ auth, response }: HttpContext) {
  if (!auth.isAuthenticated) {
    return response.status(403).json({
      message: 'You are not logged in',
      error: 'UN_AUTHENTICATED',
      statusCode: 403,
      status: false,
    })
  }

  return true // or return true if you prefer
}
