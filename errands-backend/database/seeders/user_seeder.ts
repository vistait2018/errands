import { BaseSeeder } from '@adonisjs/lucid/seeders'
import RoleEnums from '../../app/enums/role_enums.js'
import Role from '#models/role'
import { UserFactory } from '#database/factories/user_factory'
import StarEnum from '../../app/enums/star_enums.js'
import RatingEnum from '../../app/enums/rating_enums.js'
import User from '#models/user'

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
    const users = await UserFactory.createMany(100)

    for (const user of users) {
      await user.related('star').create({
        level: StarEnum.BRASS,
        raterId: user.id,
      })

      await user.related('rating').create({
        rating: RatingEnum.NO_STAR,
        raterId: user.id,
      })

      await user.related('feedback').create({
        comments: 'Awesome errand boy',
        recepientId: 3,
      })

      await user.related('feedback').create({
        comments: 'Nice errand boy :)',
        recepientId: 40,
      })

      await user.related('feedback').create({
        comments: 'Unsatistfactory job ',
        recepientId: 50,
      })
    }
  }
}
