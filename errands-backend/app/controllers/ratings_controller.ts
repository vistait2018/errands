import User from '#models/user'
import RatingValidator from '#validators/rate'
import type { HttpContext } from '@adonisjs/core/http'

import Rating from '#models/rating'

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
      await Rating.create({
        userId: userToBeRated.id,
        raterId: rater.id,
        rating,
      })
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

  async getRatingAgregate({ params, auth, response }: HttpContext) {
    try {
      if (!auth.isAuthenticated) {
        return response.status(403).json({
          message: 'You are not logged in',
          error: 'UN_AUTHENITCATED',
          statusCode: 403,
          status: false,
        })
      }

      const { userId } = params
      const totalRating = await Rating.query().where('userId', userId).exec()
      const total = totalRating.reduce((sum, rating) => +sum + +rating.rating!, 0)
      const noOfRatings = totalRating.length
      const calculatedRating = Math.floor((total / (noOfRatings * 5)) * 5)
      return response.status(200).json({
        message: 'Aggregated Rating',
        data: calculatedRating,
        statusCode: 403,
        status: false,
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Internal Server Error',
        error: error.error,
        statusCode: 500,
        status: false,
      })
    }
  }
}
