import Errand from '#models/errand'
import { UpdateErrand, VerifyErrand } from '#validators/errand'
import { UpdateImagesCustomer } from '#validators/errand'
import { cuid } from '@adonisjs/core/helpers'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import ErrandStatus from '../enums/errand_status.js'
import PAYMENTSTATUS from '../enums/payment_status.js'
import drive from '@adonisjs/drive/services/main'
import { inject } from '@adonisjs/core'
import NotificationService from '#services/notification_service'
import db from '@adonisjs/lucid/services/db'
import Runner from '#models/runner'

@inject()
export default class CustomersController {
  constructor(protected notificationService: NotificationService) {}
  async createErrand({ response, request, auth }: HttpContext) {
    try {
      if (!(await auth.check())) {
        return response.status(403).json({
          message: 'You are not logged in',
          error: 'UN_AUTHENTICATED',
          statusCode: 403,
          status: false,
        })
      }
      const customerId = await auth.user!.id

      const data = await request.validateUsing(VerifyErrand)
      const objExists = await Errand.query()
        .where('customer_id', customerId)
        .andWhere('description', data.description)
        .andWhere('pickup_location_latitude', data.pickupLocationLatitude)
        .andWhere('pickup_location_longitude', data.pickupLocationLongitude)
        .andWhere('pickup_location_latitude', data.pickupLocationLatitude)
        .andWhere('pickup_location_longitude', data.pickupLocationLongitude)
        .andWhereIn('status', ['pending', 'assigned', 'in_progress'])
        .first()

      if (objExists) {
        let errandMessage = ''
        if (objExists.status === 'pending') {
          errandMessage =
            'You cannot have two similar errands Try editing errand since it is not assigned.'
        } else {
          errandMessage = 'You cannot have two similar errands'
        }

        return response.status(422).json({
          message: 'Errand Exists',
          errors: errandMessage,
          statusCode: 422,
          status: false,
        })
      }

      const errandData = { ...data, radiusKm: 10, customerId: customerId }
      const profile = await auth.user?.load('profile')
      if (!profile) {
        return response.status(404).json({
          message: 'You need to update you profile first',
          errors: 'PROFILE_NOT_AVALAIBLE',
          statusCode: 404,
          status: false,
        })
      }
      const createErrand = await Errand.create(errandData)

      return response.status(200).json({
        message: 'Errand created',
        statusCode: createErrand,
        status: false,
      })
    } catch (error) {
      if (error.code === 'E_VALIDATION_ERROR') {
        return response.status(422).json({
          message: 'Validation failed',
          errors: error.messages,
          statusCode: 422,
          status: false,
        })
      }
      return response.status(500).json({
        message: 'Internal Server Error',
        statusCode: error.message,
        status: false,
      })
    }
  }

  private async getGeoLocationFromIP(ip: string = '8.8.8.8') {
    try {
      const res = await fetch(`https://ipapi.co/${ip}/json/`)
      const data: any = await res.json()

      return {
        country: data.country_name,
        latitude: data.latitude,
        longitude: data.longitude,
      }
    } catch (err) {
      console.error('GeoLocation Error:', err)
      return null
    }
  }

  async updateErrand({ response, request, auth, params }: HttpContext) {
    try {
      if (!(await auth.check())) {
        return response.status(403).json({
          message: 'You are not logged in',
          error: 'UN_AUTHENTICATED',
          statusCode: 403,
          status: false,
        })
      }
      const errandId = params.errandId
      console.log(errandId)
      const customerId = auth.user!.id
      const data = await request.validateUsing(UpdateErrand)
      const errandToUpdate = await Errand.find(errandId)

      if (errandToUpdate && customerId !== errandToUpdate?.customerId) {
        return response.status(401).json({
          message: 'Not Authorised to do this',
          data: null,
          statusCode: 401,
          status: false,
        })
      }
      if (errandToUpdate) {
        errandToUpdate.status = ErrandStatus.PENDING
        errandToUpdate.paymentStatus = PAYMENTSTATUS.PENDING
        await errandToUpdate.merge(data).save()
        return response.status(200).json({
          message: 'Errand updated',
          data: errandToUpdate,
          statusCode: 200,
          status: true,
        })
      } else {
        return response.status(404).json({
          message: 'Errand not updated',
          data: null,
          statusCode: 404,
          status: false,
        })
      }
    } catch (error) {
      if (error.code === 'E_VALIDATION_ERROR') {
        return response.status(422).json({
          message: 'Validation failed',
          errors: error.messages,
          statusCode: 422,
          status: false,
        })
      }
      return response.status(500).json({
        message: 'Internal Server Error',
        statusCode: error.message,
        status: false,
      })
    }
  }


