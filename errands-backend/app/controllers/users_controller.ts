import type { HttpContext } from '@adonisjs/core/http'
import RoleEnums from '../enums/role_enums.js'
import User from '#models/user'
export default class UsersController {
  async all({ response, request, auth }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = 10
      const search = request.qs
      if (!auth.isAuthenticated) {
        return response.status(403).json({
          message: 'You are not logged in',
          error: 'UN_AUTHENITCATED',
          statusCode: 403,
          status: false,
        })
      }

      const user = auth.user
      if (user?.roleId === RoleEnums.USER) {
        return response.status(401).json({
          message: 'You are not logged in',
          error: 'UN_AUTHORISED',
          statusCode: 401,
          status: false,
        })
      }
      const usersQuery = User.query()
        .preload('role')
        .preload('rating')
        .preload('feedback')
        .preload('nin')
        .preload('star')
        .preload('bvn')

      if (search) {
        usersQuery
          .whereILike('email', `%${search}%`)
          .orWhereHas('profile', (profileQuery) => {
            profileQuery
              .whereILike('lastName', `%${search}%`)
              .orWhereILike('firstName', `%${search}%`)
          })
          .limit(10)
      }

      const users = await usersQuery.paginate(page, limit)
      return response.status(200).json({
        message: 'All Users',
        error: users,
        statusCode: 200,
        status: true,
      })
    } catch (error) {
      return response.status(403).json({
        message: 'You Internal Server Error',
        error: error.error,
        statusCode: 403,
        status: false,
      })
    }
  }
}
