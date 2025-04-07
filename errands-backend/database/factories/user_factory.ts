import factory from '@adonisjs/lucid/factories'
import User from '#models/user'
import RoleEnums from '../../app/enums/role_enums.js'

export const UserFactory = factory
  .define(User, async ({ faker }) => {
    return {
      email: `${faker.string.alpha(6)}@gmail.com`,
      password: 'password',
      email_confirmed: faker.helpers.arrayElement([true, false]),
      roleId: faker.helpers.arrayElement([RoleEnums.ADMIN, RoleEnums.USER]),
    }
  })
  .build()
