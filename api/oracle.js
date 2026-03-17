export default async function handler(req, res) {
  try {
    let lat = parseFloat(req.query.lat);
    let lon = parseFloat(req.query.lon);

    if (isNaN(lat) || isNaN(lon)) {
      lat = 51.5074;
      lon = -0.1278;
    }

    const base = "https://live-transit-engine.vercel.app/api";

    const qs = "?lat=" + lat + "&lon=" + lon;

    const transit = await fetch(base + "/transit" + qs).then(r => r.json()).catch(() => ({}));
    const kp = await fetch(base + "/kp" + qs).then(r => r.json()).catch(() => ({}));
    const dasha = await fetch(base + "/dasha" + qs).then(r => r.json()).catch(() => ({}));
    const divisional = await fetch(base + "/divisional" + qs).then(r => r.json()).catch(() => ({}));
    const aspects = await fetch(base + "/aspects" + qs).then(r => r.json()).catch(() => ({}));
    const strength = await fetch(base + "/strength" + qs).then(r => r.json()).catch(() => ({}));
    const gochar = await fetch(base + "/gochar" + qs).then(r => r.json()).catch(() => ({}));
    const event = await fetch(base + "/event" + qs).then(r => r.json()).catch(() => ({}));
    const confidence = await fetch(base + "/confidence" + qs).then(r => r.json()).catch(() => ({}));

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      authority: {
        engine_name: "ROYEL_ASTRO_ENGINE",
        primary_calculation_authority: "Swiss Ephemeris",
        zodiac: "sidereal",
        ayanamsa: "lahiri"
      },
      evidence_packet: {
        transit: transit,
        kp: kp,
        dasha: dasha,
        divisional: divisional,
        aspects: aspects,
        strength: strength,
        gochar: gochar,
        event: event,
        confidence: confidence
      }
    });
  } catch (error) {
    return res.status(200).json({
      status: "oracle_error",
      message: error.message
    });
  }
}
