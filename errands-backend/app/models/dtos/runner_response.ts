import { DateTime } from 'luxon'
import Errand from '#models/errand'
import Runner from '#models/runner'
import Profile from '#models/profile'

export default class RunnerResponse {
  errandDate: string
  errandId: number
  customerId: number
  customerName: string
  customerPhoneNumber: string
  errandType: string
  pickupAddress: string
  dropOffAddress: string
  errandDescription: string
  assignedDate: string
  completedDate: string
  images: string | null
  estimatedCost: number
  radiusKm: number
  isCanceled: boolean
  paymentStatus: string
  contactPersonName: string
  contactPersonPhoneNumber: string
  errandCreatedAt: string
  timeLimit: string

  constructor(errand: Errand, runner: Runner, customer: Profile) {
    this.errandDate = errand.assignedDate?.toString()
    this.errandId = errand.id
    this.customerId = customer.id
    this.customerName = `${customer.firstName} ${customer.lastName} ${customer.middleName}`
    this.customerPhoneNumber = `${customer.phoneNumber}` // adapt based on your profile model
    this.errandType = errand.errandType
    this.pickupAddress = errand.pickupAddress
    this.dropOffAddress = errand.dropoffAddress
    this.errandDescription = errand.description
    this.assignedDate = errand.assignedDate?.toString() ?? ''
    this.completedDate = errand.completedDate?.toString() ?? ''
    this.images = errand.images ?? null
    this.estimatedCost = errand.estimatedCost
    this.radiusKm = errand.radiusKm
    this.isCanceled = errand.isCanceled
    this.paymentStatus = errand.paymentStatus
    this.contactPersonName = errand.contactPersonName
    this.contactPersonPhoneNumber = errand.contactPersonPhoneNo
    this.errandCreatedAt = errand.createdAt?.toString() ?? ''
    this.timeLimit = DateTime.fromISO(runner.availableTimeEnd)
      .diff(DateTime.fromISO(runner.availableTimeStart))
      .toFormat('hh:mm')
  }
}
