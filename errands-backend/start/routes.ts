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
import GoogleAuthController from '#controllers/google_auths_controller'
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
    router
      .group(() => {
        router.delete('/logout', [AuthController, 'logout']).as('auth.logout')
        router.get('/health', [HealthChecksController])
      })
      .use(middleware.auth())
  })
  .prefix('api/v1')
