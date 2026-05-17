export default async function handler(req, res) {
  try {
    const ENGINE_STATUS = "ROYEL_SPIRITUAL_ALIGNMENT_ENGINE_V5_MAX_DESTINY";

    const ROYEL = {
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
      path: "Naqshbandi Silent Depth + Public Spiritual Authority + Hybrid Sufi Discipline",
      destiny: "Inner basirah + public magnetism + remedy craft + client-reading authority",
      strictness: "HIGH"
    };

    const now = new Date();

    function q(extra = {}) {
      return new URLSearchParams({
        name: "Royel",
        dob: ROYEL.dob,
        tob: "10:59:00",
        pob: ROYEL.pob,
        birth_datetime: ROYEL.birth_datetime,
        timezone_offset: "+06:00",
        latitude: String(ROYEL.current_latitude),
        longitude: String(ROYEL.current_longitude),
        current_datetime_iso: now.toISOString(),
        ...extra
      }).toString();
    }

    const transitUrl =
      "https://live-transit-engine.vercel.app/api/transit?" + q({ mode: "raw" });

    const oracleUrl =
      "https://live-transit-engine.vercel.app/api/oracle?" +
      q({
        question:
          "Royel max spiritual destiny alignment, basirah, public attraction, dream gate, remedy craft, intuition, protection, rizq, timing"
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
    const panchanga = transitData?.panchanga || {};

    const dominantTrigger =
      transitData?.micro_dominant_trigger?.type ||
      oracleData?.micro_dominant_trigger?.type ||
      null;

    const micro = transitData?.micro_dominant_trigger || null;

    const oracleClassification =
      oracleData?.final_classification ||
      oracleData?.oracle_verdict?.final_classification ||
      oracleData?.courtroom_packet?.final_verdict_lock ||
      oracleData?.signal_reduction_result ||
      null;

    function add(s, k, v) {
      s[k] = (s[k] || 0) + v;
    }

    function has(p) {
      return !!(p?.sign || p?.nakshatra || p?.nakshatra_lord);
    }

    function phaseFromTithi(tithi) {
      const n = Number(tithi || 0);
      if (!n) return "UNKNOWN";
      if (n === 1 || n === 30) return "NEW_MOON_FIELD";
      if (n >= 13 && n <= 17) return "FULL_MOON_FIELD";
      if (n <= 7) return "GROWING_SEED_FIELD";
      if (n <= 14) return "BUILDING_FIELD";
      if (n <= 22) return "RELEASING_FIELD";
      return "DARKENING_PURIFICATION_FIELD";
    }

    function rank(obj) {
      return Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .map(([gate, score]) => ({ gate, score }));
    }

    function level(score) {
      if (score >= 14) return "DESTINY_PEAK";
      if (score >= 10) return "VERY_HIGH";
      if (score >= 7) return "HIGH";
      if (score >= 4) return "MEDIUM";
      if (score >= 2) return "LIGHT";
      return "LOW";
    }

    function status(score) {
      if (score >= 10) return "WIDE_OPEN";
      if (score >= 7) return "OPEN";
      if (score >= 4) return "BUILDING";
      if (score >= 2) return "SUPPORT";
      return "QUIET";
    }

    function parts(date, timeZone) {
      const arr = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      }).formatToParts(date);
      const out = {};
      for (const x of arr) if (x.type !== "literal") out[x.type] = x.value;
      return out;
    }

    function offsetMin(date, zone) {
      const p = parts(date, zone);
      const utc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
      return Math.round((utc - date.getTime()) / 60000);
    }

    function localToUTC(baseDate, hm, zone) {
      const p = parts(baseDate, zone);
      const [h, m] = hm.split(":").map(Number);
      const guess = new Date(Date.UTC(+p.year, +p.month - 1, +p.day, h, m));
      return new Date(guess.getTime() - offsetMin(guess, zone) * 60000);
    }

    function fmt(date, zone) {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: zone,
        weekday: "long",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      }).format(date);
    }

    function windowUK(w) {
      const [a, b] = w.split("-");
      const s = localToUTC(now, a, "Europe/London");
      const e = localToUTC(now, b, "Europe/London");
      return {
        uk_window: w,
        uk_start: fmt(s, "Europe/London"),
        uk_end: fmt(e, "Europe/London"),
        bd_start: fmt(s, "Asia/Dhaka"),
        bd_end: fmt(e, "Asia/Dhaka")
      };
    }

    const lunarPhase = phaseFromTithi(panchanga?.tithi);

    const scores = {
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
      discipline: 0,
      hidden_knowledge: 0,
      lunar_power: 0,
      spiritual_action_permission: 0
    };

    if (moon?.dignity === "exalted") {
      add(scores, "divine_connection", 4);
      add(scores, "basirah", 4);
      add(scores, "dream_vision", 3);
      add(scores, "client_reading_power", 3);
      add(scores, "emotional_control", 4);
      add(scores, "lunar_power", 5);
      add(scores, "trust_building", 2);
    }

    if (lunarPhase === "FULL_MOON_FIELD") {
      add(scores, "dream_vision", 5);
      add(scores, "lunar_power", 5);
      add(scores, "mass_attraction", 2);
      add(scores, "public_presence", 2);
    }

    if (lunarPhase === "NEW_MOON_FIELD" || lunarPhase === "DARKENING_PURIFICATION_FIELD") {
      add(scores, "protection", 5);
      add(scores, "grounding", 4);
      add(scores, "hidden_knowledge", 3);
      add(scores, "taweez_symbolic_sensitivity", 2);
    }

    if (moon?.nakshatra_lord === "Sun" || sun?.nakshatra_lord === "Sun") {
      add(scores, "public_presence", 5);
      add(scores, "spiritual_authority", 4);
      add(scores, "prediction_intuition", 3);
      add(scores, "speech_control", 2);
      add(scores, "reputation_growth", 4);
      add(scores, "spiritual_action_permission", 3);
    }

    if (dominantTrigger === "moon_mercury_conjunction") {
      add(scores, "basirah", 5);
      add(scores, "prediction_intuition", 5);
      add(scores, "client_reading_power", 6);
      add(scores, "speech_control", 5);
      add(scores, "voice_magnetism", 4);
      add(scores, "remedy_crafting", 4);
    }

    if (dominantTrigger === "moon_degree_lock") {
      add(scores, "lunar_power", 6);
      add(scores, "divine_connection", 4);
      add(scores, "mass_attraction", 3);
      add(scores, "public_presence", 3);
      add(scores, "basirah", 3);
      add(scores, "spiritual_action_permission", 5);
    }

    if (mercury?.combust) {
      add(scores, "speech_control", 5);
      add(scores, "client_reading_power", 2);
      add(scores, "remedy_crafting", 1);
      add(scores, "voice_magnetism", -1);
    }

    if (has(venus)) {
      add(scores, "mass_attraction", 4);
      add(scores, "voice_magnetism", 4);
      add(scores, "trust_building", 3);
      add(scores, "remedy_crafting", 2);
      add(scores, "public_presence", 2);
    }

    if (venus?.sign === "Gemini") {
      add(scores, "social_media_influence", 5);
      add(scores, "voice_magnetism", 4);
      add(scores, "client_reading_power", 3);
      add(scores, "mass_attraction", 3);
    }

    if (has(jupiter)) {
      add(scores, "divine_connection", 4);
      add(scores, "rizq_alignment", 5);
      add(scores, "trust_building", 5);
      add(scores, "reputation_growth", 4);
      add(scores, "public_presence", 3);
      add(scores, "spiritual_action_permission", 3);
    }

    if (jupiter?.nakshatra_lord === "Jupiter") {
      add(scores, "spiritual_authority", 4);
      add(scores, "remedy_crafting", 3);
      add(scores, "mass_attraction", 3);
    }

    if (saturn?.sign === "Pisces" || saturn?.nakshatra_lord === "Saturn") {
      add(scores, "grounding", 5);
      add(scores, "discipline", 6);
      add(scores, "spiritual_authority", 4);
      add(scores, "protection", 3);
      add(scores, "reputation_growth", 3);
    }

    if (has(rahu)) {
      add(scores, "social_media_influence", 6);
      add(scores, "mass_attraction", 5);
      add(scores, "taweez_symbolic_sensitivity", 5);
      add(scores, "protection", 5);
      add(scores, "dream_vision", 2);
    }

    if (rahu?.sign === "Aquarius") {
      add(scores, "mass_attraction", 4);
      add(scores, "social_media_influence", 5);
      add(scores, "public_presence", 3);
    }

    if (has(ketu)) {
      add(scores, "dream_vision", 4);
      add(scores, "basirah", 3);
      add(scores, "hidden_knowledge", 4);
      add(scores, "protection", 2);
    }

    if (mars?.sign === "Aries") {
      add(scores, "public_presence", 2);
      add(scores, "mass_attraction", 1);
      add(scores, "speech_control", 3);
      add(scores, "protection", 2);
    }

    const ranked = rank(scores);
    const strongest = ranked[0] || { gate: "silent_zikr", score: 0 };

    const innerPower =
      scores.divine_connection +
      scores.basirah +
      scores.dream_vision +
      scores.prediction_intuition +
      scores.remedy_crafting +
      scores.protection +
      scores.lunar_power +
      scores.hidden_knowledge;

    const publicPower =
      scores.mass_attraction +
      scores.public_presence +
      scores.voice_magnetism +
      scores.social_media_influence +
      scores.trust_building +
      scores.reputation_growth;

    const actionPower = scores.spiritual_action_permission + scores.discipline + scores.grounding;

    const todayMode =
      publicPower >= innerPower + 5
        ? "PUBLIC_MAGNETISM_DAY"
        : innerPower >= publicPower + 5
        ? "INNER_BASIRAH_DAY"
        : "INNER_POWER_PLUS_PUBLIC_CONTROL_DAY";

    const unlockLevel =
      Math.max(innerPower, publicPower, actionPower) >= 55
        ? "MAXIMUM_DAY"
        : Math.max(innerPower, publicPower, actionPower) >= 40
        ? "HIGH_UNLOCK_DAY"
        : Math.max(innerPower, publicPower, actionPower) >= 25
        ? "BUILDING_UNLOCK_DAY"
        : "MAINTENANCE_DAY";

    let practice = "silent zikr + muraqaba";
    let zikr = "Allah / Ya Latif / Ya Basir";
    let counts = { allah: 100, ya_latif: 129, ya_basir: 313, salawat: 100 };

    if (["mass_attraction", "public_presence", "social_media_influence"].includes(strongest.gate)) {
      practice = "public attraction discipline + salawat + clean presence";
      zikr = "Ya Wadud / Ya Aziz / Salawat";
      counts = { ya_wadud: 100, ya_aziz: 94, salawat: 100, ya_latif: 129 };
    }

    if (["client_reading_power", "prediction_intuition", "basirah"].includes(strongest.gate)) {
      practice = "basirah muraqaba + client-reading silence + speech control";
      zikr = "Ya Basir / Ya Latif / Allah";
      counts = { ya_basir: 313, ya_latif: 129, allah: 100, salawat: 100 };
    }

    if (strongest.gate === "dream_vision" || lunarPhase === "FULL_MOON_FIELD") {
      practice = "night muraqaba + dream journal + silent zikr";
      zikr = "Ya Nur / Ya Basir / Allah";
      counts = { ya_nur: 256, ya_basir: 313, allah: 100, salawat: 100 };
    }

    if (strongest.gate === "taweez_symbolic_sensitivity") {
      practice = "symbolic anchor + protection zikr + clean intention";
      zikr = "Hasbunallahu wa ni'mal wakeel / Ya Hafiz";
      counts = { hasbunallah: 33, ya_hafiz: 99, ayatul_kursi: 1, salawat: 33 };
    }

    if (strongest.gate === "rizq_alignment") {
      practice = "rizq cleaning + gratitude + salawat discipline";
      zikr = "Ya Fattah / Ya Razzaq";
      counts = { ya_fattah: 129, ya_razzaq: 100, salawat: 100 };
    }

    const innerWindowUK =
      dominantTrigger === "moon_mercury_conjunction"
        ? "22:20-23:40"
        : moon?.dignity === "exalted"
        ? "21:50-23:50"
        : "22:40-23:20";

    const publicWindowUK =
      scores.public_presence >= 8 || scores.social_media_influence >= 8
        ? "11:30-14:30"
        : scores.voice_magnetism >= 7
        ? "18:30-20:30"
        : "12:00-14:00";

    const dreamWindowUK =
      lunarPhase === "FULL_MOON_FIELD" || scores.dream_vision >= 7
        ? "23:30-01:20"
        : "22:50-23:30";

    const avoidWindowUK =
      scores.speech_control >= 7 || mars?.sign === "Aries"
        ? "16:00-19:00"
        : "19:30-21:00";

    const permissionGate = {
      divine_connection: status(scores.divine_connection),
      basirah: status(scores.basirah),
      dream_vision: status(scores.dream_vision),
      prediction_intuition: status(scores.prediction_intuition),
      client_reading_power: status(scores.client_reading_power),
      remedy_crafting: status(scores.remedy_crafting),
      taweez_symbolic_sensitivity: status(scores.taweez_symbolic_sensitivity),
      mass_attraction: status(scores.mass_attraction),
      public_presence: status(scores.public_presence),
      voice_magnetism: status(scores.voice_magnetism),
      social_media_influence: status(scores.social_media_influence),
      trust_building: status(scores.trust_building),
      reputation_growth: status(scores.reputation_growth),
      protection: status(scores.protection),
      lunar_power: status(scores.lunar_power),
      spiritual_action_permission: status(scores.spiritual_action_permission)
    };

    const publicAction =
      todayMode === "PUBLIC_MAGNETISM_DAY"
        ? {
            action: "Post, voice note, client-facing content, public reading",
            style: "calm authority, short words, no overclaim, one strong message",
            rule: "Inner intention first, public action second"
          }
        : todayMode === "INNER_POWER_PLUS_PUBLIC_CONTROL_DAY"
        ? {
            action: "Light public presence after inner practice",
            style: "one controlled post or one client-reading message",
            rule: "Silence charges the field before visibility"
          }
        : {
            action: "Prepare privately, no major public push",
            style: "observe, write, refine method",
            rule: "Inner battery above outer display"
          };

    const avoid = [
      mercury?.combust ? "fast reply, argument, careless speech" : null,
      scores.protection >= 5 ? "fear-based ritual chasing or over-force activation" : null,
      mars?.sign === "Aries" ? "anger reaction, ego clash, sudden decision" : null,
      lunarPhase === "DARKENING_PURIFICATION_FIELD" ? "heavy emotional decision at night" : null,
      "claiming vision as certainty without repeated confirmation",
      "mixing too many practices in one night"
    ].filter(Boolean);

    const food = {
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
        "practice after emotional argument"
      ]
    };

    const formula = {
      today_mode: todayMode,
      unlock_level: unlockLevel,
      strongest_gate: strongest,
      lunar_phase_field: lunarPhase,
      activation_level: level(strongest.score),
      practice,
      zikr,
      counts,
      inner_practice_window: windowUK(innerWindowUK),
      public_action_window: windowUK(publicWindowUK),
      dream_observation_window: windowUK(dreamWindowUK),
      avoid_window: windowUK(avoidWindowUK),
      duration: "20-40 minutes. Do not force trance. Stop if agitation increases.",
      before_practice: "Wash hands/face, reduce phone/light, sit still, make silent intention.",
      public_action_protocol: publicAction,
      dream_protocol:
        "After practice write date, dream fragments, names, colours, symbols, first waking emotion.",
      remedy_crafting_rule:
        "Create remedy only after calm repetition and repeated signal. No fear-based taweez.",
      symbolic_anchor:
        permissionGate.taweez_symbolic_sensitivity === "OPEN" ||
        permissionGate.taweez_symbolic_sensitivity === "WIDE_OPEN"
          ? "Clean white paper, one intention word, folded near practice place. No overuse."
          : "No strong symbol today; use silent zikr.",
      safety_lock:
        "No guaranteed vision claim. Treat signs as training unless repeated, calm, useful and grounded."
    };

    const interpretation = {
      destiny_meaning:
        "This engine aligns Royel’s inner silence with public spiritual influence. The aim is not hidden isolation only; it is disciplined basirah expressed with clean authority.",
      today_meaning:
        todayMode === "PUBLIC_MAGNETISM_DAY"
          ? "Today supports public pull, voice presence and attraction, but speech must stay clean."
          : todayMode === "INNER_BASIRAH_DAY"
          ? "Today supports inner seeing, dream signal, basirah and remedy design more than public push."
          : "Today supports both inner spiritual sharpening and controlled public presence.",
      expected_internal_effect:
        "calmer mind, sharper observation, reduced scattered speech, stronger symbolic sensitivity.",
      expected_external_effect:
        "better client reading tone, stronger public presence, cleaner timing sense, controlled influence.",
      warning:
        "Do not chase signs. Verify through calmness, accuracy, usefulness and repetition."
    };

    return res.status(200).json({
      engine_status: ENGINE_STATUS,
      system_status: "OK",
      mode: "ROYEL_ONLY_MAX_DESTINY_ALIGNMENT",
      subject_lock: ROYEL,
      current_time_utc: now.toISOString(),

      backend_integration: {
        transit_loaded: !!transitData?.moon,
        oracle_loaded: !!oracleData,
        transit_engine_status: transitData?.engine_status || null,
        oracle_engine_status: oracleData?.engine_status || null
      },

      live_sky_extract: {
        weekday: panchanga?.weekday || null,
        tithi: panchanga?.tithi || null,
        lunar_phase_field: lunarPhase,
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
        micro_dominant_trigger: micro,
        oracle_classification: oracleClassification
      },

      max_destiny_matrix: {
        inner_power_score: innerPower,
        public_power_score: publicPower,
        action_power_score: actionPower,
        today_mode: todayMode,
        unlock_level: unlockLevel,
        ranked_gates: ranked,
        permission_gate: permissionGate
      },

      today_spiritual_formula: formula,
      avoid_today: avoid,
      food_guidance: food,
      interpretation_seed: interpretation,

      guidance_status:
        "MAX DESTINY BACKEND ACTIVE: lunar phase, public magnetism, basirah, dream, remedy craft, protection, timing and spiritual action permission integrated.",
      next_build_step:
        "Test JSON, then update OpenAPI schema if needed and create final GPT instruction layer."
    });
  } catch (error) {
    return res.status(500).json({
      engine_status: "ROYEL_SPIRITUAL_ALIGNMENT_ENGINE_V5_MAX_DESTINY",
      system_status: "FAILED",
      error: error?.message || "unknown max destiny spiritual engine error"
    });
  }
}