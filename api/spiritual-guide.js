export default async function handler(req, res) {
  try {
    const ENGINE_STATUS =
      "ROYEL_SPIRITUAL_ALIGNMENT_ENGINE_V4_PUBLIC_BASIRAH";

    const ROYEL_PROFILE = {
      name: "Md Manjurul Karim Royel",
      daily_name: "Royel",
      dob: "1988-12-11",
      tob: "10:59",
      pob: "Jhenaidah, Bangladesh",
      birth_datetime: "1988-12-11T10:59:00+06:00",
      birth_timezone: "Asia/Dhaka",
      current_location: "Ashford, UK",
      current_timezone: "Europe/London",
      current_latitude: 51.1486,
      current_longitude: 0.8728,
      path_signature:
        "Naqshbandi Silent Depth + Public Spiritual Authority + Hybrid Universal Sufi Discipline",
      strictness: "HIGH",
      destiny_signature:
        "Silent inner power + public magnetic guidance + remedy craft + client reading authority",
      destiny_focus: [
        "Divine Connection",
        "Basirah / Inner Seeing",
        "Dream & Vision Signal",
        "Prediction Intuition",
        "Client Reading Power",
        "Remedy Crafting",
        "Symbol / Food / Taweez Sensitivity",
        "Mass Attraction / Public Pull",
        "Spiritual Authority Presence",
        "Voice / Speech Magnetism",
        "Social Media Influence",
        "Trust Building",
        "Reputation Growth",
        "Rizq Alignment",
        "Protection",
        "Emotional Control",
        "Discipline",
        "Hidden Knowledge Integration"
      ]
    };

    const now = new Date();

    function buildQuery(extra = {}) {
      const q = new URLSearchParams({
        name: "Royel",
        dob: ROYEL_PROFILE.dob,
        tob: "10:59:00",
        pob: ROYEL_PROFILE.pob,
        birth_datetime: ROYEL_PROFILE.birth_datetime,
        timezone_offset: "+06:00",
        latitude: String(ROYEL_PROFILE.current_latitude),
        longitude: String(ROYEL_PROFILE.current_longitude),
        current_datetime_iso: now.toISOString(),
        ...extra
      });
      return q.toString();
    }

    const transitUrl =
      "https://live-transit-engine.vercel.app/api/transit?" +
      buildQuery({ mode: "raw" });

    const oracleUrl =
      "https://live-transit-engine.vercel.app/api/oracle?" +
      buildQuery({
        question:
          "Royel personal spiritual alignment, divine connection, basirah, public attraction, remedy craft today"
      });

    const transitResponse = await fetch(transitUrl);
    const transitData = await transitResponse.json();

    const oracleResponse = await fetch(oracleUrl);
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
      oracleData?.signal_reduction_result ||
      null;

    function addScore(obj, key, value) {
      obj[key] = (obj[key] || 0) + value;
    }

    function hasPlanet(p) {
      return !!(p?.sign || p?.nakshatra || p?.nakshatra_lord);
    }

    function rankScores(scores) {
      return Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .map(([gate, score]) => ({ gate, score }));
    }

    function activation(score) {
      if (score >= 8) return "VERY_HIGH";
      if (score >= 6) return "HIGH";
      if (score >= 4) return "MEDIUM";
      if (score >= 2) return "LIGHT";
      return "LOW";
    }

    function statusByScore(score, high = 6, medium = 4) {
      if (score >= high) return "OPEN";
      if (score >= medium) return "BUILDING";
      if (score > 0) return "SUPPORT";
      return "QUIET";
    }

    function getTimePartsInZone(date, timeZone) {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      }).formatToParts(date);

      const out = {};
      for (const p of parts) {
        if (p.type !== "literal") out[p.type] = p.value;
      }
      return out;
    }

    function getZoneOffsetMinutes(date, timeZone) {
      const p = getTimePartsInZone(date, timeZone);
      const asUTC = Date.UTC(
        Number(p.year),
        Number(p.month) - 1,
        Number(p.day),
        Number(p.hour),
        Number(p.minute)
      );
      return Math.round((asUTC - date.getTime()) / 60000);
    }

    function zonedLocalToUTC(date, timeText, timeZone) {
      const base = getTimePartsInZone(date, timeZone);
      const [hh, mm] = timeText.split(":").map(Number);
      const guess = new Date(
        Date.UTC(
          Number(base.year),
          Number(base.month) - 1,
          Number(base.day),
          hh,
          mm
        )
      );
      const offset = getZoneOffsetMinutes(guess, timeZone);
      return new Date(guess.getTime() - offset * 60000);
    }

    function formatInZone(date, timeZone) {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone,
        weekday: "long",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      }).format(date);
    }

    function convertWindowUKtoBD(windowUK) {
      const [start, end] = windowUK.split("-");
      const startUTC = zonedLocalToUTC(now, start, "Europe/London");
      const endUTC = zonedLocalToUTC(now, end, "Europe/London");

      return {
        uk_window: windowUK,
        uk_start: formatInZone(startUTC, "Europe/London"),
        uk_end: formatInZone(endUTC, "Europe/London"),
        bd_start: formatInZone(startUTC, "Asia/Dhaka"),
        bd_end: formatInZone(endUTC, "Asia/Dhaka")
      };
    }

    const gateScores = {
      divine_connection: 0,
      basirah: 0,
      dream_vision: 0,
      prediction_intuition: 0,
      client_reading_power: 0,
      remedy_crafting: 0,
      taweez_symbolic_sensitivity: 0,
      mass_attraction: 0,
      public_presence: 0,
      voice_magnetism: 0,
      social_media_influence: 0,
      trust_building: 0,
      reputation_growth: 0,
      rizq_alignment: 0,
      protection: 0,
      speech_control: 0,
      emotional_control: 0,
      grounding: 0,
      discipline: 0
    };

    if (moon?.dignity === "exalted") {
      addScore(gateScores, "divine_connection", 3);
      addScore(gateScores, "basirah", 3);
      addScore(gateScores, "dream_vision", 2);
      addScore(gateScores, "client_reading_power", 2);
      addScore(gateScores, "emotional_control", 3);
      addScore(gateScores, "trust_building", 2);
    }

    if (moon?.nakshatra_lord === "Sun" || sun?.nakshatra_lord === "Sun") {
      addScore(gateScores, "public_presence", 4);
      addScore(gateScores, "spiritual_authority", 3);
      addScore(gateScores, "prediction_intuition", 2);
      addScore(gateScores, "speech_control", 2);
      addScore(gateScores, "reputation_growth", 3);
    }

    if (dominantTrigger === "moon_mercury_conjunction") {
      addScore(gateScores, "basirah", 4);
      addScore(gateScores, "prediction_intuition", 4);
      addScore(gateScores, "client_reading_power", 5);
      addScore(gateScores, "speech_control", 4);
      addScore(gateScores, "voice_magnetism", 3);
      addScore(gateScores, "remedy_crafting", 3);
    }

    if (mercury?.combust) {
      addScore(gateScores, "speech_control", 4);
      addScore(gateScores, "client_reading_power", 2);
      addScore(gateScores, "remedy_crafting", 1);
      addScore(gateScores, "voice_magnetism", -1);
    }

    if (hasPlanet(venus)) {
      addScore(gateScores, "mass_attraction", 3);
      addScore(gateScores, "voice_magnetism", 3);
      addScore(gateScores, "trust_building", 2);
      addScore(gateScores, "relationship_softening", 2);
      addScore(gateScores, "remedy_crafting", 2);
    }

    if (venus?.sign === "Gemini") {
      addScore(gateScores, "social_media_influence", 4);
      addScore(gateScores, "voice_magnetism", 3);
      addScore(gateScores, "client_reading_power", 2);
      addScore(gateScores, "mass_attraction", 2);
    }

    if (hasPlanet(jupiter)) {
      addScore(gateScores, "divine_connection", 3);
      addScore(gateScores, "rizq_alignment", 4);
      addScore(gateScores, "trust_building", 4);
      addScore(gateScores, "reputation_growth", 3);
      addScore(gateScores, "public_presence", 2);
    }

    if (jupiter?.nakshatra_lord === "Jupiter") {
      addScore(gateScores, "spiritual_authority", 3);
      addScore(gateScores, "remedy_crafting", 2);
      addScore(gateScores, "mass_attraction", 2);
    }

    if (saturn?.sign === "Pisces" || saturn?.nakshatra_lord === "Saturn") {
      addScore(gateScores, "grounding", 4);
      addScore(gateScores, "discipline", 5);
      addScore(gateScores, "spiritual_authority", 3);
      addScore(gateScores, "protection", 2);
      addScore(gateScores, "reputation_growth", 2);
    }

    if (hasPlanet(rahu)) {
      addScore(gateScores, "social_media_influence", 5);
      addScore(gateScores, "mass_attraction", 4);
      addScore(gateScores, "taweez_symbolic_sensitivity", 4);
      addScore(gateScores, "protection", 4);
      addScore(gateScores, "dream_vision", 2);
    }

    if (rahu?.sign === "Aquarius") {
      addScore(gateScores, "mass_attraction", 3);
      addScore(gateScores, "social_media_influence", 4);
      addScore(gateScores, "public_presence", 2);
    }

    if (hasPlanet(ketu)) {
      addScore(gateScores, "dream_vision", 3);
      addScore(gateScores, "basirah", 2);
      addScore(gateScores, "detachment", 3);
      addScore(gateScores, "hidden_knowledge", 3);
    }

    if (mars?.sign === "Aries") {
      addScore(gateScores, "public_presence", 2);
      addScore(gateScores, "mass_attraction", 1);
      addScore(gateScores, "speech_control", 2);
      addScore(gateScores, "protection", 2);
    }

    const rankedGates = rankScores(gateScores);
    const strongestGate = rankedGates[0] || { gate: "silent_zikr", score: 0 };

    const innerPowerScore =
      gateScores.divine_connection +
      gateScores.basirah +
      gateScores.dream_vision +
      gateScores.prediction_intuition +
      gateScores.remedy_crafting +
      gateScores.protection;

    const publicPowerScore =
      gateScores.mass_attraction +
      gateScores.public_presence +
      gateScores.voice_magnetism +
      gateScores.social_media_influence +
      gateScores.trust_building +
      gateScores.reputation_growth;

    const todayMode =
      publicPowerScore >= innerPowerScore + 3
        ? "PUBLIC_MAGNETISM_DAY"
        : innerPowerScore >= publicPowerScore + 3
        ? "INNER_BASIRAH_DAY"
        : "INNER_POWER_PLUS_PUBLIC_CONTROL_DAY";

    let primaryPractice = "silent zikr + muraqaba";
    let primaryZikr = "Allah / Ya Latif / Ya Basir";
    let counts = {
      allah: 100,
      ya_latif: 129,
      ya_basir: 313,
      salawat: 100
    };

    if (
      strongestGate.gate === "mass_attraction" ||
      strongestGate.gate === "public_presence" ||
      strongestGate.gate === "social_media_influence"
    ) {
      primaryPractice =
        "public attraction discipline + salawat + clean presence";
      primaryZikr = "Ya Wadud / Ya Aziz / Salawat";
      counts = {
        ya_wadud: 100,
        ya_aziz: 94,
        salawat: 100,
        ya_latif: 129
      };
    }

    if (
      strongestGate.gate === "client_reading_power" ||
      strongestGate.gate === "prediction_intuition"
    ) {
      primaryPractice =
        "basirah muraqaba + client-reading silence + speech control";
      primaryZikr = "Ya Basir / Ya Latif / Allah";
      counts = {
        ya_basir: 313,
        ya_latif: 129,
        allah: 100,
        salawat: 100
      };
    }

    if (strongestGate.gate === "dream_vision") {
      primaryPractice =
        "night muraqaba + dream journal + silent zikr";
      primaryZikr = "Ya Nur / Ya Basir / Allah";
      counts = {
        ya_nur: 256,
        ya_basir: 313,
        allah: 100,
        salawat: 100
      };
    }

    if (strongestGate.gate === "taweez_symbolic_sensitivity") {
      primaryPractice =
        "symbolic anchor + protection zikr + clean intention";
      primaryZikr = "Hasbunallahu wa ni'mal wakeel / Ya Hafiz";
      counts = {
        hasbunallah: 33,
        ya_hafiz: 99,
        ayatul_kursi: 1,
        salawat: 33
      };
    }

    if (strongestGate.gate === "rizq_alignment") {
      primaryPractice =
        "rizq cleaning + gratitude + salawat discipline";
      primaryZikr = "Ya Fattah / Ya Razzaq";
      counts = {
        ya_fattah: 129,
        ya_razzaq: 100,
        salawat: 100
      };
    }

    const innerWindowUK =
      dominantTrigger === "moon_mercury_conjunction"
        ? "22:20-23:40"
        : moon?.dignity === "exalted"
        ? "21:50-23:50"
        : "22:40-23:20";

    const publicWindowUK =
      gateScores.public_presence >= 5 || gateScores.social_media_influence >= 5
        ? "11:30-14:30"
        : gateScores.voice_magnetism >= 5
        ? "18:30-20:30"
        : "12:00-14:00";

    const avoidWindowUK =
      gateScores.speech_control >= 5 || mars?.sign === "Aries"
        ? "16:00-19:00"
        : "19:30-21:00";

    const innerWindow = convertWindowUKtoBD(innerWindowUK);
    const publicWindow = convertWindowUKtoBD(publicWindowUK);
    const avoidWindow = convertWindowUKtoBD(avoidWindowUK);

    const allowedToday = {
      divine_connection: statusByScore(gateScores.divine_connection),
      basirah: statusByScore(gateScores.basirah),
      dream_vision: statusByScore(gateScores.dream_vision),
      prediction_intuition: statusByScore(gateScores.prediction_intuition),
      client_reading_power: statusByScore(gateScores.client_reading_power),
      remedy_crafting: statusByScore(gateScores.remedy_crafting),
      taweez_symbolic_sensitivity:
        statusByScore(gateScores.taweez_symbolic_sensitivity),
      mass_attraction: statusByScore(gateScores.mass_attraction),
      public_presence: statusByScore(gateScores.public_presence),
      voice_magnetism: statusByScore(gateScores.voice_magnetism),
      social_media_influence: statusByScore(gateScores.social_media_influence),
      trust_building: statusByScore(gateScores.trust_building),
      reputation_growth: statusByScore(gateScores.reputation_growth),
      protection: statusByScore(gateScores.protection)
    };

    const publicAction =
      todayMode === "PUBLIC_MAGNETISM_DAY"
        ? {
            action: "Post, voice note, client-facing content, public reading",
            style:
              "calm authority, short words, no overclaim, one strong message",
            warning:
              "Do not post from ego heat. Public pull works only with clean intention."
          }
        : todayMode === "INNER_POWER_PLUS_PUBLIC_CONTROL_DAY"
        ? {
            action: "Light public presence only after inner practice",
            style:
              "one controlled post or one client-reading message after zikr",
            warning:
              "Inner silence first, public action second."
          }
        : {
            action: "No major public push; focus on inner battery",
            style: "observe, write notes, prepare remedy method privately",
            warning:
              "Public action may scatter the field if done before grounding."
          };

    const avoidToday = [
      mercury?.combust
        ? "fast reply, argument, careless speech"
        : null,
      gateScores.protection >= 4
        ? "fear-based ritual chasing or over-force activation"
        : null,
      mars?.sign === "Aries"
        ? "anger reaction, ego clash, sudden decision"
        : null,
      "claiming vision as certainty without repeated confirmation",
      "mixing too many practices in one night"
    ].filter(Boolean);

    const foodGuidance = {
      recommended: [
        "light warm food",
        "simple clean water",
        "milk/honey softness if suitable",
        "avoid heavy stomach before practice"
      ],
      avoid: [
        "excess caffeine",
        "heavy late-night spicy food",
        "overeating",
        "practice immediately after emotional argument"
      ]
    };

    const practiceProtocol = {
      today_mode: todayMode,
      activation_level: activation(strongestGate.score),
      before_practice:
        "Wash hands/face, sit quietly, reduce phone/light, make intention silently.",
      main_practice: primaryPractice,
      zikr: primaryZikr,
      counts,
      inner_practice_window: innerWindow,
      public_action_window: publicWindow,
      avoid_window: avoidWindow,
      duration:
        "20-40 minutes. Do not force trance. Stop if agitation increases.",
      public_action_protocol: publicAction,
      dream_protocol:
        "After practice write date, feeling, dream fragments, symbols, names, colours, and first waking emotion.",
      remedy_crafting_rule:
        "Only create remedy when mind is calm, intention is clean, and same signal repeats. No fear-based taweez.",
      symbolic_anchor:
        allowedToday.taweez_symbolic_sensitivity === "OPEN"
          ? "Clean white paper, one intention word, folded near practice place. Do not overuse."
          : "No strong symbol today; use silent zikr.",
      safety_lock:
        "No guaranteed divine vision claim. Treat signs as training unless repeated, calm, useful and grounded."
    };

    const interpretationSeed = {
      today_meaning:
        todayMode === "PUBLIC_MAGNETISM_DAY"
          ? "Today supports public pull, voice presence and attraction, but only if speech stays clean and ego heat stays controlled."
          : todayMode === "INNER_BASIRAH_DAY"
          ? "Today supports inner seeing, dream signal, basirah and remedy design more than public push."
          : "Today supports both inner spiritual sharpening and controlled public presence.",
      inner_battery:
        "Silent zikr is the battery. Public attraction is the outer manifestation.",
      expected_internal_effect:
        "calmer mind, sharper observation, reduced scattered speech, stronger symbolic sensitivity.",
      expected_external_effect:
        "better client reading tone, stronger public presence, cleaner timing sense, controlled influence.",
      warning:
        "Do not chase signs. Repeat practice and verify through calmness, accuracy and useful results."
    };

    return res.status(200).json({
      engine_status: ENGINE_STATUS,
      system_status: "OK",
      mode: "ROYEL_ONLY_PUBLIC_BASIRAH_ALIGNMENT",
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
        micro_dominant_trigger:
          transitData?.micro_dominant_trigger || null,
        oracle_classification: liveClassification
      },

      destiny_alignment_matrix: {
        inner_power_score: innerPowerScore,
        public_power_score: publicPowerScore,
        today_mode: todayMode,
        ranked_gates: rankedGates,
        strongest_gate: strongestGate,
        allowed_today: allowedToday
      },

      today_spiritual_formula: practiceProtocol,

      avoid_today: avoidToday,
      food_guidance: foodGuidance,
      interpretation_seed: interpretationSeed,

      guidance_status:
        "PUBLIC MAGNETISM + BASIRAH + DIVINE CONNECTION + REMEDY CRAFT ENGINE ACTIVE.",
      next_build_step:
        "Create OpenAPI action schema for /api/spiritual-guide, then GPT instruction layer."
    });
  } catch (error) {
    return res.status(500).json({
      engine_status:
        "ROYEL_SPIRITUAL_ALIGNMENT_ENGINE_V4_PUBLIC_BASIRAH",
      system_status: "FAILED",
      error:
        error?.message ||
        "unknown spiritual alignment engine error"
    });
  }
}