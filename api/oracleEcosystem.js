// /api/oracleEcosystem.js
// FULL REPLACEMENT
// ELITE DETERMINISTIC ORACLE ECOSYSTEM V2 FINAL

const VERSION = "DETERMINISTIC_ORACLE_ECOSYSTEM_V2_ELITE_FINAL";

const n = (v, fb = 0) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : fb;
};

const s = (v) => String(v || "").trim();

const low = (v) => s(v).toLowerCase();

const arr = (v) => (Array.isArray(v) ? v : []);

const obj = (v) =>
  v && typeof v === "object" && !Array.isArray(v) ? v : {};

const hasTrigger = (timing) =>
  obj(timing).trigger_present === true;

const isActiveDasha = (d) =>
  obj(d).status === "active";

const isActiveDivisional = (d) =>
  obj(d).status === "active";

function confidenceBand(score) {
  if (score >= 80) return "A_PLUS_ELITE";
  if (score >= 70) return "A_STRONG";
  if (score >= 60) return "B_MODERATE";
  if (score >= 45) return "C_RESTRICTED";
  return "D_LOW";
}

function detectClientMode(clientMode = {}) {
  const precision = s(clientMode.precision_mode);
  const subject = s(clientMode.subject_mode);

  if (
    precision.includes("FULL") ||
    subject.includes("FULL")
  ) {
    return "FULL_BIRTH";
  }

  if (
    precision.includes("NAME") ||
    subject.includes("NAME")
  ) {
    return "NAME_ONLY";
  }

  return "UNIVERSAL";
}

function getQuestionDomain(question = "") {
  const q = low(question);

  if (
    /money|payment|cash|income|profit|business|deal|order|customer|rizq|টাকা|পেমেন্ট|ব্যবসা|রিজিক/.test(
      q
    )
  )
    return "money";

  if (
    /message|reply|call|contact|document|paper|email|form|communication|মেসেজ|ফোন|ডকুমেন্ট|কাগজ/.test(
      q
    )
  )
    return "communication";

  if (
    /love|wife|husband|relationship|marriage|partner|break|divorce|সম্পর্ক|বিয়ে|স্ত্রী|স্বামী/.test(
      q
    )
  )
    return "relationship";

  if (
    /job|career|work|interview|employment|boss|জব|কাজ|ইন্টারভিউ/.test(
      q
    )
  )
    return "work";

  if (
    /visa|immigration|legal|court|authority|home office|appeal|ভিসা|কোর্ট|আইন/.test(
      q
    )
  )
    return "authority";

  if (
    /car|vehicle|travel|delivery|move|relocation|lost|গাড়ি|ডেলিভারি|যাত্রা|হারানো/.test(
      q
    )
  )
    return "movement";

  if (
    /health|hospital|stress|mind|fear|anxiety|illness|শরীর|হাসপাতাল|মন|ভয়/.test(
      q
    )
  )
    return "health";

  if (
    /spiritual|dua|ritual|remedy|nazar|jinn|রুহানি|দোয়া|নজর|আমল/.test(
      q
    )
  )
    return "spiritual";

  return "general";
}

function aspectFlags(aspects = []) {
  const list = arr(aspects);

  const has = (a, b, type = null) =>
    list.some((x) => {
      const pair =
        (x.planet1 === a && x.planet2 === b) ||
        (x.planet1 === b && x.planet2 === a);

      return pair && (!type || x.type === type);
    });

  return {
    moon_mars_square: has("Moon", "Mars", "square"),
    moon_jupiter_opposition: has(
      "Moon",
      "Jupiter",
      "opposition"
    ),
    mercury_rahu: has("Mercury", "Rahu"),
    mercury_ketu: has("Mercury", "Ketu"),
    mars_jupiter_square: has(
      "Mars",
      "Jupiter",
      "square"
    ),
    sun_jupiter: has("Sun", "Jupiter"),
    rahu_ketu: has(
      "Rahu",
      "Ketu",
      "opposition"
    )
  };
}

