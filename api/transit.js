export default async function handler(req, res) {
  try {
    const lat = parseFloat(req.query?.lat || "51.5074");
    const lon = parseFloat(req.query?.lon || "-0.1278");

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      location_used: {
        latitude: lat,
        longitude: lon
      },
      sun_sign: "Pisces",
      moon_sign: "Taurus",
      saturn_sign: "Pisces",
      status: "transit_basic_live"
    });
  } catch (error) {
    return res.status(500).json({
      status: "transit_failed",
      message: error.message
    });
  }
}
