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
 const signIndex = Math.floor(longitude / 30)
 return {
   sign: SIGNS[signIndex],
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

 const jd = swe.swe_julday(
   now.getUTCFullYear(),
   now.getUTCMonth()+1,
   now.getUTCDate(),
   now.getUTCHours()
   + now.getUTCMinutes()/60
   + now.getUTCSeconds()/3600,
   swe.SE_GREG_CAL
 )

 const sun = swe.swe_calc_ut(jd,swe.SE_SUN)
 const moon = swe.swe_calc_ut(jd,swe.SE_MOON)
 const mercury = swe.swe_calc_ut(jd,swe.SE_MERCURY)
 const venus = swe.swe_calc_ut(jd,swe.SE_VENUS)
 const mars = swe.swe_calc_ut(jd,swe.SE_MARS)
 const jupiter = swe.swe_calc_ut(jd,swe.SE_JUPITER)
 const saturn = swe.swe_calc_ut(jd,swe.SE_SATURN)
 const rahu = swe.swe_calc_ut(jd,swe.SE_TRUE_NODE)

 const ketuLongitude = (rahu.longitude + 180) % 360

 const result = {

   timestamp: now.toISOString(),

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
   error:"Transit Engine Failure",
   details:String(error)
 })

 }

}
