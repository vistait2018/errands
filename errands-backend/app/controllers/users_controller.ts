import type { HttpContext } from '@adonisjs/core/http'
import RoleEnums from '../enums/role_enums.js'
import User from '#models/user'
export default class UsersController {
  async all({ response, request, auth }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = 10
      const mySearch = request.qs().search

      if (!(await auth.check())) {
        return response.status(403).json({
          message: 'You are not logged in',
          error: 'UN_AUTHENITCATED',
          statusCode: 403,
          status: false,
        })
      }

      const user = auth.user

      if (user?.roleId !== RoleEnums.ADMIN) {
        return response.status(401).json({
          message: 'You are not authorised',
          error: 'UN_AUTHORISED',
          statusCode: 401,
          status: false,
        })
      }

      const usersQuery = User.query()
        .preload('role')
        .preload('errands')
        .preload('ratings')
        .preload('feedbacks')
        .preload('nin')
        .preload('star')
        .preload('bvn')
        .preload('profile')

      if (mySearch) {
        usersQuery
          .whereILike('email', `%${mySearch}%`)
          .orWhereHas('profile', (profileQuery) => {
            profileQuery
              .whereILike('last_name', `%${mySearch}%`)
              .orWhereILike('first_name', `%${mySearch}%`)
          })
          .limit(10)
      }

      const users = await usersQuery.paginate(page, limit)

      return response.status(200).json({
        message: 'All Users',
        data: users,
        statusCode: 200,
        status: true,
      })
    } catch (error) {
      return response.status(403).json({
        message: 'You Internal Server Error',
        error: error.message,
        statusCode: 403,
        status: false,
      })
    }
  }
}
