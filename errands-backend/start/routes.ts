/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

const AuthController = () => import('#controllers/auth_controller')
const CustomersController = () => import('#controllers/customers_controller')
import router from '@adonisjs/core/services/router'

const UsersController = () => import('#controllers/users_controller')
const ProfilesController = () => import('#controllers/profiles_controller')
const RatingsController = () => import('#controllers/ratings_controller')
const GoogleAuthController = () => import('#controllers/google_auths_controller')
const BvnAndNinsController = () => import('#controllers/bvn_controller')
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
    router.post('/upload-avatar', [AuthController, 'uploadUserImage'])
    router.get('/users', [UsersController, 'all'])
    router.post('/create-errand', [CustomersController, 'createErrand'])
    router
      .put('/update-errand/:errandId', [CustomersController, 'updateErrand'])
      .where('errandId', router.matchers.number())
    router
      .patch('/update-errand/image-upload/:errandId', [CustomersController, 'uploadImages'])
      .where('errandId', router.matchers.number())
    router
      .post('/rate/:toId', [RatingsController, 'update'])
      .where('toId', router.matchers.number())
    router
      .get('/rating-aggregate/:userId', [RatingsController, 'getRatingAgregate'])
      .where('userId', router.matchers.number())
    router.get('/profiles', [ProfilesController, 'all'])
    router.post('/profiles', [ProfilesController, 'store'])
    router
      .put('/profiles/:id', [ProfilesController, 'update'])
      .where('id', router.matchers.number())
    router.delete('/logout', [AuthController, 'logout']).as('auth.logout')
    router.get('/health', [HealthChecksController])
  })
  .prefix('api/v1')
