export default async function handler(req,res){

try{

const host=req.headers.host
const protocol="https"

const lat=req.query.lat || "51.1465"
const lon=req.query.lon || "0.8756"

const base=${protocol}://${host}

async function safeFetch(url){
  try{
    const r=await fetch(url)
    return await r.json()
  }catch(e){
    return {error:"endpoint failed",url}
  }
}

const transit=await safeFetch(${base}/api/transit?lat=${lat}&lon=${lon})
const chart=await safeFetch(${base}/api/chart?lat=${lat}&lon=${lon})
const aspects=await safeFetch(${base}/api/aspects)
const divisional=await safeFetch(${base}/api/divisional)
const dasha=await safeFetch(${base}/api/dasha)
const strength=await safeFetch(${base}/api/strength)

res.status(200).json({

timestamp:new Date().toISOString(),

input:{
latitude:Number(lat),
longitude:Number(lon)
},

transit,
chart,
aspects,
divisional,
dasha,
strength

})

}catch(err){

res.status(500).json({
error:"oracle engine failure",
details:String(err)
})

}

}
