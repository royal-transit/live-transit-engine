import swe from "swisseph-v2"

const SIGNS = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
]

function normalize360(value){
  let result = value % 360
  if(result < 0) result += 360
  return result
}

function round(value,d=6){
  return Number(value.toFixed(d))
}

function getSignData(longitude){
  const normalized = normalize360(longitude)
  const signIndex = Math.floor(normalized / 30)
  return {
    sign: SIGNS[signIndex],
    degree: round(normalized % 30, 6)
  }
}

function parseCalcResult(result){
  if(!result) throw new Error("Swiss Ephemeris returned empty result")
  if(result.error) throw new Error(String(result.error))

  const longitude =
    result.longitude ??
    result.lon ??
    result.xx?.[0]

  if(typeof longitude !== "number" || Number.isNaN(longitude)){
    throw new Error("Swiss Ephemeris longitude missing or invalid")
  }

  return normalize360(longitude)
}

function calcPlanet(jd, planetId, flags){
  return parseCalcResult(swe.swe_calc_ut(jd, planetId, flags))
}

function getDivisionalLongitude(longitude, division){
  const signIndex = Math.floor(longitude / 30)
  const degreeInSign = longitude % 30
  const partSize = 30 / division
  const partIndex = Math.floor(degreeInSign / partSize)
  const newDegreeInSign = (degreeInSign % partSize) * division

  const divisionalSignIndex = (signIndex * division + partIndex) % 12
  const divisionalLongitude = divisionalSignIndex * 30 + newDegreeInSign

  return normalize360(divisionalLongitude)
}

function buildDivisionalData(longitude){
  const signData = getSignData(longitude)
  return {
    longitude: round(longitude, 6),
    sign: signData.sign,
    degree: signData.degree
  }
}

export default async function handler(req,res){
  try{
    const now = new Date()

    swe.swe_set_sid_mode(swe.SE_SIDM_LAHIRI,0,0)

    const utHour =
      now.getUTCHours() +
      now.getUTCMinutes()/60 +
      now.getUTCSeconds()/3600

    const jd = swe.swe_julday(
      now.getUTCFullYear(),
      now.getUTCMonth()+1,
      now.getUTCDate(),
      utHour,
      swe.SE_GREG_CAL
    )

    const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL

    const planets = {
      sun: calcPlanet(jd, swe.SE_SUN, flags),
      moon: calcPlanet(jd, swe.SE_MOON, flags),
      mercury: calcPlanet(jd, swe.SE_MERCURY, flags),
      venus: calcPlanet(jd, swe.SE_VENUS, flags),
      mars: calcPlanet(jd, swe.SE_MARS, flags),
      jupiter: calcPlanet(jd, swe.SE_JUPITER, flags),
      saturn: calcPlanet(jd, swe.SE_SATURN, flags),
      rahu: calcPlanet(jd, swe.SE_TRUE_NODE, flags)
    }

    planets.ketu = normalize360(planets.rahu + 180)

    const divisional = {
      D1: {},
      D9: {},
      D10: {},
      D7: {},
      D12: {}
    }

    for(const key of Object.keys(planets)){
      divisional.D1[key] = buildDivisionalData(planets[key])
      divisional.D9[key] = buildDivisionalData(getDivisionalLongitude(planets[key], 9))
      divisional.D10[key] = buildDivisionalData(getDivisionalLongitude(planets[key], 10))
      divisional.D7[key] = buildDivisionalData(getDivisionalLongitude(planets[key], 7))
      divisional.D12[key] = buildDivisionalData(getDivisionalLongitude(planets[key], 12))
    }

    return res.status(200).json({
      timestamp: now.toISOString(),
      zodiac: "sidereal",
      ayanamsa: "lahiri",
      divisional
    })

  }catch(err){
    return res.status(500).json({
      error: "divisional engine failure",
      details: String(err)
    })
  }
}
