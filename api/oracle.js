import { calculateConfidence } from "./confidence";

export default async function handler(req, res) {
  try {
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    const birthDateTime = req.query?.birth_datetime || null;

    const transitUrl = birthDateTime
      ? `${baseUrl}/api/transit?birth_datetime=${encodeURIComponent(birthDateTime)}`
      : `${baseUrl}/api/transit`;

    const multiSnapshotUrl = birthDateTime
      ? `${baseUrl}/api/multi-snapshot?birth_datetime=${encodeURIComponent(birthDateTime)}`
      : `${baseUrl}/api/multi-snapshot`;

    const transitResponse = await fetch(transitUrl);
    const packet = await transitResponse.json();

    const multiSnapshotResponse = await fetch(multiSnapshotUrl);
    const multiSnapshot = await multiSnapshotResponse.json();

    const moonSign = packet?.moon?.sign || null;
    const sunSign = packet?.sun?.sign || null;
    const saturnSign = packet?.saturn?.sign || null;
    const jupiterSign = packet?.jupiter?.sign || null;
    const marsSign = packet?.mars?.sign || null;

    let influences = [];

    if (moonSign === "Taurus" && sunSign === "Pisces") {
      influences.push("emotional stability + spiritual pull");
    }

    if (saturnSign === "Pisces") {
      influences.push("karmic pressure");
    }

    if (jupiterSign === "Gemini") {
      influences.push("knowledge expansion");
    }

    if (marsSign === "Aquarius") {
      influences.push("unconventional action");
    }

    const confidence = calculateConfidence(packet, multiSnapshot);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      source: "live_transit_api",
      planets: {
        moon: moonSign,
        sun: sunSign,
        saturn: saturnSign,
        jupiter: jupiterSign,
        mars: marsSign
      },
      analysis: {
        influences: influences,
        summary: influences.length ? influences.join(" | ") : "no major structured influence detected"
      },
      confidence: confidence,
      transit_packet_status: {
        dasha: packet?.dasha?.status || null,
        divisional: packet?.divisional?.status || null,
        micro_precision: packet?.micro_status?.precision_allowed || null
      },
      multi_snapshot: {
        snapshot_count: multiSnapshot?.snapshot_count || 0,
        active_trigger_snapshots: multiSnapshot?.active_trigger_snapshots || 0,
        convergence_strength: multiSnapshot?.convergence_strength || "low",
        dominant_trigger_identity: multiSnapshot?.dominant_trigger_identity || null
      },
      engine_status: "oracle_structured_v4_confidence_live"
    });

  } catch (error) {
    return res.status(500).json({
      status: "oracle_failed",
      message: error.message
    });
  }
}