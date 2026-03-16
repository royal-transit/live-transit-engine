export default async function handler(req,res){

try{

const host=req.headers.host
const base="https://"+host

const endpoints={
transit:base+"/api/transit",
chart:base+"/api/chart",
aspects:base+"/api/aspects",
divisional:base+"/api/divisional",
dasha:base+"/api/dasha",
strength:base+"/api/strength"
}

const result={}

for(const key in endpoints){

try{

const r=await fetch(endpoints[key])
result[key]=await r.json()

}catch(e){

result[key]={error:"failed",endpoint:endpoints[key]}

}

}

res.status(200).json({

timestamp:new Date().toISOString(),
oracle:result

})

}catch(err){

res.status(500).json({
error:"oracle crash",
details:String(err)
})

}

}