function buildDomainMatrix({
  questionDomain,
  aspects,
  kpCusps,
  timing
}) {
  const scores = {
    communication: 0,
    money: 0,
    business: 0,
    conflict: 0,
    protection: 0,
    movement: 0,
    relationship: 0,
    work: 0,
    authority: 0,
    spiritual: 0,
    health: 0,
    general: 0
  };

  const why = {};

  const add = (domain, weight, reason) => {
    scores[domain] += weight;

    if (!why[domain]) why[domain] = [];

    why[domain].push(reason);
  };

  const a = aspectFlags(aspects);

  if (a.mercury_rahu) {
    add(
      "communication",
      4,
      "Mercury-Rahu communication signal"
    );

    add(
      "money",
      2,
      "Mercury-Rahu payment signal"
    );

    add(
      "business",
      2,
      "Mercury-Rahu deal route"
    );

    add(
      "protection",
      2,
      "Rahu distortion signal"
    );
  }

  if (a.mercury_ketu) {
    add(
      "communication",
      2,
      "Mercury-Ketu hidden signal"
    );

    add(
      "spiritual",
      2,
      "Ketu subtle correction"
    );

    add(
      "protection",
      1,
      "Ketu cut-off signal"
    );
  }

  if (a.moon_mars_square) {
    add(
      "conflict",
      5,
      "Moon-Mars pressure"
    );

    add(
      "movement",
      2,
      "Moon-Mars movement"
    );

    add(
      "health",
      2,
      "Moon-Mars stress"
    );

    add(
      "protection",
      3,
      "Mars protection pressure"
    );
  }

  if (a.moon_jupiter_opposition) {
    add(
      "relationship",
      2,
      "Moon-Jupiter emotional expansion"
    );

    add(
      "money",
      1,
      "Jupiter support echo"
    );

    add(
      "spiritual",
      1,
      "Jupiter spiritual echo"
    );
  }

  if (a.mars_jupiter_square) {
    add(
      "business",
      2,
      "Mars-Jupiter business tension"
    );

    add(
      "conflict",
      2,
      "Mars-Jupiter friction"
    );
  }

  if (a.sun_jupiter) {
    add(
      "authority",
      2,
      "Sun-Jupiter authority"
    );

    add(
      "work",
      1,
      "Sun-Jupiter work signal"
    );
  }

  if (a.rahu_ketu) {
    add(
      "spiritual",
      2,
      "Node karmic field"
    );

    add(
      "protection",
      2,
      "Node protection axis"
    );
  }

  const kp = obj(kpCusps);

  if (kp["3"])
    add(
      "communication",
      2,
      "KP 3rd cusp"
    );

  if (kp["2"])
    add(
      "money",
      1,
      "KP 2nd cusp"
    );

  if (kp["10"]) {
    add(
      "work",
      1,
      "KP 10th cusp"
    );

    add(
      "authority",
      1,
      "KP authority support"
    );
  }

  if (kp["11"])
    add(
      "money",
      1,
      "KP gain support"
    );

  if (kp["5"])
    add(
      "relationship",
      1,
      "KP romance support"
    );

  if (kp["7"])
    add(
      "relationship",
      2,
      "KP partner support"
    );

  if (kp["6"])
    add(
      "conflict",
      1,
      "KP dispute pressure"
    );

  if (kp["8"])
    add(
      "protection",
      1,
      "KP hidden-risk"
    );

  if (kp["9"] || kp["12"])
    add(
      "spiritual",
      1,
      "KP spiritual support"
    );

  if (questionDomain !== "general") {
    add(
      questionDomain,
      3,
      "Question intent boost"
    );
  }

  if (hasTrigger(timing)) {
    const t = low(
      timing.dominant_trigger_identity
    );

    if (t.includes("moon")) {
      add(
        "movement",
        2,
        "Moon trigger"
      );

      add(
        "relationship",
        1,
        "Moon emotional field"
      );
    }

    if (t.includes("mercury")) {
      add(
        "communication",
        3,
        "Mercury trigger"
      );
    }

    if (t.includes("mars")) {
      add(
        "conflict",
        3,
        "Mars trigger"
      );
    }

    if (t.includes("rahu")) {
      add(
        "protection",
        2,
        "Rahu trigger"
      );
    }
  }

  const ranked = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([domain, score]) => ({
      domain,
      score,
      reasons: why[domain] || []
    }));

  return {
    dominant_domain:
      ranked[0]?.domain || "general",

    secondary_domain:
      ranked[1]?.domain || null,

    ranked_domains: ranked,

    domain_lock_status:
      ranked[0]?.score >= 7
        ? "STRONG_DOMAIN_LOCK"
        : "SOFT_DOMAIN_LOCK"
  };
}

