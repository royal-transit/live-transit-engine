
import swe from "swisseph-v2"

const SIGNS = [
"Aries","Taurus","Gemini","Cancer","Leo","Virgo",
"Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
]

const NAKSHATRAS = [
"Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra",
"Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni",
"Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
"Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta",
"Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"
]

function calcSign(longitude){
 const index = Math.floor(longitude / 30)
 return {
  sign: SIGNS[index],
  degree: longitude % 30
 }
}

function calcNakshatra(longitude){
 const size = 13.3333333333
 const index = Math.floor(longitude / size)
 const pada = Math.floor((longitude % size) / 3.3333333333) + 1
 return {
  nakshatra: NAKSHATRAS[index],
  pada: pada
 }
}

function planetData(longitude,speed){

 const signData = calcSign(longitude)
 const nakData = calcNakshatra(longitude)

 return {
  longitude,
  sign: signData.sign,
  degree: signData.degree,
  nakshatra: nakData.nakshatra,
  pada: nakData.pada,
  retrograde: speed < 0,
  speed: speed
 }
}

export default async function handler(req,res){

 try{

 const now = new Date()

 swe.swe_set_sid_mode(swe.SE_SIDM_LAHIRI,0,0)

 const jd = swe.swe_julday(
  now.getUTCFullYear(),
  now.getUTCMonth()+1,
  now.getUTCDate(),
  now.getUTCHours()
  + now.getUTCMinutes()/60
  + now.getUTCSeconds()/3600,
  swe.SE_GREG_CAL
 )

 const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL

 const sun = swe.swe_calc_ut(jd,swe.SE_SUN,flags)
 const moon = swe.swe_calc_ut(jd,swe.SE_MOON,flags)
 const mercury = swe.swe_calc_ut(jd,swe.SE_MERCURY,flags)
 const venus = swe.swe_calc_ut(jd,swe.SE_VENUS,flags)
 const mars = swe.swe_calc_ut(jd,swe.SE_MARS,flags)
 const jupiter = swe.swe_calc_ut(jd,swe.SE_JUPITER,flags)
 const saturn = swe.swe_calc_ut(jd,swe.SE_SATURN,flags)
 const rahu = swe.swe_calc_ut(jd,swe.SE_TRUE_NODE,flags)

 const ketuLongitude = (rahu.longitude + 180) % 360

 const result = {

  timestamp: now.toISOString(),
  zodiac: "sidereal",
  ayanamsa: "lahiri",

  sun: planetData(sun.longitude,sun.speed),
  moon: planetData(moon.longitude,moon.speed),
  mercury: planetData(mercury.longitude,mercury.speed),
  venus: planetData(venus.longitude,venus.speed),
  mars: planetData(mars.longitude,mars.speed),
  jupiter: planetData(jupiter.longitude,jupiter.speed),
  saturn: planetData(saturn.longitude,saturn.speed),
  rahu: planetData(rahu.longitude,rahu.speed),
  ketu: planetData(ketuLongitude,rahu.speed)

 }

 res.status(200).json(result)

 }

 catch(error){

 res.status(500).json({
  error:"Transit engine failure",
  details:String(error)
 })

 }

}
