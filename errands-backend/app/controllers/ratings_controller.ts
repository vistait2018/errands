import User from '#models/user'
import RatingValidator from '#validators/rate'
import type { HttpContext } from '@adonisjs/core/http'

import Rating from '#models/rating'

import RatingEnum from '../enums/rating_enums.js'

export default class RatingsController {
  async update({ auth, request, response, params }: HttpContext) {
    try {
      if (!(await auth.check())) {
        return response.status(403).json({
          message: 'You are not logged in',
          error: 'UN_AUTHENTICATED',
          statusCode: 403,
          status: false,
        })
      }

      const { toId } = params
      const userToBeRated = await User.find(toId)
      const rater = await User.find(await auth.user?.id)

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
          message: 'The rater is not found',
          error: 'RATER_NOT_FOUND',
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
      await userToBeRated.load('profile')
      await userToBeRated?.load('errands')
      await userToBeRated.load('ratings')
      await userToBeRated?.load('feedbacks')
      if (Array.isArray(userToBeRated.ratings)) {
        for (const mrating of userToBeRated.ratings) {
          if (mrating.rating !== undefined && mrating.rating !== null) {
            const enumKey = RatingEnum[mrating.rating as unknown as keyof typeof RatingEnum]
            if (enumKey) {
              mrating.rating = enumKey // Safely map to enum string value
            }
          }
        }
      }
      return response.status(200).json({
        message: 'Rating accepted',
        data: userToBeRated,
        statusCode: 200,
        status: true,
      })
    } catch (error) {
      console.log(error.message)
      return response.status(400).json({
        message: 'Invalid rating',
        error: error.message,
        statusCode: 400,
        status: false,
      })
    }
  }

  async getRatingAgregate({ params, auth, response }: HttpContext) {
    try {
      // Check if the user is authenticated
      if (!(await auth.check())) {
        return response.status(403).json({
          message: 'You are not logged in',
          error: 'UN_AUTHENITCATED',
          statusCode: 403,
          status: false,
        })
      }
      const user = await User.find(params?.userId)
      await user?.load('profile')
      await user?.load('errands')
      await user?.load('bvn')
      await user?.load('nin')
      await user?.load('stars')
      await user?.load('ratings')
      await user?.load('feedbacks')
      const totalRating = await Rating.query().where('userId', user!.id).exec()
      const total = totalRating.reduce((sum, rating) => +sum + +rating.rating!, 0)
      const noOfRatings = totalRating.length
      const calculatedRating = Math.floor((total / (noOfRatings * 5)) * 5)
      if (user) {
        user.agregatedRating = RatingEnum[calculatedRating]
      }
      return response.status(200).json({
        message: 'Your info retrieved successfully',
        data: user,
        statusCode: 200,
        status: true,
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Internal server error',
        error: error.message,
        statusCode: 500,
        status: false,
      })
    }
  }

}
