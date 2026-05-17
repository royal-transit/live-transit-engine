export default async function handler(req, res) {
  try {
    const ENGINE_STATUS = "ROYEL_SPIRITUAL_ALIGNMENT_ENGINE_V10_FULL_FINAL";

    const PROFILE = {
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
      destiny_path:
        "Inner silence + basirah + public magnetism + spiritual authority + remedy intelligence + client-reading power",
      core_frequency:
        "Ya Latif + Ya Basir + Ya Wadud + Salawat"
    };

    const now = new Date();

    function qs(extra = {}) {
      return new URLSearchParams({
        name: "Royel",
        dob: PROFILE.dob,
        tob: "10:59:00",
        pob: PROFILE.pob,
        birth_datetime: PROFILE.birth_datetime,
        timezone_offset: "+06:00",
        latitude: String(PROFILE.current_latitude),
        longitude: String(PROFILE.current_longitude),
        current_datetime_iso: now.toISOString(),
        ...extra
      }).toString();
    }

    const transitURL =
      "https://live-transit-engine.vercel.app/api/transit?" +
      qs({ mode: "raw" });

    const oracleURL =
      "https://live-transit-engine.vercel.app/api/oracle?" +
      qs({
        question:
          "Royel full final spiritual destiny alignment, basirah, public magnetism, dream, remedy, lunar, food, material, namaz, timing, validation"
      });

    const transitData = await (await fetch(transitURL)).json();
    const oracleData = await (await fetch(oracleURL)).json();

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

    function add(obj, key, value) {
      obj[key] = (obj[key] || 0) + value;
    }

    function rank(obj) {
      return Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .map(([gate, score]) => ({ gate, score }));
    }

    function level(score) {
      if (score >= 18) return "DESTINY_PEAK";
      if (score >= 14) return "VERY_HIGH";
      if (score >= 10) return "HIGH";
      if (score >= 6) return "MEDIUM";
      if (score >= 3) return "LIGHT";
      return "LOW";
    }

    function permission(score) {
      if (score >= 14) return "WIDE_OPEN";
      if (score >= 10) return "OPEN";
      if (score >= 6) return "BUILDING";
      if (score >= 3) return "SUPPORT";
      return "QUIET";
    }

    function phaseFromTithi(tithi) {
      const n = Number(tithi || 0);
      if (!n) return "UNKNOWN";
      if (n === 1 || n === 30) return "NEW_MOON_FIELD";
      if (n >= 13 && n <= 17) return "FULL_MOON_FIELD";
      if (n <= 7) return "GROWING_SEED_FIELD";
      if (n <= 14) return "BUILDING_FIELD";
      if (n <= 22) return "RELEASING_FIELD";
      return "DARK_PURIFICATION_FIELD";
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

    const lunarField = phaseFromTithi(panchanga?.tithi);

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
      namaz_enhancement: 0,
      tahajjud_gate: 0,
      food_alignment: 0,
      material_alignment: 0,
      planetary_hour_need: 0,
      field_resonance: 0,
      sacred_space: 0,
      overload_risk: 0,
      validation_need: 0,
      practice_memory_need: 0
    };

    if (moon?.dignity === "exalted") {
      add(scores, "divine_connection", 4);
      add(scores, "basirah", 5);
      add(scores, "dream_vision", 3);
      add(scores, "client_reading_power", 3);
      add(scores, "emotional_control", 4);
      add(scores, "lunar_power", 6);
      add(scores, "food_alignment", 2);
    }

    if (lunarField === "NEW_MOON_FIELD") {
      add(scores, "protection", 6);
      add(scores, "grounding", 5);
      add(scores, "hidden_knowledge", 4);
      add(scores, "taweez_symbolic_sensitivity", 3);
      add(scores, "sacred_space", 4);
    }

    if (lunarField === "FULL_MOON_FIELD") {
      add(scores, "dream_vision", 6);
      add(scores, "lunar_power", 6);
      add(scores, "tahajjud_gate", 5);
      add(scores, "mass_attraction", 3);
      add(scores, "public_presence", 3);
    }

    if (moon?.nakshatra_lord === "Sun" || sun?.nakshatra_lord === "Sun") {
      add(scores, "public_presence", 5);
      add(scores, "spiritual_authority", 5);
      add(scores, "prediction_intuition", 3);
      add(scores, "speech_control", 2);
      add(scores, "reputation_growth", 4);
    }

    if (dominantTrigger === "moon_mercury_conjunction") {
      add(scores, "basirah", 6);
      add(scores, "prediction_intuition", 6);
      add(scores, "client_reading_power", 6);
      add(scores, "speech_control", 5);
      add(scores, "voice_magnetism", 4);
      add(scores, "remedy_crafting", 4);
    }

    if (dominantTrigger === "moon_degree_lock") {
      add(scores, "lunar_power", 7);
      add(scores, "divine_connection", 4);
      add(scores, "mass_attraction", 4);
      add(scores, "public_presence", 4);
      add(scores, "basirah", 4);
    }

    if (mercury?.combust) {
      add(scores, "speech_control", 6);
      add(scores, "overload_risk", 3);
      add(scores, "validation_need", 2);
    }

    if (venus?.sign === "Gemini") {
      add(scores, "social_media_influence", 6);
      add(scores, "voice_magnetism", 5);
      add(scores, "client_reading_power", 3);
      add(scores, "mass_attraction", 5);
      add(scores, "public_presence", 2);
    }

    if (jupiter?.nakshatra_lord === "Jupiter") {
      add(scores, "divine_connection", 4);
      add(scores, "rizq_alignment", 6);
      add(scores, "trust_building", 5);
      add(scores, "reputation_growth", 5);
      add(scores, "remedy_crafting", 4);
      add(scores, "spiritual_authority", 4);
    }

    if (saturn?.nakshatra_lord === "Saturn" || saturn?.sign === "Pisces") {
      add(scores, "grounding", 6);
      add(scores, "discipline", 7);
      add(scores, "protection", 4);
      add(scores, "spiritual_authority", 4);
      add(scores, "practice_memory_need", 3);
    }

    if (rahu?.sign === "Aquarius") {
      add(scores, "social_media_influence", 7);
      add(scores, "mass_attraction", 6);
      add(scores, "taweez_symbolic_sensitivity", 5);
      add(scores, "protection", 5);
      add(scores, "field_resonance", 4);
    }

    if (ketu?.nakshatra_lord === "Ketu") {
      add(scores, "dream_vision", 4);
      add(scores, "basirah", 3);
      add(scores, "hidden_knowledge", 5);
      add(scores, "sacred_space", 3);
    }

    if (mars?.sign === "Aries") {
      add(scores, "public_presence", 2);
      add(scores, "speech_control", 3);
      add(scores, "protection", 2);
      add(scores, "overload_risk", 3);
    }

    const rankedGates = rank(scores);
    const strongestGate = rankedGates[0] || { gate: "basirah", score: 0 };

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

    const disciplinePower =
      scores.grounding +
      scores.discipline +
      scores.speech_control +
      scores.protection;

    const todayMode =
      publicPower >= innerPower + 6
        ? "PUBLIC_MAGNETISM_DAY"
        : innerPower >= publicPower + 6
        ? "INNER_BASIRAH_DAY"
        : "INNER_POWER_PLUS_PUBLIC_CONTROL_DAY";

    const unlockLevel =
      Math.max(innerPower, publicPower, disciplinePower) >= 70
        ? "DESTINY_PEAK"
        : Math.max(innerPower, publicPower, disciplinePower) >= 55
        ? "MAXIMUM_DAY"
        : Math.max(innerPower, publicPower, disciplinePower) >= 40
        ? "HIGH_UNLOCK_DAY"
        : Math.max(innerPower, publicPower, disciplinePower) >= 25
        ? "BUILDING_UNLOCK_DAY"
        : "MAINTENANCE_DAY";

    let zikr = "Ya Latif / Ya Basir / Salawat";
    let pronunciation = {
      ya_latif: "ইয়া লা-তীফ",
      ya_basir: "ইয়া বা-সীর",
      salawat: "দরুদ শরীফ / সালাওয়াত"
    };
    let counts = { ya_latif: 129, ya_basir: 313, salawat: 100 };
    let mainPractice = "silent zikr + basirah muraqaba";

    if (
      ["mass_attraction", "public_presence", "social_media_influence"].includes(
        strongestGate.gate
      )
    ) {
      mainPractice = "public attraction discipline + salawat + clean presence";
      zikr = "Ya Wadud / Ya Aziz / Salawat";
      pronunciation = {
        ya_wadud: "ইয়া ওয়া-দুদ",
        ya_aziz: "ইয়া আ-জীজ",
        salawat: "দরুদ শরীফ / সালাওয়াত"
      };
      counts = { ya_wadud: 100, ya_aziz: 94, salawat: 100, ya_latif: 129 };
    }

    if (strongestGate.gate === "protection") {
      mainPractice = "protection zikr + grounding + clean silence";
      zikr = "Hasbunallahu wa ni'mal wakeel / Ya Hafiz";
      pronunciation = {
        hasbunallah: "হাসবুনাল্লাহু ওয়া নি‘মাল ওয়াকীল",
        ya_hafiz: "ইয়া হা-ফীজ"
      };
      counts = { hasbunallah: 33, ya_hafiz: 99, ayatul_kursi: 1 };
    }

    if (strongestGate.gate === "dream_vision") {
      mainPractice = "night muraqaba + dream journal + silent zikr";
      zikr = "Ya Nur / Ya Basir / Allah";
      pronunciation = {
        ya_nur: "ইয়া নূর",
        ya_basir: "ইয়া বা-সীর",
        allah: "আল্লাহ"
      };
      counts = { ya_nur: 256, ya_basir: 313, allah: 100, salawat: 100 };
    }

    const innerWindowUK =
      dominantTrigger === "moon_mercury_conjunction"
        ? "22:20-23:40"
        : moon?.dignity === "exalted"
        ? "21:50-23:50"
        : "22:40-23:20";

    const publicWindowUK =
      scores.social_media_influence >= 8 || scores.public_presence >= 8
        ? "11:30-14:30"
        : scores.voice_magnetism >= 7
        ? "18:30-20:30"
        : "12:00-14:00";

    const tahajjudWindowUK =
      scores.tahajjud_gate >= 5 || scores.dream_vision >= 8
        ? "02:45-04:15"
        : "03:00-04:00";

    const dreamWindowUK =
      scores.dream_vision >= 7 ? "23:30-01:20" : "22:50-23:30";

    const avoidWindowUK =
      scores.speech_control >= 7 || scores.overload_risk >= 4
        ? "16:00-19:00"
        : "19:30-21:00";

    const permissionGate = {};
    for (const [k, v] of Object.entries(scores)) permissionGate[k] = permission(v);

    const foodMaterialEngine = {
      recommended_food: [
        "light warm food",
        "simple clean water",
        "milk/honey softness if suitable",
        "avoid heavy stomach before practice"
      ],
      avoid_food: [
        "excess caffeine",
        "heavy late-night spicy food",
        "overeating",
        "practice immediately after emotional argument"
      ],
      material_support:
        permissionGate.taweez_symbolic_sensitivity === "OPEN" ||
        permissionGate.taweez_symbolic_sensitivity === "WIDE_OPEN"
          ? {
              allowed: true,
              material: "clean white paper",
              method: "one intention word only, folded near practice place",
              duration: "1 night or 3 nights maximum",
              disposal: "burn safely or place respectfully away; do not obsess"
            }
          : {
              allowed: false,
              method: "silent zikr only; no object anchor today"
            },
      colour_field:
        todayMode === "PUBLIC_MAGNETISM_DAY"
          ? "clean white / soft green / simple dark formal"
          : "white / light neutral / low visual noise",
      scent_space:
        scores.sacred_space >= 4
          ? "clean room, low light, mild scent if suitable"
          : "simple clean air"
    };

    const namazEngine = {
      enhancement:
        lunarField === "FULL_MOON_FIELD"
          ? "Tahajjud + long sujood + dream journal"
          : lunarField === "NEW_MOON_FIELD"
          ? "Post-Isha silence + protection dua + grounding"
          : "Post-Isha muraqaba",
      nafl_suggestion:
        scores.divine_connection >= 8
          ? "2 rakaat nafl before main zikr if energy allows"
          : "Keep farz steady; add short silent sitting only",
      tahajjud_window: windowUK(tahajjudWindowUK),
      rule: "No force. If tired, choose short sincere practice over long unstable practice."
    };

    const dreamVisionEngine = {
      status: permissionGate.dream_vision,
      dream_window: windowUK(dreamWindowUK),
      protocol:
        "Before sleep: short zikr, ask for clarity without force. After waking: write dream fragments, names, colours, symbols, first emotion.",
      validation:
        "A signal is not final truth unless it repeats, stays calm, and proves useful in real life."
    };

    const publicEngine = {
      status: todayMode,
      public_window: windowUK(publicWindowUK),
      action:
        todayMode === "PUBLIC_MAGNETISM_DAY"
          ? "post / voice note / client-facing guidance / authority message"
          : todayMode === "INNER_POWER_PLUS_PUBLIC_CONTROL_DAY"
          ? "one controlled public action after inner practice"
          : "prepare privately; no major public push",
      style:
        "short, calm, confident, no overclaim, one clean message",
      warning:
        "Ego heat, fast reply and over-explanation weaken the field."
    };

    const memoryValidationEngine = {
      practice_memory_fields: [
        "date",
        "practice",
        "count",
        "time",
        "feeling_before",
        "feeling_after",
        "dream",
        "public_response",
        "accuracy_result"
      ],
      validation_rule:
        "Track what happened after each practice. Repeat what works. Reduce what overloads.",
      accuracy_rule:
        "Prediction quality grows through observation, verification and humility."
    };

    const formula = {
      today_mode: todayMode,
      unlock_level: unlockLevel,
      strongest_gate: strongestGate,
      lunar_phase_field: lunarField,
      activation_level: level(strongestGate.score),
      main_practice: mainPractice,
      zikr,
      bengali_pronunciation: pronunciation,
      counts,
      inner_practice_window: windowUK(innerWindowUK),
      public_action_window: windowUK(publicWindowUK),
      tahajjud_window: windowUK(tahajjudWindowUK),
      dream_observation_window: windowUK(dreamWindowUK),
      avoid_window: windowUK(avoidWindowUK),
      duration: "20-40 minutes. Stop if agitation increases.",
      expected_internal_effect:
        "calmer mind, sharper observation, cleaner speech, stronger symbolic sensitivity.",
      expected_external_effect:
        "better public presence, cleaner client reading tone, stronger trust response.",
      destroys_effect:
        "anger, overclaim, fear-based ritual chasing, too many practices, careless speech."
    };

    return res.status(200).json({
      engine_status: ENGINE_STATUS,
      system_status: "OK",
      mode: "ROYEL_ONLY_V10_FULL_FINAL_DESTINY_ALIGNMENT",
      subject_lock: PROFILE,
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
        lunar_phase_field: lunarField,
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
        micro_dominant_trigger: transitData?.micro_dominant_trigger || null
      },

      max_destiny_matrix: {
        inner_power_score: innerPower,
        public_power_score: publicPower,
        discipline_power_score: disciplinePower,
        today_mode: todayMode,
        unlock_level: unlockLevel,
        ranked_gates: rankedGates,
        permission_gate: permissionGate
      },

      today_spiritual_formula: formula,
      food_material_engine: foodMaterialEngine,
      namaz_engine: namazEngine,
      dream_vision_engine: dreamVisionEngine,
      public_influence_engine: publicEngine,
      memory_validation_engine: memoryValidationEngine,

      safety_lock: {
        no_guaranteed_vision_claim: true,
        no_fear_based_occultism: true,
        no_forced_activation: true,
        no_superiority_claim: true,
        no_sleep_damage: true,
        no_random_ritual_mixing: true
      },

      destiny_unlock_direction: {
        core:
          "inner silence + public influence + basirah + clean speech + validation",
        strongest_path:
          "recognisable spiritual guidance with public magnetic authority",
        final_rule:
          "Silence charges the field. Clean speech protects it. Public action expresses it. Validation stabilises it."
      },

      guidance_status:
        "V10 FULL FINAL BACKEND ACTIVE: basirah, public magnetism, lunar phase, namaz, food, material, dream, remedy, memory and validation integrated."
    });
  } catch (error) {
    return res.status(500).json({
      engine_status: "ROYEL_SPIRITUAL_ALIGNMENT_ENGINE_V10_FULL_FINAL",
      system_status: "FAILED",
      error: error?.message || "unknown V10 spiritual engine error"
    });
  }
}