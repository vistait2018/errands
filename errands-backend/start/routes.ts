/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

const AuthController = () => import('#controllers/auth_controller')
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import UsersController from '#controllers/users_controller'
import ProfilesController from '#controllers/profiles_controller'
import RatingsController from '#controllers/ratings_controller'
const GoogleAuthController = () => import('#controllers/google_auths_controller')
const BvnAndNinsController = () => import('#controllers/bvn_and_nins_controller')
const HealthChecksController = () => import('#controllers/health_checks_controller')

router
  .group(() => {
    router.post('/register', [AuthController, 'register']).as('auth.register')
    router.post('/login', [AuthController, 'login']).as('auth.login')
    router.get('/me', [AuthController, 'me']).as('auth.me')
    router.post('/email-comfirmation', [AuthController, 'emailConfirmed'])
    router.post('/email-validation', [AuthController, 'validateYourEmail'])
    router.post('/password-reset-request', [AuthController, 'passwordConfirm'])
    router.post('/password-reset', [AuthController, 'changePassword'])
    router.get('/google/redirect', [GoogleAuthController, 'redirect'])
    router.get('/google/callback', [GoogleAuthController, 'callback'])
    router.post('/verify-bvn', [BvnAndNinsController, 'validateBvn'])
    router.get('/users', [UsersController, 'all'])
    router
      .post('/rate/:toId/rater/:fromId', [RatingsController, 'update'])
      .where('toId', router.matchers.number())
      .where('fromId', router.matchers.number())
    router.get('rating-aggregate/:id', [RatingsController, 'getRatingAgregate'])
    router.get('/profiles', [ProfilesController, 'all'])
    router
      .get('/profile/:userId', [ProfilesController, 'all'])
      .where('id', router.matchers.number())
    router.delete('/logout', [AuthController, 'logout']).as('auth.logout')
    router.get('/health', [HealthChecksController])
  })
  .prefix('api/v1')
