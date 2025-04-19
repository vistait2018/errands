import type { HttpContext } from '@adonisjs/core/http'
import { getNearbyErrands } from '../helpers/get_nearby_errand.js'
import { RunnerValidator } from '#validators/runner'
import { DateTime } from 'luxon'
import Runner from '#models/runner'
import Errand from '#models/errand'
import ErrandStatus from '../enums/errand_status.js'
import RunnerResponse from '#models/dtos/runner_response'
import User from '#models/user'
import Profile from '#models/profile'
import Location from '#models/dtos/location'
import db from '@adonisjs/lucid/services/db'
import { getNearbyErrandsUsingDropOffLocations } from '../helpers/get_errands_using_dropoff.js'
import { inject } from '@adonisjs/core'
import NotificationService from '#services/notification_service'
@inject()
export default class RunnersController {
  constructor(protected notificationService: NotificationService) {}

  async runErrand({ request, response, auth, params }: HttpContext) {
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
      const errand = await Errand.findOrFail(errandId)
      const payload = await request.validateUsing(RunnerValidator)
      const withinArea = await this.getIfWithinTenMilesRadius(
        new Location(
          errand.pickupLocationLatitude,
          errand.pickupLocationLongitude,
          errand.dropoffLocationLatitude,
          errand.dropoffLocationLongitude,
          payload.locationLatitude,
          payload.locationLongitude
        ),
        errand.radiusKm
      )
      if (withinArea.status === false) {
        return response.status(404).json({
          message: `You are  not specified within km radius. You are ${withinArea.distance}km away`,
          error: 'OUT_OF_KM_RADIUS',
          statusCode: 404,
          status: false,
        })
      }
      const availableDate = DateTime.fromISO(payload.availableDate.toISOString())
      const timeEnds = DateTime.fromISO(payload.availableTimeEnd.toISOString())
      const timeStarts = DateTime.fromISO(payload.availableTimeStart.toISOString())
      if (availableDate > timeEnds) {
        return response.status(422).json({
          message: 'Your availableDate must be less than the  availableTimeEnd ',
          error: 'BAD_REQUEST',
          statusCode: 422,
          status: false,
        })
      }

      if (availableDate > timeStarts) {
        return response.status(422).json({
          message: 'Your availableDate must be less than the  timeStarts ',
          error: 'BAD_REQUEST',
          statusCode: 422,
          status: false,
        })
      }
      if (timeEnds <= timeStarts) {
        return response.status(422).json({
          message: 'Your timeEnds must be greater than the  timeStarts ',
          error: 'BAD_REQUEST',
          statusCode: 422,
          status: false,
        })
      }
      const user = await User.query().where('id', errand.customerId).firstOrFail()
      console.log(`user ${user}`)

      const customer = await Profile.query().where('user_id', user.id).first()
      if (!customer) {
        return response.status(404).json({
          message: 'the customer infomation is incomplete',
          errors: 'PROFILE_NOT_AVALAIBLE',
          statusCode: 404,
          status: false,
        })
      }
      const runner = {
        runnerId: auth.user?.id,
        availableDate: payload.availableDate.toISOString(),
        availableTimeStart: payload.availableTimeStart.toISOString(),
        availableTimeEnd: payload.availableTimeEnd.toISOString(),
        locationLongitude: payload.locationLongitude,
        locationLatitude: payload.locationLatitude,
        radiusKm: errand.radiusKm,
      }

      await db.transaction(async (trx) => {
        const createdRunner = await Runner.create(runner)
        createdRunner.useTransaction(trx)
        errand.runnerId = createdRunner.id
        errand.status = ErrandStatus.PENDING
        errand.assignedDate = DateTime.now().toISO()
        await errand.save()
        const profile = await Profile.query().where('user_id', errand.customerId).firstOrFail()
        errand.useTransaction(trx)
        const notifcationData = {
          senderId: errand.customerId,
          recipientId: auth.user!.id,
          message: `A request  to run the errand by
           on ${errand?.assignedDate} by you
           ${profile.firstName} ${profile.lastName}
           with phoneNo ${profile.phoneNumber} your contact person is
           ${errand?.contactPersonName} and his phone no is
           ${errand?.contactPersonPhoneNo}    `,
          status: 'pending',
        }
        const notification = await this.notificationService.createNotification(notifcationData)
        notification.useTransaction(trx)
        trx.commit()
        const runnerRespose = new RunnerResponse(errand, createdRunner!, customer)

        return response.status(200).json({
          message: 'Errand assigned succesfully',
          data: runnerRespose,
          statusCode: 20,
          status: true,
        })
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
        error: error.message,
        statusCode: 500,
        status: false,
      })
    }
  }

  async runErrandKmsFromDropOff({ request, response, auth, params }: HttpContext) {
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
      const errand = await Errand.findOrFail(errandId)
      const payload = await request.validateUsing(RunnerValidator)
      const withinArea = await this.getIfWithinTenMilesRadiusDropOff(
        new Location(
          errand.pickupLocationLatitude,
          errand.pickupLocationLongitude,
          errand.dropoffLocationLatitude,
          errand.dropoffLocationLongitude,
          payload.locationLatitude,
          payload.locationLongitude
        ),
        errand.radiusKm
      )
      if (withinArea.status === false) {
        return response.status(404).json({
          message: `You are  not specified within km radius. You are ${withinArea.distance}km away`,
          error: 'OUT_OF_KM_RADIUS',
          statusCode: 404,
          status: false,
        })
      }
      const availableDate = DateTime.fromISO(payload.availableDate.toISOString())
      const timeEnds = DateTime.fromISO(payload.availableTimeEnd.toISOString())
      const timeStarts = DateTime.fromISO(payload.availableTimeStart.toISOString())
      if (availableDate > timeEnds) {
        return response.status(422).json({
          message: 'Your availableDate must be less than the  availableTimeEnd ',
          error: 'BAD_REQUEST',
          statusCode: 422,
          status: false,
        })
      }

      if (availableDate > timeStarts) {
        return response.status(422).json({
          message: 'Your availableDate must be less than the  timeStarts ',
          error: 'BAD_REQUEST',
          statusCode: 422,
          status: false,
        })
      }
      if (timeEnds <= timeStarts) {
        return response.status(422).json({
          message: 'Your timeEnds must be greater than the  timeStarts ',
          error: 'BAD_REQUEST',
          statusCode: 422,
          status: false,
        })
      }
      const user = await User.query().where('id', errand.customerId).firstOrFail()
      console.log(`user ${user}`)

      const customer = await Profile.query().where('user_id', user.id).first()
      if (!customer) {
        return response.status(404).json({
          message: 'the customer infomation is incomplete',
          errors: 'PROFILE_NOT_AVALAIBLE',
          statusCode: 404,
          status: false,
        })
      }
      const runner = {
        runnerId: auth.user?.id,
        availableDate: payload.availableDate.toISOString(),
        availableTimeStart: payload.availableTimeStart.toISOString(),
        availableTimeEnd: payload.availableTimeEnd.toISOString(),
        locationLongitude: payload.locationLongitude,
        locationLatitude: payload.locationLatitude,
        radiusKm: errand.radiusKm,
      }

      await db.transaction(async (trx) => {
        const createdRunner = await Runner.create(runner)
        createdRunner.useTransaction(trx)
        errand.runnerId = createdRunner.id
        errand.status = ErrandStatus.PENDING
        errand.assignedDate = DateTime.now().toISO()
        await errand.save()
        const profile = await Profile.query().where('user_id', errand.customerId).firstOrFail()
        errand.useTransaction(trx)
        const notifcationData = {
          senderId: errand.customerId,
          recipientId: auth.user!.id,
          message: `A request  to run the errand by
           on ${errand?.assignedDate} by you
           ${profile.firstName} ${profile.lastName}
           with phoneNo ${profile.phoneNumber} your contact person is
           ${errand?.contactPersonName} and his phone no is
           ${errand?.contactPersonPhoneNo}    `,
          status: 'pending',
        }
        const notification = await this.notificationService.createNotification(notifcationData)
        notification.useTransaction(trx)
        trx.commit()
        const runnerRespose = new RunnerResponse(errand, createdRunner!, customer)

        return response.status(200).json({
          message: 'Errand assigned succesfully',
          data: runnerRespose,
          statusCode: 20,
          status: true,
        })
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
        error: error.message,
        statusCode: 500,
        status: false,
      })
    }
  }

  async runErrandKmsFromPickUp({ request, response, auth, params }: HttpContext) {
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
      const errand = await Errand.findOrFail(errandId)
      const payload = await request.validateUsing(RunnerValidator)
      const withinArea = await this.getIfWithinTenMilesRadiusPickup(
        new Location(
          errand.pickupLocationLatitude,
          errand.pickupLocationLongitude,
          errand.dropoffLocationLatitude,
          errand.dropoffLocationLongitude,
          payload.locationLatitude,
          payload.locationLongitude
        ),
        errand.radiusKm
      )
      if (withinArea.status === false) {
        return response.status(404).json({
          message: `You are  not specified within km radius. You are ${withinArea.distance}km away`,
          error: 'OUT_OF_KM_RADIUS',
          statusCode: 404,
          status: false,
        })
      }
      const availableDate = DateTime.fromISO(payload.availableDate.toISOString())
      const timeEnds = DateTime.fromISO(payload.availableTimeEnd.toISOString())
      const timeStarts = DateTime.fromISO(payload.availableTimeStart.toISOString())
      if (availableDate > timeEnds) {
        return response.status(422).json({
          message: 'Your availableDate must be less than the  availableTimeEnd ',
          error: 'BAD_REQUEST',
          statusCode: 422,
          status: false,
        })
      }

      if (availableDate > timeStarts) {
        return response.status(422).json({
          message: 'Your availableDate must be less than the  timeStarts ',
          error: 'BAD_REQUEST',
          statusCode: 422,
          status: false,
        })
      }
      if (timeEnds <= timeStarts) {
        return response.status(422).json({
          message: 'Your timeEnds must be greater than the  timeStarts ',
          error: 'BAD_REQUEST',
          statusCode: 422,
          status: false,
        })
      }
      const user = await User.query().where('id', errand.customerId).firstOrFail()
      console.log(`user ${user}`)

      const customer = await Profile.query().where('user_id', user.id).first()
      if (!customer) {
        return response.status(404).json({
          message: 'the customer infomation is incomplete',
          errors: 'PROFILE_NOT_AVALAIBLE',
          statusCode: 404,
          status: false,
        })
      }
      const runner = {
        runnerId: auth.user?.id,
        availableDate: payload.availableDate.toISOString(),
        availableTimeStart: payload.availableTimeStart.toISOString(),
        availableTimeEnd: payload.availableTimeEnd.toISOString(),
        locationLongitude: payload.locationLongitude,
        locationLatitude: payload.locationLatitude,
        radiusKm: errand.radiusKm,
      }

      await db.transaction(async (trx) => {
        const createdRunner = await Runner.create(runner)
        createdRunner.useTransaction(trx)
        errand.runnerId = createdRunner.id
        errand.status = ErrandStatus.PENDING
        errand.assignedDate = DateTime.now().toISO()
        await errand.save()
        const profile = await Profile.query().where('user_id', errand.customerId).firstOrFail()
        errand.useTransaction(trx)
        const notifcationData = {
          senderId: errand.customerId,
          recipientId: auth.user!.id,
          message: `A request  to run the errand by
           on ${errand?.assignedDate} by you
           ${profile.firstName} ${profile.lastName}
           with phoneNo ${profile.phoneNumber} your contact person is
           ${errand?.contactPersonName} and his phone no is
           ${errand?.contactPersonPhoneNo}    `,
          status: 'pending',
        }
        const notification = await this.notificationService.createNotification(notifcationData)
        notification.useTransaction(trx)
        trx.commit()
        const runnerRespose = new RunnerResponse(errand, createdRunner!, customer)

        return response.status(200).json({
          message: 'Errand assigned succesfully',
          data: runnerRespose,
          statusCode: 20,
          status: true,
        })
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
        error: error.message,
        statusCode: 500,
        status: false,
      })
    }
  }

  async getNearbyErrands({ response, params }: HttpContext) {
    try {
      const runner = await Runner.query().where('runner_id', params.runnerId).first()
      if (!runner) {
        return response.notFound({
          message: `Runner with id ${params.id}  not found.`,
          status: false,
          error: true,
          statusCode: 404,
        })
      }
      const latitude = runner!.locationLatitude
      const longitude = runner!.locationLatitude

      if (!latitude || !longitude) {
        return response.badRequest({
          message: 'Latitude and longitude are required.',
          status: false,
          error: true,
          statusCode: 400,
        })
      }

      const errands = await getNearbyErrands(
        latitude,
        longitude,
        runner!.radiusKm,
        runner!.availableDate,
        runner!.availableTimeStart,
        runner!.availableTimeEnd
      )
      if (errands.length === 0) {
        return response.ok({
          status: false,
          data: errands,
          message: 'No errand with',
          success: true,
        })
      }
      return response.ok({
        status: true,
        data: errands,
        message: 'locations retrive succussfully',
        success: true,
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

  async getNearbyErrandsKmFromPickup({ response, params }: HttpContext) {
    try {
      const runner = await Runner.query().where('runner_id', params.runnerId).first()
      if (!runner) {
        return response.notFound({
          message: `Runner with id ${params.id}  not found.`,
          status: false,
          error: true,
          statusCode: 404,
        })
      }
      const latitude = runner!.locationLatitude
      const longitude = runner!.locationLatitude

      if (!latitude || !longitude) {
        return response.badRequest({
          message: 'Latitude and longitude are required.',
          status: false,
          error: true,
          statusCode: 400,
        })
      }

      const errands = await getNearbyErrandsUsingDropOffLocations(
        latitude,
        longitude,
        runner!.radiusKm,
        runner!.availableDate,
        runner!.availableTimeStart,
        runner!.availableTimeEnd
      )
      if (errands.length === 0) {
        return response.ok({
          status: false,
          data: errands,
          message: 'No errand with',
          success: true,
        })
      }
      return response.ok({
        status: true,
        data: errands,
        message: 'locations retrive succussfully',
        success: true,
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

  async getNearbyErrandsKmFromDropOff({ response, params }: HttpContext) {
    try {
      const runner = await Runner.query().where('runner_id', params.runnerId).first()
      if (!runner) {
        return response.notFound({
          message: `Runner with id ${params.id}  not found.`,
          status: false,
          error: true,
          statusCode: 404,
        })
      }
      const latitude = runner!.locationLatitude
      const longitude = runner!.locationLatitude

      if (!latitude || !longitude) {
        return response.badRequest({
          message: 'Latitude and longitude are required.',
          status: false,
          error: true,
          statusCode: 400,
        })
      }

      const errands = await getNearbyErrandsUsingDropOffLocations(
        latitude,
        longitude,
        runner!.radiusKm,
        runner!.availableDate,
        runner!.availableTimeStart,
        runner!.availableTimeEnd
      )
      if (errands.length === 0) {
        return response.ok({
          status: false,
          data: errands,
          message: 'No errand with',
          success: true,
        })
      }
      return response.ok({
        status: true,
        data: errands,
        message: 'locations retrive succussfully',
        success: true,
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
  private async getIfWithinTenMilesRadiusPickup(
    errandLocationDetails: Location,
    radiusInMiles: number = 10
  ): Promise<{ distance: number; status: boolean }> {
    const toRadians = (deg: number) => (deg * Math.PI) / 180

    const {
      pickupLocationLatitude,
      pickupLocationLongitude,
      locationToCompareLatitude,
      locationToCompareLongitude,
    } = errandLocationDetails

    const earthRadius = 6371 // km

    // Convert coordinates to radians
    const lat1 = toRadians(pickupLocationLatitude)
    const lon1 = toRadians(pickupLocationLongitude)
    const lat2 = toRadians(locationToCompareLatitude)
    const lon2 = toRadians(locationToCompareLongitude)

    // Calculate distance from pickup to comparison point
    const dLat = lat2 - lat1
    const dLon = lon2 - lon1
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = earthRadius * c

    return {
      distance,
      status: distance <= radiusInMiles,
    }
  }

  private async getIfWithinTenMilesRadiusDropOff(
    errandLocationDetails: Location,
    radiusInMiles: number = 10
  ): Promise<{ distance: number; status: boolean }> {
    const toRadians = (deg: number) => (deg * Math.PI) / 180

    const {
      dropoffLocationLatitude,
      dropoffLocationLongitude,
      locationToCompareLatitude,
      locationToCompareLongitude,
    } = errandLocationDetails

    const earthRadius = 6371 // km

    // Convert coordinates to radians
    const lat1 = toRadians(dropoffLocationLatitude)
    const lon1 = toRadians(dropoffLocationLongitude)
    const lat2 = toRadians(locationToCompareLatitude)
    const lon2 = toRadians(locationToCompareLongitude)

    // Calculate distance from dropoff to comparison point
    const dLat = lat2 - lat1
    const dLon = lon2 - lon1
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = earthRadius * c

    return {
      distance,
      status: distance <= radiusInMiles,
    }
  }
  private async getIfWithinTenMilesRadius(
    errandLocationDetails: Location,
    radiusInMiles: number = 10
  ): Promise<any> {
    const toRadians = (deg: number) => (deg * Math.PI) / 180

    const {
      pickupLocationLatitude,
      pickupLocationLongitude,
      dropoffLocationLatitude,
      dropoffLocationLongitude,
      locationToCompareLatitude,
      locationToCompareLongitude,
    } = errandLocationDetails

    const earthRadius = 6371 // km // in miles

    // Convert coordinates to radians
    const lat1 = toRadians(dropoffLocationLatitude)
    const lon1 = toRadians(dropoffLocationLongitude)
    const lat2 = toRadians(locationToCompareLatitude)
    const lon2 = toRadians(locationToCompareLongitude)

    const lat3 = toRadians(pickupLocationLatitude)
    const lon3 = toRadians(pickupLocationLongitude)

    // Calculate distance from dropoff to compare location
    const dLat1 = lat2 - lat1
    const dLon1 = lon2 - lon1
    const a1 = Math.sin(dLat1 / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon1 / 2) ** 2
    const c1 = 2 * Math.atan2(Math.sqrt(a1), Math.sqrt(1 - a1))
    const distance1 = earthRadius * c1

    // Calculate distance from pickup to compare location
    const dLat2 = lat2 - lat3
    const dLon2 = lon2 - lon3
    const a2 = Math.sin(dLat2 / 2) ** 2 + Math.cos(lat3) * Math.cos(lat2) * Math.sin(dLon2 / 2) ** 2
    const c2 = 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2))
    const distance2 = earthRadius * c2
    const responseKm = {
      distance: distance2,
      status: distance1 <= radiusInMiles || distance2 <= radiusInMiles,
    }

    // Check if either pickup or dropoff is within the radius
    return responseKm
  }
}
