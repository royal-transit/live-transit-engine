export default async function handler(req,res){
  try{
    return res.status(200).json({
      timestamp:new Date().toISOString(),
      confidence:{
        status:"disabled_for_stability",
        score:null,
        band:null,
        note:"Nested internal fetch removed to prevent serverless crash"
      }
    })
  }catch(err){
    return res.status(500).json({
      error:"confidence engine failure",
      details:String(err)
    })
  }
}
