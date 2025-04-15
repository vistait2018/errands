import Errand from '#models/errand'
import { UpdateErrand, VerifyErrand } from '#validators/errand'
import { UpdateImagesCustomer } from '#validators/errand'
import { cuid } from '@adonisjs/core/helpers'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import ErrandStatus from '../enums/errand_status.js'
import PAYMENTSTATUS from '../enums/payment_status.js'
import drive from '@adonisjs/drive/services/main'

export default class CustomersController {
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

      const createErrand = await Errand.create(errandData)
      const { avatar } = await request.validateUsing(UpdateAvatarCustomer)
      if (avatar) {
        // Enforce file size manually (if not handled by validator)
        if (avatar.size > 2 * 1024 * 1024) {
          return response.status(422).json({
            message: 'Validation failed',
            errors: 'Image too large (max 2MB)',
            statusCode: 422,
            status: false,
          })
        }

        const fileName = `${cuid()}.${avatar.extname}`
        await avatar!.move(app.makePath('storage/uploads'), {
          name: fileName,
          overwrite: true,
        })
        createErrand.images = fileName
        createErrand.save()
      }
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

  async uploadImages({ response, request, auth, params }: HttpContext) {
    try {
      const disk = drive.use()
      const newImages: string[] = []
      const errandId = await params.errandId
      //console.log(params.errandId)
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
}