function buildVerdict({
  timing,
  predictive,
  domainMatrix,
  gates
}) {
  if (
    hasTrigger(timing) &&
    timing.exact_time_candidate_utc
  ) {
    return {
      outcome: "EXACT",
      event_state: "ACTIVE_TRIGGER",
      best_actionable_time_utc:
        timing.exact_time_candidate_utc,
      best_actionable_mode:
        "PRESENT_TRIGGER",
      dominant_domain:
        domainMatrix.dominant_domain,
      secondary_domain:
        domainMatrix.secondary_domain,
      precision_ceiling:
        gates.precision_gate
    };
  }

  if (
    predictive?.best_future_candidate
      ?.predicted_time_utc
  ) {
    return {
      outcome: "PREDICTIVE",
      event_state: "FUTURE_TRIGGER",
      best_actionable_time_utc:
        predictive.best_future_candidate
          .predicted_time_utc,
      best_actionable_mode:
        "PREDICTIVE",
      dominant_domain:
        domainMatrix.dominant_domain,
      secondary_domain:
        domainMatrix.secondary_domain,
      precision_ceiling:
        gates.precision_gate
    };
  }

  return {
    outcome: "WINDOW",
    event_state: "LOW_ACTIVITY",
    best_actionable_time_utc: null,
    best_actionable_mode:
      "WAIT_OR_GENERAL_WINDOW",
    dominant_domain:
      domainMatrix.dominant_domain,
    secondary_domain:
      domainMatrix.secondary_domain,
    precision_ceiling:
      gates.precision_gate
  };
}

