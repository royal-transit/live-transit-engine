import swe from "swisseph-v2"

const SIGNS=[
"Aries","Taurus","Gemini","Cancer","Leo","Virgo",
"Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
]

const NAKSHATRAS=[
"Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra",
"Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni",
"Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
"Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta",
"Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"
]

const NAK_LORD=[
"Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
"Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
"Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"
]

const EXALT={
Sun:"Aries",
Moon:"Taurus",
Mars:"Capricorn",
Mercury:"Virgo",
Jupiter:"Cancer",
Venus:"Pisces",
Saturn:"Libra"
}

const DEBIL={
Sun:"Libra",
Moon:"Scorpio",
Mars:"Cancer",
Mercury:"Pisces",
Jupiter:"Capricorn",
Venus:"Virgo",
Saturn:"Aries"
}

function calcSign(longitude){
const i=Math.floor(longitude/30)
return{sign:SIGNS[i],degree:longitude%30}
}

function calcNak(longitude){
const size=13.3333333333
const i=Math.floor(longitude/size)
const pada=Math.floor((longitude%size)/3.3333333333)+1
return{
nakshatra:NAKSHATRAS[i],
nakshatra_lord:NAK_LORD[i],
pada:pada
}
}

function dignity(planet,sign){

if(EXALT[planet]===sign)return"exalted"
if(DEBIL[planet]===sign)return"debilitated"

return"normal"
}

function combustCheck(planet,sunLong,planetLong){

const diff=Math.abs(sunLong-planetLong)

if(planet==="Mercury"&&diff<14)return true
if(planet==="Venus"&&diff<10)return true
if(planet==="Mars"&&diff<17)return true
if(planet==="Jupiter"&&diff<11)return true
if(planet==="Saturn"&&diff<15)return true

return false
}

function planetData(name,long,lat,speed,sunLong){

const s=calcSign(long)
const n=calcNak(long)

return{

longitude:long,
latitude:lat,

sign:s.sign,
degree:s.degree,

nakshatra:n.nakshatra,
nakshatra_lord:n.nakshatra_lord,
pada:n.pada,

retrograde:speed<0,
speed:speed,

dignity:dignity(name,s.sign),

combust:combustCheck(name,sunLong,long)

}
}

function calcTithi(sun,moon){

let diff=(moon-sun)%360
if(diff<0)diff+=360

return Math.floor(diff/12)+1
}

function moonPhase(diff){

if(diff<180)return"waxing"
return"waning"
}

export default async function handler(req,res){

try{

const now=new Date()

swe.swe_set_sid_mode(swe.SE_SIDM_LAHIRI,0,0)

const jd=swe.swe_julday(
now.getUTCFullYear(),
now.getUTCMonth()+1,
now.getUTCDate(),
now.getUTCHours()
+now.getUTCMinutes()/60
+now.getUTCSeconds()/3600,
swe.SE_GREG_CAL
)

const flags=swe.SEFLG_SWIEPH|swe.SEFLG_SIDEREAL

const sun=swe.swe_calc_ut(jd,swe.SE_SUN,flags)
const moon=swe.swe_calc_ut(jd,swe.SE_MOON,flags)
const mercury=swe.swe_calc_ut(jd,swe.SE_MERCURY,flags)
const venus=swe.swe_calc_ut(jd,swe.SE_VENUS,flags)
const mars=swe.swe_calc_ut(jd,swe.SE_MARS,flags)
const jupiter=swe.swe_calc_ut(jd,swe.SE_JUPITER,flags)
const saturn=swe.swe_calc_ut(jd,swe.SE_SATURN,flags)
const rahu=swe.swe_calc_ut(jd,swe.SE_TRUE_NODE,flags)

const ketuLong=(rahu.longitude+180)%360

const tithi=calcTithi(sun.longitude,moon.longitude)
const phase=moonPhase((moon.longitude-sun.longitude+360)%360)

const result={

timestamp:now.toISOString(),

zodiac:"sidereal",
ayanamsa:"lahiri",

panchanga:{
tithi:tithi,
weekday:now.getUTCDay(),
moon_phase:phase
},

sun:planetData("Sun",sun.longitude,sun.latitude,sun.speed,sun.longitude),

moon:planetData("Moon",moon.longitude,moon.latitude,moon.speed,sun.longitude),

mercury:planetData("Mercury",mercury.longitude,mercury.latitude,mercury.speed,sun.longitude),

venus:planetData("Venus",venus.longitude,venus.latitude,venus.speed,sun.longitude),

mars:planetData("Mars",mars.longitude,mars.latitude,mars.speed,sun.longitude),

jupiter:planetData("Jupiter",jupiter.longitude,jupiter.latitude,jupiter.speed,sun.longitude),

saturn:planetData("Saturn",saturn.longitude,saturn.latitude,saturn.speed,sun.longitude),

rahu:planetData("Rahu",rahu.longitude,rahu.latitude,rahu.speed,sun.longitude),

ketu:planetData("Ketu",ketuLong,rahu.latitude,rahu.speed,sun.longitude)

}

res.status(200).json(result)

}

catch(err){

res.status(500).json({
error:"snapshot engine failure",
details:String(err)
})

}

}
