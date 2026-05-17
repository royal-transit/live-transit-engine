export default async function handler(req, res) {
  try {
    const ENGINE_STATUS = "ROYEL_SPIRITUAL_ALIGNMENT_ENGINE_V2";

    const ROYEL_PROFILE = {
      name: "Md Manjurul Karim Royel",
      daily_name: "Royel",
      dob: "1988-12-11",
      tob: "10:59",
      pob: "Jhenaidah, Bangladesh",
      birth_timezone: "Asia/Dhaka",
      current_location: "Ashford, UK",
      current_timezone: "Europe/London",
      path_signature: "Naqshbandi Silent Depth + Hybrid Universal Sufi Discipline",
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

    const moon = transitData?.moon || {};
    const sun = transitData?.sun || {};
    const mercury = transitData?.mercury || {};
    const venus = transitData?.venus || {};
    const mars = transitData?.mars || {};
    const jupiter = transitData?.jupiter || {};
    const saturn = transitData?.saturn || {};
    const rahu = transitData?.rahu || {};
    const ketu = transitData?.ketu || {};

    const moonNakshatra = moon?.nakshatra || null;
    const moonLord = moon?.nakshatra_lord || null;
    const weekday = transitData?.panchanga?.weekday || null;
    const tithi = transitData?.panchanga?.tithi || null;

    const dominantTrigger =
      transitData?.micro_dominant_trigger?.type ||
      oracleData?.micro_dominant_trigger?.type ||
      null;

    const liveClassification =
      oracleData?.final_classification ||
      oracleData?.oracle_verdict?.final_classification ||
      oracleData?.courtroom_packet?.final_verdict_lock ||
      null;

    function isSign(planet, sign) {
      return planet?.sign === sign;
    }

    function isNakLord(planet, lord) {
      return planet?.nakshatra_lord === lord;
    }

    function hasRahuField() {
      return rahu?.sign || rahu?.nakshatra;
    }

    function scoreSpiritualChannel() {
      const scores = {
        silent_zikr: 0,
        muraqaba: 0,
        protection: 0,
        salawat: 0,
        rizq_cleaning: 0,
        speech_control: 0,
        grounding: 0
      };

      if (moon?.dignity === "exalted") {
        scores.silent_zikr += 3;
        scores.muraqaba += 2;
        scores.emotional_control = 3;
      }

      if (moonLord === "Sun" || sun?.nakshatra_lord === "Sun") {
        scores.presence = 3;
        scores.speech_control += 2;
      }

      if (saturn?.sign === "Pisces" || saturn?.nakshatra_lord === "Saturn") {
        scores.grounding += 3;
        scores.silent_zikr += 2;
      }

      if (hasRahuField()) {
        scores.protection += 3;
        scores.speech_control += 2;
      }

      if (mercury?.combust) {
        scores.speech_control += 3;
        scores.muraqaba += 1;
      }

      if (venus?.sign === "Gemini" || isNakLord(venus, "Mars")) {
        scores.salawat += 2;
        scores.relationship_softening = 2;
      }

      if (jupiter?.nakshatra_lord === "Jupiter") {
        scores.rizq_cleaning += 3;
        scores.salawat += 2;
      }

      return scores;
    }

    const scores = scoreSpiritualChannel();

    const dominantPractice =
      scores.protection >= 5
        ? "protection + silent zikr"
        : scores.silent_zikr >= 5
        ? "silent zikr + muraqaba"
        : scores.rizq_cleaning >= 4
        ? "rizq cleaning + salawat"
        : scores.speech_control >= 4
        ? "speech control + muraqaba"
        : "silent zikr + salawat";

    const dailyFormula = {
      main_practice: dominantPractice,
      primary_zikr:
        dominantPractice.includes("protection")
          ? "Hasbunallahu wa ni'mal wakeel"
          : dominantPractice.includes("rizq")
          ? "Ya Fattah Ya Razzaq"
          : dominantPractice.includes("speech")
          ? "Ya Haleem Ya Lateef"
          : "Allah / Ya Latif / Ya Basir",

      counts:
        dominantPractice.includes("protection")
          ? { hasbunallah: 33, ayatul_kursi: 1, salawat: 33 }
          : dominantPractice.includes("rizq")
          ? { ya_fattah: 129, ya_razzaq: 100, salawat: 100 }
          : dominantPractice.includes("speech")
          ? { ya_haleem: 88, ya_latif: 129, salawat: 33 }
          : { allah: 100, ya_latif: 129, ya_basir: 313, salawat: 100 },

      best_window_policy:
        "Post-Isha silence or Tahajjud zone. Avoid noisy or emotionally heated time.",

      activation_target:
        "Basirah, inner calm, spiritual presence, emotional control, protection and rizq alignment."
    };

    const avoidToday = [
      mercury?.combust ? "unnecessary arguments or fast replies" : null,
      hasRahuField() ? "obsessive searching, fear-based ritual chasing" : null,
      saturn?.sign ? "rushing decisions before inner calm returns" : null,
      mars?.sign === "Aries" ? "anger reaction and ego clash" : null
    ].filter(Boolean);

    const foodGuidance = {
      recommended:
        moon?.dignity === "exalted"
          ? ["light warm food", "milk/honey style softness if suitable", "simple clean water"]
          : ["light food", "clean water"],
      avoid:
        hasRahuField()
          ? ["excess caffeine", "heavy late-night spicy food", "overeating"]
          : ["overeating"]
    };

    return res.status(200).json({
      engine_status: ENGINE_STATUS,
      system_status: "OK",
      mode: "ROYEL_ONLY_SPIRITUAL_ALIGNMENT",
      subject_lock: ROYEL_PROFILE,
      current_time_utc: now.toISOString(),

      backend_integration: {
        transit_loaded: !!transitData?.moon,
        oracle_loaded: !!oracleData,
        transit_engine_status: transitData?.engine_status || null,
        oracle_engine_status: oracleData?.engine_status || null
      },

      live_sky_extract: {
        weekday,
        tithi,
        moon,
        moon_nakshatra: moonNakshatra,
        moon_nakshatra_lord: moonLord,
        sun,
        mercury,
        venus,
        mars,
        jupiter,
        saturn,
        rahu,
        ketu
      },

      live_trigger_extract: {
        dominant_trigger: dominantTrigger,
        micro_status: transitData?.micro_status || null,
        micro_convergence: transitData?.micro_convergence || null,
        micro_dominant_trigger: transitData?.micro_dominant_trigger || null,
        oracle_classification: liveClassification
      },

      spiritual_path_decision: {
        primary_path: "Naqshbandi Silent Depth",
        support_path: "Hybrid Universal Sufi Discipline",
        strictness: "HIGH",
        avoid:
          "Over-force activation, obsession, chaotic rituals, excessive isolation, fear-based occultism."
      },

      planetary_spiritual_scores: scores,
      daily_formula: dailyFormula,
      avoid_today: avoidToday,
      food_guidance: foodGuidance,

      practical_controls: [
        "Speak less today before inner field settles.",
        "Keep zikr silent, slow and breath-linked.",
        "Do not chase signs; complete the count and leave the result.",
        "Avoid emotional reaction after sunset."
      ],

      guidance_status:
        "PLANETARY SPIRITUAL MATCHING ACTIVE. Exact time-window calculator pending next step.",

      next_build_step:
        "Add UK+BD exact practice windows using planetary hour / night window / moon condition."
    });
  } catch (error) {
    return res.status(500).json({
      engine_status: "ROYEL_SPIRITUAL_ALIGNMENT_ENGINE_V2",
      system_status: "FAILED",
      error: error?.message || "unknown spiritual alignment engine error"
    });
  }
}