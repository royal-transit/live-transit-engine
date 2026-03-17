export default async function handler(req, res) {

  try {

    const base = "https://live-transit-engine.vercel.app/api";

    const transit = await fetch(base + "/transit").then(r => r.json()).catch(() => ({}));
    const kp = await fetch(base + "/kp").then(r => r.json()).catch(() => ({}));
    const dasha = await fetch(base + "/dasha").then(r => r.json()).catch(() => ({}));
    const divisional = await fetch(base + "/divisional").then(r => r.json()).catch(() => ({}));
    const aspects = await fetch(base + "/aspects").then(r => r.json()).catch(() => ({}));
    const strength = await fetch(base + "/strength").then(r => r.json()).catch(() => ({}));
    const gochar = await fetch(base + "/gochar").then(r => r.json()).catch(() => ({}));
    const event = await fetch(base + "/event").then(r => r.json()).catch(() => ({}));
    const confidence = await fetch(base + "/confidence").then(r => r.json()).catch(() => ({}));

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      authority: {
        engine_name: "ROYEL_ASTRO_ENGINE",
        primary_calculation_authority: "Swiss Ephemeris",
        zodiac: "sidereal",
        ayanamsa: "lahiri"
      },
      evidence_packet: {
        transit,
        kp,
        dasha,
        divisional,
        aspects,
        strength,
        gochar,
        event,
        confidence
      }
    });

  } catch (error) {

    return res.status(200).json({
      status: "oracle_error",
      message: error.message
    });

  }
}
