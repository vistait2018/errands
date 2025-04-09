import type { HttpContext } from '@adonisjs/core/http'
import RoleEnums from '../enums/role_enums.js'
import Profile from '#models/profile'
import { UpdateProfileValidator } from '#validators/update_profile'

export default class ProfilesController {
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

      const user = await auth.user
      if (user?.roleId !== RoleEnums.ADMIN) {
        return response.status(401).json({
          message: 'You are not authorised',
          error: 'UN_AUTHORISED',
          statusCode: 401,
          status: false,
        })
      }
      const profilesQuery = Profile.query().preload('bankInfo').preload('user')

      if (search) {
        profilesQuery
          .whereILike('lastName', `%${search}%`)
          .orWhereILike('firstName', `%${search}%`)
          .limit(10)
      }

      const profiles = await profilesQuery.paginate(page, limit)
      return response.status(200).json({
        message: 'All profiles',
        error: profiles,
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
  async update({ request, response, auth, params }: HttpContext) {
    try {
      // Check if the user is authenticated
      const user = auth.user
      if (!user) {
        return response.status(403).json({
          message: 'You are not logged in',
          error: 'UN_AUTHENTICATED',
          statusCode: 403,
          status: false,
        })
      }

      // Ensure the logged-in user is the one attempting to update the profile
      if (params.id !== user.profile.userId) {
        return response.status(401).json({
          message: 'You are not authorized to update this profile',
          error: 'UN_AUTHORIZED',
          statusCode: 401,
          status: false,
        })
      }

      // Fetch the user's profile
      const profile = await Profile.query().where('userId', user.id).firstOrFail()

      // Validate the request using the UpdateProfileValidator
      const validatedData = await request.validateUsing(UpdateProfileValidator)

      // Merge validated data with the profile
      profile.merge(validatedData)

      // Save the updated profile
      await profile.save()

      return response.status(200).json({
        message: 'Profile updated successfully',
        data: profile,
        statusCode: 200,
        status: true,
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Failed to update profile',
        error: error.message,
        statusCode: 500,
        status: false,
      })
    }
  }
}
