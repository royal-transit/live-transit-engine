export default async function handler(req, res) {
  try {
    const ENGINE_STATUS =
      "ROYEL_SPIRITUAL_ALIGNMENT_ENGINE_V1";

    const ROYEL_PROFILE = {
      name: "Md Manjurul Karim Royel",
      daily_name: "Royel",
      dob: "1988-12-11",
      tob: "10:59",
      pob: "Jhenaidah, Bangladesh",
      birth_timezone: "Asia/Dhaka",
      current_location: "Ashford, UK",
      current_timezone: "Europe/London",
      path_signature:
        "Naqshbandi Silent Depth + Hybrid Universal Sufi Discipline",
      strictness: "HIGH",
      priority_order: [
        "Basirah",
        "Divine Connection",
        "Emotional Control",
        "Presence",
        "Protection",
        "Rizq Alignment"
      ]
    };

    const now = new Date();

    const transitResponse = await fetch(
      "https://live-transit-engine.vercel.app/api/transit"
    );

    const transitData = await transitResponse.json();

    const oracleResponse = await fetch(
      "https://live-transit-engine.vercel.app/api/oracle"
    );

    const oracleData = await oracleResponse.json();

    const moonNakshatra =
      transitData?.moon?.nakshatra || null;

    const moonLord =
      transitData?.moon?.nakshatra_lord || null;

    const weekday =
      transitData?.panchanga?.weekday || null;

    const tithi =
      transitData?.panchanga?.tithi || null;

    const dominantTrigger =
      transitData?.micro_dominant_trigger?.type ||
      oracleData?.micro_dominant_trigger?.type ||
      null;

    const liveClassification =
      oracleData?.final_classification ||
      oracleData?.oracle_verdict?.final_classification ||
      oracleData?.courtroom_packet?.final_verdict_lock ||
      null;

    return res.status(200).json({
      engine_status: ENGINE_STATUS,
      system_status: "OK",

      mode: "ROYEL_ONLY_SPIRITUAL_ALIGNMENT",

      subject_lock: ROYEL_PROFILE,

      current_time_utc: now.toISOString(),

      backend_integration: {
        transit_loaded:
          transitData?.system_status === "OK" ||
          transitData?.system_status === "ONLINE" ||
          !!transitData?.moon,

        oracle_loaded:
          oracleData?.system_status === "OK" ||
          oracleData?.system_status === "ONLINE" ||
          !!oracleData,

        transit_engine_status:
          transitData?.engine_status || null,

        oracle_engine_status:
          oracleData?.engine_status || null
      },

      live_sky_extract: {
        weekday,
        tithi,
        moon: transitData?.moon || null,
        moon_nakshatra: moonNakshatra,
        moon_nakshatra_lord: moonLord,
        sun: transitData?.sun || null,
        mercury: transitData?.mercury || null,
        venus: transitData?.venus || null,
        mars: transitData?.mars || null,
        jupiter: transitData?.jupiter || null,
        saturn: transitData?.saturn || null,
        rahu: transitData?.rahu || null,
        ketu: transitData?.ketu || null
      },

      live_trigger_extract: {
        dominant_trigger: dominantTrigger,
        micro_status: transitData?.micro_status || null,
        micro_convergence: transitData?.micro_convergence || null,
        micro_dominant_trigger:
          transitData?.micro_dominant_trigger || null,
        oracle_classification: liveClassification
      },

      spiritual_path_decision: {
        primary_path: "Naqshbandi Silent Depth",
        support_path: "Hybrid Universal Sufi Discipline",
        reason:
          "Royel profile favours silent zikr, muraqaba, controlled speech, symbolic absorption, discipline, protection, basirah and steady divine alignment.",
        avoid:
          "Over-force activation, obsession, chaotic rituals, excessive isolation, fear-based occultism."
      },

      daily_formula_seed: {
        main_practice:
          "silent zikr + muraqaba + controlled speech",

        base_zikr:
          "Allah / Ya Latif / Ya Basir",

        default_counts: {
          salawat: 100,
          ya_latif: 129,
          ya_basir: 313,
          hasbunallah: 33
        },

        timing_policy:
          "Prefer night silence, post-Isha, Tahajjud zone, or calm low-noise window. Exact timing generator pending.",

        activation_target:
          "Basirah, inner calm, spiritual presence, emotional control, protection and rizq alignment."
      },

      guidance_status:
        "LIVE TRANSIT + ORACLE INTEGRATION ACTIVE. Daily formula generator pending next step.",

      next_build_step:
        "Add planetary-to-practice matching table: Moon/Saturn/Rahu/Jupiter/Venus/Mercury triggers → exact zikr, count, timing, avoid list."
    });
  } catch (error) {
    return res.status(500).json({
      engine_status:
        "ROYEL_SPIRITUAL_ALIGNMENT_ENGINE_V1",
      system_status: "FAILED",
      error:
        error?.message ||
        "unknown spiritual alignment engine error"
    });
  }
}