  // async payRunner({ response, request, auth, params }: HttpContext){

  // }

  // async rateRunner({ response, request, auth, params }: HttpContext){

  // }

  async acceptRunner({ response, auth, params }: HttpContext) {
    try {
      if (!(await auth.check())) {
        return response.status(403).json({
          message: 'You are not logged in',
          error: 'UN_AUTHENTICATED',
          statusCode: 403,
          status: false,
        })
      }
      const errandId = params.errandId
      const runnerId = params.runnerId
      console.log(errandId)
      const customerId = auth.user!.id

      const errandToUpdate = await Errand.find(errandId)
      const runner = await Runner.find(runnerId)
      if (errandToUpdate && customerId !== errandToUpdate?.customerId) {
        return response.status(401).json({
          message: 'Not Authorised to do this',
          data: null,
          statusCode: 401,
          status: false,
        })
      }

      if (!runner) {
        return response.status(404).json({
          message: 'The runner is not found',
          data: null,
          statusCode: 404,
          status: false,
        })
      }
      await auth.user?.load('profile')
      const notifcationData = {
        senderId: auth.user!.id,
        recipientId: runner.runnerId,
        message: `Your request has been approved to run the errand by
         on ${errandToUpdate?.assignedDate} by
         ${auth.user?.profile.firstName} ${auth.user?.profile.firstName}
         with phoneNo ${auth.user?.profile.phoneNumber} your contact person is
         ${errandToUpdate?.contactPersonName} and his phone no is
         ${errandToUpdate?.contactPersonPhoneNo}    `,
        status: 'pending',
      }
      if (errandToUpdate) {
        errandToUpdate.status = ErrandStatus.PENDING
        errandToUpdate.paymentStatus = PAYMENTSTATUS.PENDING
        errandToUpdate.runnerId = runner.runnerId
        await db.transaction(async (trx) => {
          errandToUpdate.useTransaction(trx)
          await errandToUpdate.merge(data).save()
          const notification = await this.notificationService.createNotification(notifcationData)
          notification.useTransaction(trx)
          trx.commit()
          return response.status(200).json({
            message: 'Errand updated',
            data: errandToUpdate,
            statusCode: 200,
            status: true,
          })
        })
      } else {
        return response.status(404).json({
          message: 'Errand not updated',
          data: null,
          statusCode: 404,
          status: false,
        })
      }
    } catch (error) {
      if (error.code === 'E_VALIDATION_ERROR') {
        return response.status(422).json({
          message: 'Validation failed',
          errors: error.messages,
          statusCode: 422,
          status: false,
        })
      }
      return response.status(500).json({
        message: 'Internal Server Error',
        statusCode: error.message,
        status: false,
      })
    }
  }

  async stopErrandUser({ response, auth, params }: HttpContext) {
    try {
      if (!(await auth.check())) {
        return response.status(403).json({
          message: 'You are not logged in',
          error: 'UN_AUTHENTICATED',
          statusCode: 403,
          status: false,
        })
      }
      const erranId = params.errandId
      const canStopErrand = await Errand.query()
        .where('id', erranId)
        .andWhere('is_canceled', false)
        .andWhere('status', 'pending')
        .first()

      if (!canStopErrand) {
        return response.status(404).json({
          message: `Errand cannot be stop.`,
          error: 'ERRAND_CANNOT_BE_STOPPED',
          statusCode: 400,
          status: false,
        })
      }
      console.log(`auth user id ${auth.user!.id}`)
      console.log(`customerId ${canStopErrand.customerId}`)
      if (auth.user!.id !== canStopErrand.customerId) {
        return response.status(401).json({
          message: 'NOT AUTHOURISED ',
          error: 'UNAUTHORISED',
          statusCode: 400,
          status: false,
        })
      }
      canStopErrand.isCanceled = false
      const stopedErrand = await canStopErrand.save()
      return response.status(200).json({
        message: 'Errand Stopped sucessfully',
        data: stopedErrand,
        statusCode: 500,
        status: false,
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Internal Server Error',
        error: error.message,
        statusCode: 500,
        status: false,
      })
    }
  }

