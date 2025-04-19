import Database from '@adonisjs/lucid/services/db'
import Errand from '#models/errand'
import { DateTime } from 'luxon'

/**
 * Get all errands where dropoff is within the given radius of a point,
 * where the errand is not assigned to a runner and is not canceled.
 * @param latitude Latitude to compare
 * @param longitude Longitude to compare
 * @param radiusInMiles Radius in miles (default 10)
 * @returns Array of Errand model instances
 */
export async function getNearbyErrandsUsingDropOffLocations(
  latitude: number,
  longitude: number,
  radiusInKm: number = 10,
  availableDate: string, // Format: 'YYYY-MM-DD'
  availableTimeStart: string, // Format: 'HH:mm' (24hr)
  availableTimeEnd: string
): Promise<Errand[]> {
  const earthRadius = 6371 // Earth radius in km
  const now = DateTime.now()

  // Convert runner's availability into DateTime objects
  const runnerAvailableStart = DateTime.fromISO(`${availableDate}T${availableTimeStart}`)
  const runnerAvailableEnd = DateTime.fromISO(`${availableDate}T${availableTimeEnd}`)

  // Exit early if runner is not currently available
  if (now < runnerAvailableStart || now > runnerAvailableEnd) {
    return []
  }

  // Only consider dropoff location distance
  const result = await Database.rawQuery(
    `
    SELECT id
    FROM errands
    WHERE (
      (
        ${earthRadius} * 2 * ASIN(
          SQRT(
            POWER(SIN(RADIANS(? - dropoff_location_latitude) / 2), 2) +
            COS(RADIANS(?)) * COS(RADIANS(dropoff_location_latitude)) *
            POWER(SIN(RADIANS(? - dropoff_location_longitude) / 2), 2)
          )
        )
      ) <= ?
    )
    AND runner_id IS NULL
    AND is_canceled = false
    `,
    [
      latitude,
      latitude,
      longitude,
      radiusInKm, // for dropoff
    ]
  )

  const ids = (result[0] || []).map((row: any) => row.id)

  if (!ids.length) return []

  return await Errand.query().whereIn('id', ids)
}
