import swe from "swisseph-v2"
import path from "path"

const SIGNS = [
"Aries","Taurus","Gemini","Cancer","Leo","Virgo",
"Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
]

const ephemerisPath = path.resolve("./node_modules/swisseph-v2/ephe")

function normalize360(value){
let result=value%360
if(result<0) result+=360
return result
}

function round(value,d=6){
return Number(value.toFixed(d))
}

function signFromLongitude(lon){
const signIndex=Math.floor(lon/30)
return{
sign:SIGNS[signIndex],
degree:round(lon%30)
}
}

function houseOfPlanet(planetLon,houses){
for(let i=1;i<=12;i++){
let start=houses[i]
let end=i===12?houses[1]+360:houses[i+1]

if(planetLon<start) planetLon+=360

if(planetLon>=start && planetLon<end){
return i
}
}
return null
}

export default async function handler(req,res){

try{

swe.swe_set_ephe_path(ephemerisPath)
swe.swe_set_sid_mode(swe.SE_SIDM_LAHIRI,0,0)

const now=new Date()

const lat=parseFloat(req.query.lat??"51.5074")
const lon=parseFloat(req.query.lon??"-0.1278")

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

const housesResult=swe.swe_houses(
jd,
swe.SEFLG_SIDEREAL,
lat,
lon,
"P"
)

const housesRaw=housesResult.house
const ascRaw=housesResult.ascendant

let houses={}

for(let i=1;i<=12;i++){
houses[i]=round(normalize360(housesRaw[i]))
}

const ascData=signFromLongitude(ascRaw)

const planets={
sun:swe.SE_SUN,
moon:swe.SE_MOON,
mercury:swe.SE_MERCURY,
venus:swe.SE_VENUS,
mars:swe.SE_MARS,
jupiter:swe.SE_JUPITER,
saturn:swe.SE_SATURN,
rahu:swe.SE_TRUE_NODE
}

let planetHousePlacement={}

for(const key in planets){

const result=swe.swe_calc_ut(
jd,
planets[key],
swe.SEFLG_SWIEPH|swe.SEFLG_SIDEREAL
)

const lonPlanet=normalize360(result.longitude??result.lon??result.xx?.[0])

planetHousePlacement[key]=houseOfPlanet(lonPlanet,houses)

}

const resultJSON={

timestamp:now.toISOString(),

location_used:{
latitude:lat,
longitude:lon
},

ascendant:{
longitude:round(ascRaw),
sign:ascData.sign,
degree:ascData.degree
},

houses,

planet_house_placement:planetHousePlacement

}

res.status(200).json(resultJSON)

}catch(err){

res.status(500).json({
error:"chart engine failure",
details:String(err)
})

}

}
