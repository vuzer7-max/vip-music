/* GET /api/status: tells the page which features have their keys configured. */
module.exports=(req,res)=>{res.setHeader('cache-control','no-store');res.status(200).json({ok:true,ai:!!process.env.ANTHROPIC_API_KEY,listen:!!process.env.AUDD_API_TOKEN,transcribe:!!process.env.OPENAI_API_KEY})};
