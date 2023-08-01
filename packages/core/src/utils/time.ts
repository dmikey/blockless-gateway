/**
 * Get last 24 hour time range
 *
 * @returns
 */
export const get24HoursInterval = () => {
	let startTimeObj, endTimeObj

	// time parsing, throw error if parsing fails
	try {
		endTimeObj = new Date()
		endTimeObj.setHours(endTimeObj.getHours() + Math.ceil(endTimeObj.getMinutes() / 60))
		endTimeObj.setUTCMinutes(0, 0, 0)

		startTimeObj = new Date(endTimeObj.getTime() - 24 * 3600 * 1000)
		startTimeObj.setUTCMinutes(0, 0, 0)

		return { startTime: startTimeObj, endTime: endTimeObj }
	} catch (error) {
		throw Error('Invalid Date')
	}
}
