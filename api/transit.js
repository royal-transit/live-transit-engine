export default async function handler(req, res) {
  try {

    const lat = parseFloat(req.query?.lat || "51.5074");
    const lon = parseFloat(req.query?.lon || "-0.1278");

    const response = await fetch(
      https://api.astronomyapi.com/api/v2/bodies/positions?latitude=${lat}&longitude=${lon}
    );

    const data = await response.json();

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      location_used: {
        latitude: lat,
        longitude: lon
      },
      raw_data: data,
      engine_status: "transit_live_with_location"
    });

  } catch (error) {

    return res.status(500).json({
      status: "transit_failed",
      message: error.message
    });

  }
}
