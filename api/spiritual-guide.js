export default async function handler(req, res) {
  try {

    const ENGINE_STATUS =
      "ROYEL_SPIRITUAL_ALIGNMENT_ENGINE_V1";

    const ROYEL_PROFILE = {
      name: "Md Manjurul Karim Royel",
      dob: "1988-12-11",
      tob: "10:59",
      pob: "Jhenaidah, Bangladesh",
      timezone: "Asia/Dhaka",
      current_location: "Ashford, UK"
    };

    const now = new Date();
    const transitResponse =
      await fetch(
        "https://live-transit-engine.vercel.app/api/transit"
      );

    const transitData =
      await transitResponse.json();

    const oracleResponse =
      await fetch(
        "https://live-transit-engine.vercel.app/api/oracle"
      );

    const oracleData =
      await oracleResponse.json();
    return res.status(200).json({
      engine_status: ENGINE_STATUS,
      system_status: "ONLINE",

      subject_lock: ROYEL_PROFILE,

      current_time_utc: now.toISOString(),

      mode: "SPIRITUAL_ALIGNMENT",

      spiritual_priority: [
              live_transit_loaded:
        transitData?.system_status === "OK",

      live_oracle_loaded:
        oracleData?.system_status === "OK",

      current_moon_nakshatra:
        transitData?.moon?.nakshatra || null,

      dominant_live_pressure:
        oracleData?.final_classification || null,
        "Basirah",
        "Divine Connection",
        "Emotional Control",
        "Presence",
        "Protection",
        "Rizq Alignment"
      ],

      next_step:
        "Transit/oracle integration pending"

    });

  } catch (error) {

    return res.status(500).json({
      system_status: "FAILED",
      error:
        error?.message || "unknown spiritual engine error"
    });

  }
}