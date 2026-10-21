package services

import (
	"math"
)

const EarthRadiusMeters = 6371000.0

// DegreesToRadians converts degree to radian
func DegreesToRadians(d float64) float64 {
	return d * math.Pi / 180.0
}

// CalculateHaversineDistance returns distance in meters between two coordinates
func CalculateHaversineDistance(lat1, lng1, lat2, lng2 float64) float64 {
	dLat := DegreesToRadians(lat2 - lat1)
	dLng := DegreesToRadians(lng2 - lng1)

	rLat1 := DegreesToRadians(lat1)
	rLat2 := DegreesToRadians(lat2)

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(rLat1)*math.Cos(rLat2)*math.Sin(dLng/2)*math.Sin(dLng/2)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return EarthRadiusMeters * c
}

// IsWithinGeofence checks if coordinate is inside allowed radius
func IsWithinGeofence(targetLat, targetLng, centerLat, centerLng float64, allowedRadiusMeters int) (bool, float64) {
	dist := CalculateHaversineDistance(targetLat, targetLng, centerLat, centerLng)
	return dist <= float64(allowedRadiusMeters), dist
}
