export default class Location {
  pickupLocationLatitude: number
  pickupLocationLongitude: number
  dropoffLocationLatitude: number
  dropoffLocationLongitude: number
  locationToCompareLatitude: number
  locationToCompareLongitude: number 

  constructor(
    pickupLocationLatitude: number,
    pickupLocationLongitude: number,
    dropoffLocationLatitude: number,
    dropoffLocationLongitude: number,
    locationToCompareLatitude: number,
    locationToCompareLongitude: number
  ) {
    this.pickupLocationLatitude = pickupLocationLatitude
    this.pickupLocationLongitude = pickupLocationLongitude
    this.dropoffLocationLatitude = dropoffLocationLatitude
    this.dropoffLocationLongitude = dropoffLocationLongitude
    this.locationToCompareLatitude = locationToCompareLatitude
    this.locationToCompareLongitude = locationToCompareLongitude
  }
}
