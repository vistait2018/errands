import factory from '@adonisjs/lucid/factories'
import Teter from '#models/teter'

export const TeterFactory = factory
  .define(Teter, async ({ faker }) => {
    return {}
  })
  .build()