import User from '#models/user'
import RatingValidator from '#validators/rate'
import type { HttpContext } from '@adonisjs/core/http'

export default class RatingsController {
  async update({ auth, request, response, params }: HttpContext) {
    try {
      
      if (!auth.isAuthenticated) {
        return response.status(403).json({
          message: 'You are not logged in',
          error: 'UN_AUTHENITCATED',
          statusCode: 403,
          status: false,
        })
      }
      const { toId, fromId } = params
      const userToBeRated = await User.find(toId)
      const rater = await User.find(fromId)
      if (!userToBeRated) {
        return response.status(404).json({
          message: 'The errand guy you want to rate is not found',
          error: 'USER_NOT_FOUND',
          statusCode: 404,
          status: false,
        })
      }

      if (!rater) {
        return response.status(404).json({
          message: 'The rater  is not found',
          error: 'USER_NOT_FOUND',
          statusCode: 404,
          status: false,
        })
      }
      // Validate the rating using the RatingValidator
      const validatedData = await request.validateUsing(RatingValidator)

      // Assuming you're processing the rating here
      const { rating } = validatedData

      return response.status(200).json({
        message: 'Rating accepted',
        data: { rating },
        statusCode: 200,
        status: true,
      })
    } catch (error) {
      return response.status(400).json({
        message: 'Invalid rating',
        error: error.messages,
        statusCode: 400,
        status: false,
      })
    }
  }
}
