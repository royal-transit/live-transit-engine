import swe from "swisseph-v2"

function normalize360(value){
let result=value%360
if(result<0) result+=360
return result
}

function round(value,d=6){
return Number(value.toFixed(d))
}

function angularDistance(a,b){
const diff=Math.abs(normalize360(a)-normalize360(b))
return diff>180?360-diff:diff
}

function detectAspect(diff){
const aspects=[
{name:"conjunction",angle:0,orb:8},
{name:"sextile",angle:60,orb:5},
{name:"square",angle:90,orb:6},
{name:"trine",angle:120,orb:6},
{name:"opposition",angle:180,orb:8}
]

for(const aspect of aspects){
if(Math.abs(diff-aspect.angle)<=aspect.orb){
return {
name:aspect.name,
exact_angle:aspect.angle,
orb:round(Math.abs(diff-aspect.angle),3)
}
}
}
return null
}

function parseCalcResult(result){
if(!result) throw new Error("Swiss Ephemeris returned empty result")
if(result.error) throw new Error(String(result.error))

const longitude=result.longitude ?? result.lon ?? result.xx?.[0]

if(typeof longitude!=="number" || Number.isNaN(longitude)){
throw new Error("Swiss Ephemeris longitude missing or invalid")
}

return normalize360(longitude)
}

function calcPlanet(jd,planetId,flags){
return parseCalcResult(swe.swe_calc_ut(jd,planetId,flags))
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
sun:calcPlanet(jd,swe.SE_SUN,flags),
moon:calcPlanet(jd,swe.SE_MOON,flags),
mercury:calcPlanet(jd,swe.SE_MERCURY,flags),
venus:calcPlanet(jd,swe.SE_VENUS,flags),
mars:calcPlanet(jd,swe.SE_MARS,flags),
jupiter:calcPlanet(jd,swe.SE_JUPITER,flags),
saturn:calcPlanet(jd,swe.SE_SATURN,flags),
rahu:calcPlanet(jd,swe.SE_TRUE_NODE,flags)
}

planets.ketu=normalize360(planets.rahu+180)

const keys=Object.keys(planets)
let aspects=[]

for(let i=0;i<keys.length;i++){
for(let j=i+1;j<keys.length;j++){
const p1=keys[i]
const p2=keys[j]
const diff=angularDistance(planets[p1],planets[p2])
const aspect=detectAspect(diff)

if(aspect){
aspects.push({
planet1:p1,
planet2:p2,
angle:round(diff,3),
aspect:aspect.name,
exact_angle:aspect.exact_angle,
orb:aspect.orb
})
}
}
}

res.status(200).json({
timestamp:now.toISOString(),
zodiac:"sidereal",
ayanamsa:"lahiri",
aspects
})

}catch(err){
res.status(500).json({
error:"aspect engine failure",
details:String(err)
})
}
}
