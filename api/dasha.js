module.exports = async function handler(req, res) {
  try {
    const input = req.method === "POST" ? (req.body || {}) : (req.query || {});
    const now = new Date();

    const moonLongitude = Number(
      input.moon_longitude ??
      input.moonLongitude ??
      input.natal_moon_longitude ??
      input.natalMoonLongitude
    );

    if (!Number.isFinite(moonLongitude)) {
      return res.status(200).json({
        error: "dasha engine failure",
        details: "moon_longitude required"
      });
    }

    // 🔒 minimal safe output (no heavy calc → no crash)
    const nakIndex = Math.floor((moonLongitude % 360) / (360 / 27));

    return res.status(200).json({
      status: "OK",
      moon_longitude: moonLongitude,
      nakshatra_index: nakIndex,
      message: "dasha api alive (safe mode)"
    });

  } catch (err) {
    console.error("DASHA FATAL:", err);

    return res.status(200).json({
      error: "dasha engine failure",
      details: err.message
    });
  }
};
