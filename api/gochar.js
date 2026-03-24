export default async function handler(req, res) {
  try {
    const lat = parseFloat(req.query?.lat ?? "51.5074");
    const lon = parseFloat(req.query?.lon ?? "-0.1278");

    const proto =
      req.headers["x-forwarded-proto"] ||
      req.headers["x-forwarded-protocol"] ||
      "https";

    const host = req.headers.host;
    const base = ${proto}://${host}/api;
    const qs = ?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)};

    async function safeFetchJson(url) {
      try {
        const response = await fetch(url);
        return await response.json();
      } catch (error) {
        return {
          error: "fetch_failed",
          details: error && error.message ? error.message : "unknown fetch failure",
          url
        };
      }
    }

    const transit = await safeFetchJson(${base}/transit${qs});

    if (!transit || transit.error || !transit.moon || !transit.saturn || !transit.jupiter) {
      return res.status(200).json({
        timestamp: new Date().toISOString(),
        gochar: {
          status: "unavailable",
          reason: "transit_packet_missing_or_invalid"
        },
        engine_status: "gochar_restricted"
      });
    }

    const moonSign = transit.moon.sign;
    const saturnSign = transit.saturn.sign;
    const jupiterSign = transit.jupiter.sign;

    const effects = [];

    if (saturnSign === moonSign) {
      effects.push("Saturn over Moon sign: emotional-pressure or Sade-Sati-type intensity support signal");
    }

    if (jupiterSign === moonSign) {
      effects.push("Jupiter over Moon sign: support, expansion, or protective uplift signal");
    }

    if (effects.length === 0) {
      effects.push("No major Moon-sign overlay detected in this basic transit summary");
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      gochar: {
        source: "transit_packet_embedded",
        moon_sign: moonSign,
        saturn_position: saturnSign,
        jupiter_position: jupiterSign,
        effects: effects,
        interpretation_level: "basic_support_only"
      },
      engine_status: "gochar_support_ready"
    });
  } catch (error) {
    return res.status(200).json({
      error: "gochar_engine_failed",
      details: error && error.message ? error.message : "unknown gochar error"
    });
  }
}
