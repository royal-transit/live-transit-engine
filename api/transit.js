import swe from "swisseph-v2"

export default async function handler(req, res) {
  try {

    const now = new Date()

    const jd =
      swe.swe_julday(
        now.getUTCFullYear(),
        now.getUTCMonth() + 1,
        now.getUTCDate(),
        now.getUTCHours() +
          now.getUTCMinutes() / 60 +
          now.getUTCSeconds() / 3600,
        swe.SE_GREG_CAL
      )

    const moon = swe.swe_calc_ut(jd, swe.SE_MOON)

    const moonDegree = moon.longitude

    const result = {
      timestamp: now.toISOString(),
      moon_longitude: moonDegree
    }

    res.status(200).json(result)

  } catch (error) {

    res.status(500).json({
      error: "Swiss Ephemeris failed",
      details: String(error)
    })

  }
}
