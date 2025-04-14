import { type HttpContext } from '@adonisjs/core/http'
import RoleEnums from '../enums/role_enums.js'
import Profile from '#models/profile'
import { UpdateProfileValidator } from '#validators/update_profile'

export default class ProfilesController {
  async all({ response, request, auth }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = 10
      const search = request.qs().search
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
      const profilesQuery = Profile.query().preload('bankInfo')

      if (search) {
        profilesQuery
          .where('last_name', 'like', `%${search}%`)
          .orWhere('first_name', 'like', `%${search}%`)
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
      return response.status(500).json({
        message: 'You Internal Server Error',
        error: error.message,
        statusCode: 500,
        status: false,
      })
    }
  }
  async store({ request, response, auth }: HttpContext) {
    try {
      const data = await request.validateUsing(UpdateProfileValidator)

      if (!(await auth.check())) {
        return response.status(403).json({
          message: 'You are not logged in',
          error: 'UN_AUTHENITCATED',
          statusCode: 403,
          status: false,
        })
      }
      const user = await auth.user
      data.userId = user!.id

      const profile = await Profile.create(data)

      // Load related user and bankInfo
      await profile.load('user')
      await profile.load('bankInfo')

      return response.status(201).json({
        message: 'Profile created successfully',
        data: profile,
        statusCode: 201,
        status: true,
      })
    } catch (error) {
      if (error.code === 'E_VALIDATION_ERROR') {
        return response.status(422).json({
          message: 'Validation failed',
          errors: error.messages, // 👈 Full list of field-specific messages
          statusCode: 422,
          status: false,
        })
      }
      return response.status(500).json({
        message: 'Internal Server Error',
        error: error.message,
        statusCode: 500,
        status: false,
      })
    }
  }
  async update({ request, response, auth, params }: HttpContext) {
    try {
      // Check if the user is authenticated
      if (!(await auth.check())) {
        return response.status(403).json({
          message: 'You are not logged in',
          error: 'UN_AUTHENTICATED',
          statusCode: 403,
          status: false,
        })
      }

      const user = auth.user

      // Get profile by ID from route param
      const profile = await Profile.findOrFail(params.id)

      await profile.load('user')
      await profile.load('bankInfo')

      // Optional: Check if the authenticated user owns the profile
      if (profile.userId !== user!.id) {
        return response.status(401).json({
          message: 'You are not authorized to update this profile',
          error: 'UN_AUTHORIZED',
          statusCode: 401,
          status: false,
        })
      }

      // Validate the request data
      const validatedData = await request.validateUsing(UpdateProfileValidator)

      // Merge and save
      profile.merge(validatedData)
      await profile.save()

      return response.status(200).json({
        message: 'Profile updated successfully',
        data: profile,
        statusCode: 200,
        status: true,
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
