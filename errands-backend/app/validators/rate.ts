import  vine from '@vinejs/vine'
import RatingEnum from '../enums/rating_enums.js'

const RatingValidator = vine.compile(
  vine.object({
    rating: vine.number().min(1).max(6),
  })
)

export default RatingValidator
