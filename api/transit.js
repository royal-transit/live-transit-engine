
export default async function handler(req, res) {
  try {
    res.status(200).json({
      status: "Transit engine active",
      source: "api/transit.js",
      time: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: "Transit handler failed",
      details: String(error)
    });
  }
