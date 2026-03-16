import swe from "swisseph-v2"

const SIGNS = [
"Aries","Taurus","Gemini","Cancer","Leo","Virgo",
"Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
]

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

function parseHouseResult(result){

if(!result) throw new Error("Swiss Ephemeris houses returned empty")

const housesArray =
result.house ??
result.houses ??
result.xx

if(!housesArray || !housesArray[1]){
throw new Error("houses array missing")
}

return housesArray
}

export default async function handler(req,res){

try{

const now=new Date()

const lat=parseFloat(req.query.lat ?? "51.5074")
const lon=parseFloat(req.query.lon ?? "-0.1278")

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

const housesRaw=swe.swe_houses(
jd,
lat,
lon,
"P"
)

const housesArray=parseHouseResult(housesRaw)

let houses={}

for(let i=1;i<=12;i++){
houses[i]=round(normalize360(housesArray[i]))
}

const ascendant=housesArray[1]

const ascData=signFromLongitude(ascendant)

res.status(200).json({

timestamp:now.toISOString(),

location_used:{
latitude:lat,
longitude:lon
},

ascendant:{
longitude:round(ascendant),
sign:ascData.sign,
degree:ascData.degree
},

houses

})

}catch(err){

res.status(500).json({
error:"chart engine failure",
details:String(err)
})

}

}
