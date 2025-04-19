import factory from '@adonisjs/lucid/factories'
import Errand from '#models/errand'
import ErrandEnum from '../../app/enums/errand_enums.js'
import ErrandStatus from '../../app/enums/errand_status.js'
import { DateTime } from 'luxon'
import PAYMENTSTATUS from '../../app/enums/payment_status.js'

export const ErrandFactory = factory
  .define(Errand, async ({ faker }) => {
    return {
      customer_id: generateRandomId(),
      runner_id: generateRandomId(),
      description: faker.lorem.sentence({ min: 50, max: 100 }),
      pickup_address: faker.location.streetAddress(true),
      pickup_location_latitude: Number.parseFloat(faker.location.latitude().toString()), // Change here
      pickup_location_longitude: Number.parseFloat(faker.location.longitude().toString()), // Change here
      dropoff_address: faker.location.streetAddress(),
      dropoff_location_latitude: Number.parseFloat(faker.location.latitude().toString()), // Change here
      dropoff_location_longitude: Number.parseFloat(faker.location.longitude().toString()),
      status: faker.helpers.arrayElement([
        ErrandStatus.PENDING,
        ErrandStatus.ASSIGNED,
        ErrandStatus.IN_PROGRESS,
        ErrandStatus.COMPLETED,
      ]),
      errand_type: faker.helpers.arrayElement([
        ErrandEnum.GROCERY_SHOPING,
        ErrandEnum.PICKUP_AND_DELIVER,
      ]),
      request_date: DateTime.now().toISO(),
      contact_person_name: faker.person.fullName(),
      contact_person_phone_no: faker.phone.number(),
      assigned_date: DateTime.now().toISO(),
      estimated_cost: Math.floor(getRandomAmount()),
      payment_status: faker.helpers.arrayElement([PAYMENTSTATUS.PENDING, PAYMENTSTATUS.COMPLETED]),
    }
  })
  .build()

function generateRandomId(): number {
  const arr: number[] = []
  for (let i = 1; i <= 50; i++) {
    arr.push(i)
  }
  const randomIndex = Math.floor(Math.random() * arr.length)
  return arr[randomIndex]
}

const getRandomAmount = (min: number = 10000, max: number = 500000): number =>
  Number.parseFloat((Math.random() * (max - min) + min).toFixed(2))

