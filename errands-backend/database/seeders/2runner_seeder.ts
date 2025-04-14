import Runner from '#models/runner'
import Errand from '#models/errand'
import ErrandStatus from '../../app/enums/errand_status.js'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { faker } from '@faker-js/faker'
import { DateTime } from 'luxon'

export default class RunnerSeeder extends BaseSeeder {
  public async run() {
    const errands = await Errand.all()
    const errandsToAssign = []

    for (const e of errands) {
      if (e.errandType !== ErrandStatus.PENDING.toString()) {
        errandsToAssign.push({
          runnerId: e.runnerId,
          available_date: new Date(),
          available_time_start: DateTime.now().toISO(),
          available_time_end: this.addHoursToDate(this.getTimeRandomInt()),
          location_longitude: faker.location.longitude(),
          location_latitude: faker.location.latitude(),
          radius_km: this.getRandomInt(),
        })
      }
    }

    await Runner.createMany(errandsToAssign)
  }

  private getTimeRandomInt(): number {
    return Math.floor(Math.random() * (10 - 20 + 1)) + 5
  }
  private getRandomInt() {
    return Math.floor(Math.random() * (200 - 20 + 1)) + 20
  }

  private addHoursToDate(hoursToAdd: number) {
    const currentDate = DateTime.now()

    const futureDate = currentDate.plus({ hours: hoursToAdd })

    return futureDate.toISO()
  }
}
