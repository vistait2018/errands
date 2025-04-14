import factory from '@adonisjs/lucid/factories'
import Runner from '#models/runner'
import ErrandStatus from '../../app/enums/errand_status.js'
import Errand from '#models/errand'
const errands = await Errand.all()
export const RunnerFactory = factory

  .define(Runner, async ({ faker }) => {
    const errandsToAssign = []

    for (const e of errands) {
      if (e.errand_type !== ErrandStatus.PENDING.toString()) {
        const errandTomake = {
          runner_id: e.runnerId,
          available_date: Date.now(),
          available_time_start: new Date().getTime(),
          available_time_end:
          location_longitude: faker.location.longitude(),
          location_latitude: faker.location.latitude(),
          radius_km: getRandomInt(),
        }
        errandsToAssign.push(errandTomake)
      }
    }
    console.log()
    await Runner.createMany(errandsToAssign)
    return errandsToAssign
  })
  .build()

const getRandomInt = () => Math.floor(Math.random() * (200 - 20 + 1)) + 20