export function buildDeterministicOracleEcosystem(
  input = {}
) {
  const clientMode = obj(
    input.clientMode ||
      input.client_mode
  );

  const predictivePacket = obj(
    input.predictivePacket ||
      input.transit ||
      input
  );

  const mode =
    detectClientMode(clientMode);

  const question =
    clientMode?.input_context
      ?.question || "";

  const questionDomain =
    getQuestionDomain(question);

  const timing = obj(
    predictivePacket.timing_evidence || {
      trigger_present: false,
      dominant_trigger_identity:
        null,
      exact_time_candidate_utc:
        null,
      convergence_strength:
        "low"
    }
  );

  const confidenceScore = n(
    predictivePacket?.confidence
      ?.confidence_score,
    hasTrigger(timing) ? 70 : 45
  );

  const domainMatrix =
    buildDomainMatrix({
      questionDomain,
      aspects:
        predictivePacket.aspects_summary ||
        predictivePacket.aspects ||
        [],
      kpCusps:
        predictivePacket.kp_cusps ||
        {},
      timing
    });

  const dasha =
    predictivePacket.dasha || {};

  const divisional =
    predictivePacket.divisional ||
    {};

  const dashaActive =
    mode === "FULL_BIRTH" &&
    isActiveDasha(dasha);

  const divisionalActive =
    mode === "FULL_BIRTH" &&
    isActiveDivisional(divisional);

  let precision_gate =
    "UNIVERSAL_RESTRICTED_WINDOW";

  if (
    mode === "FULL_BIRTH" &&
    hasTrigger(timing) &&
    dashaActive &&
    divisionalActive
  ) {
    precision_gate =
      "EXACT_MINUTE_ALLOWED";
  } else if (
    mode === "FULL_BIRTH" &&
    hasTrigger(timing)
  ) {
    precision_gate =
      "EXACT_HOUR_ALLOWED";
  } else if (
    mode === "NAME_ONLY"
  ) {
    precision_gate =
      "NAME_ONLY_RESTRICTED_WINDOW";
  }

  const legal_gates = {
    promise_gate:
      mode === "FULL_BIRTH"
        ? "NATAL_PROMISE_CHECK_AVAILABLE"
        : "NATAL_PROMISE_NOT_AVAILABLE",

    precision_gate,

    confidence_band:
      confidenceBand(
        confidenceScore
      ),

    dasha_precision_status:
      dashaActive
        ? "DASHA_ACTIVE"
        : "DASHA_ABSENT_OR_CLOSED",

    divisional_status:
      divisionalActive
        ? "DIVISIONAL_ACTIVE"
        : "DIVISIONAL_ABSENT_OR_WEAK",

    micro_trigger_status:
      hasTrigger(timing)
        ? "ACTIVE"
        : "ZERO_OR_INACTIVE"
  };

  let total_score = 0;

  total_score +=
    domainMatrix
      .domain_lock_status ===
    "STRONG_DOMAIN_LOCK"
      ? 8
      : 5;

  total_score +=
    mode === "FULL_BIRTH"
      ? 8
      : 0;

  total_score +=
    dashaActive ? 8 : 0;

  total_score +=
    divisionalActive
      ? 8
      : 0;

  total_score += hasTrigger(
    timing
  )
    ? 10
    : 3;

  total_score +=
    domainMatrix
      .domain_lock_status ===
    "STRONG_DOMAIN_LOCK"
      ? 8
      : 4;

  total_score -= 2;
  total_score -= 2;

  if (mode === "UNIVERSAL") {
    total_score = Math.min(
      total_score,
      hasTrigger(timing)
        ? 34
        : 26
    );
  }

  if (mode === "NAME_ONLY") {
    total_score = Math.min(
      total_score,
      hasTrigger(timing)
        ? 38
        : 30
    );
  }

  let elite_convergence_class =
    "C_RESTRICTED";

  if (total_score >= 55) {
    elite_convergence_class =
      "A_PLUS_ELITE_DETERMINISTIC";
  } else if (
    total_score >= 45
  ) {
    elite_convergence_class =
      "A_STRONG";
  } else if (
    total_score >= 34
  ) {
    elite_convergence_class =
      "B_MODERATE";
  }

  const predictive =
    obj(
      predictivePacket.predictive_smart_mode
    );

  const verdict =
    buildVerdict({
      timing,
      predictive,
      domainMatrix,
      gates: legal_gates
    });

  return {
    engine_status: VERSION,

    system_status: "OK",

    oracle_mode:
      "ELITE_DETERMINISTIC_ORACLE_ECOSYSTEM",

    subject_mode_detected:
      mode,

    raw_evidence: {
      authority:
        predictivePacket.authority ||
        null,

      freshness:
        predictivePacket.freshness ||
        null,

      integrity:
        predictivePacket.integrity ||
        null,

      location_used:
        predictivePacket.location_used ||
        null,

      panchanga:
        predictivePacket.panchanga ||
        null,

      planets:
        predictivePacket.planets ||
        null,

      aspects_summary:
        predictivePacket.aspects_summary ||
        [],

      kp_cusps:
        predictivePacket.kp_cusps ||
        null,

      dasha,

      divisional
    },

    timing_evidence: timing,

    domain_matrix:
      domainMatrix,

    legal_gates,

    elite_scoring_matrix: {
      total_score,

      elite_convergence_class,

      natal_promise_density:
        mode === "FULL_BIRTH"
          ? 8
          : 0,

      dasha_fructification:
        dashaActive ? 8 : 0,

      divisional_confirmation:
        divisionalActive
          ? 8
          : 0,

      score_ceiling_applied:
        mode === "UNIVERSAL"
          ? "UNIVERSAL_CEILING"
          : mode ===
            "NAME_ONLY"
          ? "NAME_ONLY_CEILING"
          : "FULL_BIRTH_NO_CEILING"
    },

    oracle_verdict: verdict,

    courtroom_packet: {
      query_intent_class:
        "LIVE_ORACLE_EVENT_FIELD_SCAN",

      subject_mode_detected:
        mode,

      dominant_executable_event:
        domainMatrix.dominant_domain,

      non_executable_residue:
        domainMatrix.secondary_domain,

      legal_gates,

      final_verdict_lock: {
        signal_reduction_result:
          verdict.outcome,

        winning_signal_class:
          verdict.event_state,

        final_freeze_state:
          "LOCKED_FOR_THIS_PACKET"
      }
    },

    passthrough:
      predictivePacket
  };
}