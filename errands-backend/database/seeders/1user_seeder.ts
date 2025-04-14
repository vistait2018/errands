import { BaseSeeder } from '@adonisjs/lucid/seeders'
import RoleEnums from '../../app/enums/role_enums.js'
import Role from '#models/role'
import { UserFactory } from '#database/factories/user_factory'

import RatingEnum from '../../app/enums/rating_enums.js'
import User from '#models/user'

import { ErrandFactory } from '#database/factories/errands_factory'

export default class extends BaseSeeder {
  async run() {
    await Role.create({
      roleName: RoleEnums.ADMIN,
    })
    await Role.create({
      roleName: RoleEnums.USER,
    })
    await User.create({
      email: 'jidedorcas@gmail.com',
      password: 'password',
      emailConfirmed: true,
      roleId: RoleEnums.ADMIN,
    })
    await UserFactory.createMany(100)
    await ErrandFactory.createMany(30)
    //await RunnerFactory
    const user = await User.find(5)

    if (user) {
      await user.related('ratings').create({
        errandId: 5,
        rating: RatingEnum.NO_STAR,
        raterId: 67,
      })

      await user.related('feedbacks').create({
        errandId: 5,
        comments: 'Awesome errand boy',
        recepientId: 3,
      })

      await user.related('feedbacks').create({
        errandId: 6,
        comments: 'Nice errand boy :)',
        recepientId: 40,
      })

      await user.related('feedbacks').create({
        errandId: 7,
        comments: 'Unsatistfactory job ',
        recepientId: 50,
      })
    }
  }
}
