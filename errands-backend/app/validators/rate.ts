import vine from '@vinejs/vine'

const RatingValidator = vine.compile(
  vine.object({
    rating: vine.number().min(1).max(6),
  })
)

export default RatingValidator
