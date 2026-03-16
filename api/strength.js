import swe from "swisseph-v2"

const SIGNS=[
"Aries","Taurus","Gemini","Cancer","Leo","Virgo",
"Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
]

const DIGNITY={
Sun:{exalt:"Aries",debil:"Libra"},
Moon:{exalt:"Taurus",debil:"Scorpio"},
Mars:{exalt:"Capricorn",debil:"Cancer"},
Mercury:{exalt:"Virgo",debil:"Pisces"},
Jupiter:{exalt:"Cancer",debil:"Capricorn"},
Venus:{exalt:"Pisces",debil:"Virgo"},
Saturn:{exalt:"Libra",debil:"Aries"}
}

function normalize360(v){
let r=v%360
if(r<0) r+=360
return r
}

function getSign(lon){
const index=Math.floor(lon/30)
return SIGNS[index]
}

function parseResult(res){

if(!res) throw new Error("ephemeris error")

const lon=res.longitude ?? res.lon ?? res.xx?.[0]

if(typeof lon!=="number") throw new Error("longitude missing")

return normalize360(lon)
}

function calcPlanet(jd,id,flags){
return parseResult(
swe.swe_calc_ut(jd,id,flags)
)
}

function dignityScore(planet,sign){

if(!DIGNITY[planet]) return 50

if(DIGNITY[planet].exalt===sign) return 100
if(DIGNITY[planet].debil===sign) return 20

return 60
}

export default async function handler(req,res){

try{

const now=new Date()

swe.swe_set_sid_mode(swe.SE_SIDM_LAHIRI,0,0)

const utHour=
now.getUTCHours()+
now.getUTCMinutes()/60+
now.getUTCSeconds()/3600

const jd=swe.swe_julday(
now.getUTCFullYear(),
now.getUTCMonth()+1,
now.getUTCDate(),
utHour,
swe.SE_GREG_CAL
)

const flags=swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL

const planets={
Sun:calcPlanet(jd,swe.SE_SUN,flags),
Moon:calcPlanet(jd,swe.SE_MOON,flags),
Mercury:calcPlanet(jd,swe.SE_MERCURY,flags),
Venus:calcPlanet(jd,swe.SE_VENUS,flags),
Mars:calcPlanet(jd,swe.SE_MARS,flags),
Jupiter:calcPlanet(jd,swe.SE_JUPITER,flags),
Saturn:calcPlanet(jd,swe.SE_SATURN,flags)
}

let strength={}

for(const p in planets){

const sign=getSign(planets[p])

strength[p]={
longitude:planets[p],
sign:sign,
dignity:dignityScore(p,sign)
}

}

res.status(200).json({
timestamp:now.toISOString(),
strength
})

}catch(err){

res.status(500).json({
error:"strength engine failure",
details:String(err)
})

}

}
