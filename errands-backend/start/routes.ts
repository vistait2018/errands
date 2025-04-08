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
    router
      .group(() => {
        router.delete('/logout', [AuthController, 'logout']).as('auth.logout')
        router.get('/health', [HealthChecksController])
      })
      .use(middleware.auth())
  })
  .prefix('api/v1')
