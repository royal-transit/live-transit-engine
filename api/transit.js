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
lord:NAK_LORD[i],
pada:pada
}
}

function planetData(long,lat,speed){

const s=calcSign(long)
const n=calcNak(long)

return{
longitude:long,
latitude:lat,
sign:s.sign,
degree:s.degree,
nakshatra:n.nakshatra,
nakshatra_lord:n.lord,
pada:n.pada,
retrograde:speed<0,
speed:speed
}
}

function calcTithi(sun,moon){

let diff=(moon-sun)%360
if(diff<0)diff+=360

const t=Math.floor(diff/12)+1

return t
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

const result={

timestamp:now.toISOString(),

zodiac:"sidereal",
ayanamsa:"lahiri",

panchanga:{
tithi:tithi,
vara:now.getUTCDay()
},

sun:planetData(sun.longitude,sun.latitude,sun.speed),

moon:planetData(moon.longitude,moon.latitude,moon.speed),

mercury:planetData(mercury.longitude,mercury.latitude,mercury.speed),

venus:planetData(venus.longitude,venus.latitude,venus.speed),

mars:planetData(mars.longitude,mars.latitude,mars.speed),

jupiter:planetData(jupiter.longitude,jupiter.latitude,jupiter.speed),

saturn:planetData(saturn.longitude,saturn.latitude,saturn.speed),

rahu:planetData(rahu.longitude,rahu.latitude,rahu.speed),

ketu:planetData(ketuLong,rahu.latitude,rahu.speed)

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