  async uploadImages({ response, request, auth, params }: HttpContext) {
    try {
      const disk = drive.use()
      const newImages: string[] = []
      const errandId = await params.errandId
      if (!(await auth.check())) {
        return response.status(403).json({
          message: 'You are not logged in',
          error: 'UN_AUTHENTICATED',
          statusCode: 403,
          status: false,
        })
      }

      const errand = await Errand.findOrFail(errandId)
      console.log(errand)
      const { documents } = await request.validateUsing(UpdateImagesCustomer)

      if (documents) {
        // Delete existing images
        if (errand.images) {
          const existingImages = errand.images.split(',')
          for (const img of existingImages) {
            const oldImagePath = img
            const exists = await disk.exists(oldImagePath)
            if (exists) {
              await disk.delete(oldImagePath)
            } else {
              console.log(`Image ${oldImagePath} does not exist`)
            }
          }
        }

        // Save new images
        for (const image of documents) {
          if (image.size > 2 * 1024 * 1024) {
            return response.status(422).json({
              message: 'Validation failed',
              errors: 'Image too large (max 2MB)',
              statusCode: 422,
              status: false,
            })
          }

          const fileName = `${cuid()}.${image.extname}`
          newImages.push(fileName)
          await image.move(app.makePath('storage/uploads'), {
            name: fileName,
            overwrite: true,
          })
        }
      }

      errand.images = newImages.join(',')
      await errand.save()

      return response.status(200).json({
        message: 'Errand images uploaded successfully',
        data: errand,
        statusCode: 200,
        status: true,
      })
    } catch (error) {
      if (error.code === 'E_VALIDATION_ERROR') {
        return response.status(422).json({
          message: 'Validation failed',
          errors: error.messages,
          statusCode: 422,
          status: false,
        })
      }

      if (error.message === 'request entity too large') {
        return response.status(413).json({
          message: 'Uploaded file is too large. Max allowed size is 2MB.',
          status: false,
          error: error.messages,
          data: null,
        })
      }
      return response.status(500).json({
        message: 'Internal Server Error',
        error: error.message,
        statusCode: 500,
        status: false,
      })
    }
  }

  async stopErrandAdmin({ response, auth, params }: HttpContext) {
    try {
      if (!(await auth.check())) {
        return response.status(403).json({
          message: 'You are not logged in',
          error: 'UN_AUTHENTICATED',
          statusCode: 403,
          status: false,
        })
      }

      const user = await auth.authenticate()
      await user.load('role') // 👈 This is the key fix
      const erranId = params.errandId
      const canStopErrand = await Errand.query()
        .where('id', erranId)
        .andWhere('is_canceled', false)
        .first()

      if (!canStopErrand) {
        return response.status(404).json({
          message: 'Errand not  found .Errand is probably cancelled',
          error: 'ERRAND_NOT_FOUND ',
          statusCode: 400,
          status: false,
        })
      }
      if (canStopErrand.isCanceled !== false && canStopErrand.runnerId !== null) {
        return response.status(404).json({
          message: 'Errand has Stopped Already',
          error: 'ERRAND_CANNOT_BE_STOPED',
          statusCode: 404,
          status: false,
        })
      }
      canStopErrand.isCanceled = true
      const stopedErrand = await canStopErrand.save()
      return response.status(200).json({
        message: 'Errand Stopped sucessfully',
        data: stopedErrand,
        statusCode: 200,
        status: true,
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Internal Server Error',
        error: error.message,
        statusCode: 500,
        status: false,
      })
    }
  }


}
