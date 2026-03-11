import swe from "swisseph-v2"

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
  "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]

const NAK_LORDS = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu",
  "Jupiter", "Saturn", "Mercury", "Ketu", "Venus", "Sun",
  "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu",
  "Jupiter", "Saturn", "Mercury"
]

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
]

const EXALTATION_SIGNS = {
  Sun: "Aries",
  Moon: "Taurus",
  Mars: "Capricorn",
  Mercury: "Virgo",
  Jupiter: "Cancer",
  Venus: "Pisces",
  Saturn: "Libra"
}

const DEBILITATION_SIGNS = {
  Sun: "Libra",
  Moon: "Scorpio",
  Mars: "Cancer",
  Mercury: "Pisces",
  Jupiter: "Capricorn",
  Venus: "Virgo",
  Saturn: "Aries"
}

function normalize360(value) {
  let result = value % 360
  if (result < 0) result += 360
  return result
}

function round(value, digits = 6) {
  return Number(value.toFixed(digits))
}

function getSignData(longitude) {
  const normalized = normalize360(longitude)
  const signIndex = Math.floor(normalized / 30)
  return {
    sign: SIGNS[signIndex],
    degree: round(normalized % 30, 6)
  }
}

function getNakshatraData(longitude) {
  const normalized = normalize360(longitude)
  const nakSize = 360 / 27
  const padaSize = nakSize / 4

  const nakIndex = Math.floor(normalized / nakSize)
  const pada = Math.floor((normalized % nakSize) / padaSize) + 1

  return {
    nakshatra: NAKSHATRAS[nakIndex],
    nakshatra_lord: NAK_LORDS[nakIndex],
    pada
  }
}

function getDignity(planetName, sign) {
  if (EXALTATION_SIGNS[planetName] === sign) return "exalted"
  if (DEBILITATION_SIGNS[planetName] === sign) return "debilitated"
  return "normal"
}

function getAngularDifference(a, b) {
  const diff = Math.abs(normalize360(a) - normalize360(b))
  return diff > 180 ? 360 - diff : diff
}

function isCombust(planetName, sunLongitude, planetLongitude) {
  const diff = getAngularDifference(sunLongitude, planetLongitude)

  if (planetName === "Mercury") return diff < 14
  if (planetName === "Venus") return diff < 10
  if (planetName === "Mars") return diff < 17
  if (planetName === "Jupiter") return diff < 11
  if (planetName === "Saturn") return diff < 15

  return false
}

function getMoonPhaseFromDiff(diff) {
  return diff < 180 ? "waxing" : "waning"
}

function getTithi(sunLongitude, moonLongitude) {
  let diff = normalize360(moonLongitude - sunLongitude)
  return Math.floor(diff / 12) + 1
}

function buildPlanetData(planetName, longitude, latitude, speed, sunLongitude) {
  const normalizedLongitude = normalize360(longitude)
  const signData = getSignData(normalizedLongitude)
  const nakData = getNakshatraData(normalizedLongitude)

  return {
    longitude: round(normalizedLongitude, 6),
    latitude: round(latitude ?? 0, 6),
    sign: signData.sign,
    degree: signData.degree,
    nakshatra: nakData.nakshatra,
    nakshatra_lord: nakData.nakshatra_lord,
    pada: nakData.pada,
    retrograde: speed < 0,
    speed: round(speed ?? 0, 6),
    dignity: getDignity(planetName, signData.sign),
    combust: isCombust(planetName, sunLongitude, normalizedLongitude)
  }
}

function parseCalcResult(result) {
  if (!result) {
    throw new Error("Swiss Ephemeris returned empty result")
  }

  if (result.error) {
    throw new Error(String(result.error))
  }

  // Common shapes handled defensively.
  const longitude =
    result.longitude ??
    result.lon ??
    result.xx?.[0]

  const latitude =
    result.latitude ??
    result.lat ??
    result.xx?.[1] ??
    0

  const speed =
    result.speed ??
    result.speedLong ??
    result.xx?.[3] ??
    0

  if (typeof longitude !== "number" || Number.isNaN(longitude)) {
    throw new Error("Swiss Ephemeris longitude missing or invalid")
  }

  return { longitude, latitude, speed }
}

function calcPlanet(jd, planetId, flags) {
  const raw = swe.swe_calc_ut(jd, planetId, flags)
  return parseCalcResult(raw)
}

export default async function handler(req, res) {
  try {
    const now = new Date()

    swe.swe_set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0)

    const utHour =
      now.getUTCHours() +
      now.getUTCMinutes() / 60 +
      now.getUTCSeconds() / 3600

    const jd = swe.swe_julday(
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
      now.getUTCDate(),
      utHour,
      swe.SE_GREG_CAL
    )

    const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL

    const sun = calcPlanet(jd, swe.SE_SUN, flags)
    const moon = calcPlanet(jd, swe.SE_MOON, flags)
    const mercury = calcPlanet(jd, swe.SE_MERCURY, flags)
    const venus = calcPlanet(jd, swe.SE_VENUS, flags)
    const mars = calcPlanet(jd, swe.SE_MARS, flags)
    const jupiter = calcPlanet(jd, swe.SE_JUPITER, flags)
    const saturn = calcPlanet(jd, swe.SE_SATURN, flags)
    const rahu = calcPlanet(jd, swe.SE_TRUE_NODE, flags)

    const ketuLongitude = normalize360(rahu.longitude + 180)

    const lunarDiff = normalize360(moon.longitude - sun.longitude)
    const tithi = getTithi(sun.longitude, moon.longitude)
    const moonPhase = getMoonPhaseFromDiff(lunarDiff)

    const result = {
      timestamp: now.toISOString(),
      zodiac: "sidereal",
      ayanamsa: "lahiri",

      panchanga: {
        tithi,
        weekday: WEEKDAYS[now.getUTCDay()],
        weekday_number: now.getUTCDay(),
        moon_phase: moonPhase
      },

      sun: buildPlanetData("Sun", sun.longitude, sun.latitude, sun.speed, sun.longitude),
      moon: buildPlanetData("Moon", moon.longitude, moon.latitude, moon.speed, sun.longitude),
      mercury: buildPlanetData("Mercury", mercury.longitude, mercury.latitude, mercury.speed, sun.longitude),
      venus: buildPlanetData("Venus", venus.longitude, venus.latitude, venus.speed, sun.longitude),
      mars: buildPlanetData("Mars", mars.longitude, mars.latitude, mars.speed, sun.longitude),
      jupiter: buildPlanetData("Jupiter", jupiter.longitude, jupiter.latitude, jupiter.speed, sun.longitude),
      saturn: buildPlanetData("Saturn", saturn.longitude, saturn.latitude, saturn.speed, sun.longitude),
      rahu: buildPlanetData("Rahu", rahu.longitude, rahu.latitude, rahu.speed, sun.longitude),
      ketu: buildPlanetData("Ketu", ketuLongitude, rahu.latitude, rahu.speed, sun.longitude),

      confidence: {
        data_source: "Swiss Ephemeris",
        zodiac_mode: "Sidereal",
        ayanamsa_mode: "Lahiri",
        node_mode: "True Node",
        confidence_level: "high"
      }
    }

    res.status(200).json(result)
  } catch (err) {
    res.status(500).json({
      error: "snapshot engine failure",
      details: String(err)
    })
  }
}
