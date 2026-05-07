// /api/oracleEcosystem.js
// ELITE DETERMINISTIC ORACLE ECOSYSTEM V1
// Brain layer for live oracle: raw evidence -> gates -> domain -> verdict -> remedy support

const VERSION = "DETERMINISTIC_ORACLE_ECOSYSTEM_V1_ELITE_FULL";

function n(v, fb = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fb;
}

function s(v) {
  return String(v || "").trim();
}

function low(v) {
  return s(v).toLowerCase();
}

function arr(v) {
  return Array.isArray(v) ? v : [];
}

function obj(v) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}

function isActiveDasha(dasha) {
  return obj(dasha).status === "active";
}

function isActiveDivisional(divisional) {
  return obj(divisional).status === "active";
}

function hasTrigger(timing) {
  return obj(timing).trigger_present === true;
}

function confidenceBand(score) {
  if (score >= 80) return "A_PLUS_ELITE";
  if (score >= 70) return "A_STRONG";
  if (score >= 60) return "B_MODERATE";
  if (score >= 45) return "C_RESTRICTED";
  return "D_LOW";
}

function detectClientMode(clientMode = {}) {
  const p = s(clientMode.precision_mode);
  if (p.includes("FULL")) return "FULL_BIRTH";
  if (p.includes("NAME")) return "NAME_ONLY";
  return "UNIVERSAL";
}

function getQuestionDomain(question = "") {
  const q = low(question);

  if (/money|payment|cash|income|profit|business|deal|order|customer|rizq|টাকা|পেমেন্ট|ব্যবসা|রিজিক/.test(q)) return "money";
  if (/message|reply|call|contact|document|paper|email|form|communication|মেসেজ|ফোন|ডকুমেন্ট|কাগজ/.test(q)) return "communication";
  if (/love|wife|husband|relationship|marriage|partner|break|divorce|সম্পর্ক|বিয়ে|স্ত্রী|স্বামী/.test(q)) return "relationship";
  if (/job|career|work|interview|employment|boss|জব|কাজ|ইন্টারভিউ/.test(q)) return "work";
  if (/visa|immigration|legal|court|authority|home office|appeal|ভিসা|কোর্ট|আইন/.test(q)) return "authority";
  if (/car|vehicle|travel|delivery|move|relocation|lost|গাড়ি|ডেলিভারি|যাত্রা|হারানো/.test(q)) return "movement";
  if (/health|hospital|stress|mind|fear|anxiety|illness|শরীর|হাসপাতাল|মন|ভয়/.test(q)) return "health";
  if (/spiritual|dua|ritual|remedy|nazar|jinn|রুহানি|দোয়া|নজর|আমল/.test(q)) return "spiritual";

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
    moon_jupiter_opposition: has("Moon", "Jupiter", "opposition"),
    mercury_rahu: has("Mercury", "Rahu"),
    mercury_ketu: has("Mercury", "Ketu"),
    mars_jupiter_square: has("Mars", "Jupiter", "square"),
    sun_jupiter: has("Sun", "Jupiter"),
    rahu_ketu: has("Rahu", "Ketu", "opposition")
  };
}

function buildDomainMatrix({ questionDomain, aspects, kpCusps, timing }) {
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
    scores[domain] = n(scores[domain]) + weight;
    why[domain] = arr(why[domain]);
    why[domain].push(reason);
  };

  const a = aspectFlags(aspects);

  if (a.mercury_rahu) {
    add("communication", 4, "Mercury-Rahu communication/document distortion signal");
    add("money", 2, "Mercury-Rahu commercial/payment talk support");
    add("business", 2, "Mercury-Rahu deal/customer route");
    add("protection", 2, "Rahu distortion requires protection");
  }

  if (a.mercury_ketu) {
    add("communication", 2, "Mercury-Ketu hidden/withdrawn message signal");
    add("spiritual", 2, "Ketu subtle/spiritual correction");
    add("protection", 1, "Ketu cut-off/protection factor");
  }

  if (a.moon_mars_square) {
    add("conflict", 5, "Moon-Mars square pressure/reaction");
    add("movement", 2, "Moon-Mars fast movement/agitation");
    add("health", 2, "Moon-Mars body-mind heat");
    add("protection", 3, "Mars pressure protection need");
  }

  if (a.moon_jupiter_opposition) {
    add("relationship", 2, "Moon-Jupiter emotional expansion");
    add("money", 1, "Jupiter value/support echo");
    add("spiritual", 1, "Jupiter belief/spiritual echo");
  }

  if (a.mars_jupiter_square) {
    add("business", 2, "Mars-Jupiter action-expansion tension");
    add("conflict", 2, "Mars-Jupiter overpush/friction");
    add("movement", 1, "Mars-Jupiter active movement");
  }

  if (a.sun_jupiter) {
    add("authority", 2, "Sun-Jupiter authority/support signal");
    add("work", 1, "Sun-Jupiter public/work support");
  }

  if (a.rahu_ketu) {
    add("spiritual", 2, "Node axis karmic sensitivity");
    add("protection", 2, "Node axis protection requirement");
  }

  const kp = obj(kpCusps);
  if (kp["3"]) add("communication", 2, "KP 3rd cusp communication support");
  if (kp["2"]) add("money", 1, "KP 2nd cusp money support");
  if (kp["10"]) {
    add("work", 1, "KP 10th cusp work/status support");
    add("authority", 1, "KP 10th cusp authority support");
  }
  if (kp["11"]) add("money", 1, "KP 11th cusp gain support");
  if (kp["5"]) add("relationship", 1, "KP 5th cusp emotion/romance support");
  if (kp["7"]) add("relationship", 2, "KP 7th cusp partner/public support");
  if (kp["6"]) add("conflict", 1, "KP 6th cusp dispute/service pressure");
  if (kp["8"]) add("protection", 1, "KP 8th cusp hidden-risk support");
  if (kp["9"] || kp["12"]) add("spiritual", 1, "KP 9/12 spiritual/foreign support");

  if (questionDomain !== "general") add(questionDomain, 3, "Question intent boost");
  else add("general", 1, "General/raw transit question");

  if (hasTrigger(timing)) {
    const t = s(timing.dominant_trigger_identity);
    if (t.includes("moon")) {
      add("movement", 2, "Moon live trigger movement/emotion");
      add("relationship", 1, "Moon live trigger emotional field");
      add("communication", 1, "Moon live trigger response field");
    }
    if (t.includes("mercury")) add("communication", 3, "Mercury live trigger");
    if (t.includes("mars")) add("conflict", 3, "Mars live trigger");
    if (t.includes("rahu")) add("protection", 2, "Rahu live trigger");
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
    dominant_domain: ranked[0]?.domain || "general",
    secondary_domain: ranked[1]?.domain || null,
    ranked_domains: ranked,
    scoring_basis: "question_intent + aspects + KP + live_trigger",
    domain_lock_status: ranked[0]?.score >= 7 ? "STRONG_DOMAIN_LOCK" : "SOFT_DOMAIN_LOCK"
  };
}

function buildEventDNA(domain) {
  const bank = {
    communication: ["3", "6", "10", ["Mercury", "Moon", "Rahu"], "message / reply / document / customer contact"],
    money: ["2", "6", "11", ["Jupiter", "Venus", "Mercury"], "payment / income / release / value movement"],
    business: ["7", "10", "11", ["Mercury", "Venus", "Rahu", "Mars"], "deal / order / customer / trade"],
    conflict: ["6", "8", "12", ["Mars", "Saturn", "Rahu", "Ketu"], "pressure / dispute / reaction"],
    protection: ["6", "8", "12", ["Mars", "Saturn", "Rahu", "Ketu"], "hidden risk / nazar / pressure containment"],
    movement: ["3", "4", "9", "12", ["Moon", "Mercury", "Rahu"], "travel / dispatch / relocation / movement"],
    relationship: ["5", "7", "11", ["Venus", "Moon", "Mercury"], "contact / emotion / partner response"],
    work: ["2", "6", "10", "11", ["Saturn", "Sun", "Mercury"], "job / duty / career action"],
    authority: ["6", "9", "10", "12", ["Sun", "Saturn", "Mercury", "Rahu"], "authority / legal / approval"],
    spiritual: ["8", "9", "12", ["Jupiter", "Ketu", "Moon", "Rahu"], "spiritual / unseen / inner field"],
    health: ["1", "6", "8", "12", ["Moon", "Mars", "Saturn", "Rahu"], "body-mind stress / heat / pressure"],
    general: ["1", "3", "10", ["Moon", "Mercury", "Saturn"], "general live field"]
  };

  const d = bank[domain] || bank.general;

  return {
    domain,
    event_class: d[4],
    house_cluster: d.slice(0, -2).flat(),
    primary_significators: d[d.length - 2],
    transit_trigger_requirement: "active micro trigger OR strong aspect-domain convergence",
    dasha_requirement: "full birth mode required for natal timing permission",
    divisional_requirement: "full birth mode required for divisional confirmation",
    denial_vectors: ["low convergence", "absent natal data", "no active micro trigger", "domain conflict"],
    substitute_routes: ["delay", "partial manifestation", "message-first route", "indirect route"],
    dna_completeness: domain === "general" ? "RESTRICTED" : "ELITE_PARTIAL_WITHOUT_FULL_BIRTH"
  };
}

function buildLegalGates({ clientMode, timing, dasha, divisional, confidenceScore }) {
  const mode = detectClientMode(clientMode);
  const trigger = hasTrigger(timing);
  const dashaOpen = isActiveDasha(dasha);
  const divOpen = isActiveDivisional(divisional);

  let precision_gate = "BROAD_WINDOW_ONLY";
  if (mode === "FULL_BIRTH" && trigger && dashaOpen && divOpen) precision_gate = "EXACT_MINUTE_ALLOWED";
  else if (mode === "FULL_BIRTH" && trigger && dashaOpen) precision_gate = "EXACT_HOUR_ALLOWED";
  else if (trigger) precision_gate = "LIVE_TRIGGER_WINDOW_ALLOWED";
  else if (mode === "NAME_ONLY") precision_gate = "NAME_ONLY_RESTRICTED_WINDOW";
  else precision_gate = "UNIVERSAL_RESTRICTED_WINDOW";

  return {
    data_integrity_gate: "PASS_IF_BACKEND_CLEAN",
    promise_gate: mode === "FULL_BIRTH" ? "NATAL_PROMISE_CHECK_AVAILABLE" : "NATAL_PROMISE_NOT_AVAILABLE",
    permission_gate: trigger ? "LIVE_TRIGGER_OPEN" : "PENDING_OR_FORMING",
    execution_gate: trigger ? "ACTIVE" : "LOW_ACTIVITY_OR_FORMING",
    precision_gate,
    confidence_band: confidenceBand(confidenceScore),
    name_only_precision_status: mode === "NAME_ONLY" ? "RESTRICTED_NO_NATAL_CERTAINTY" : "NOT_NAME_ONLY",
    universal_precision_status: mode === "UNIVERSAL" ? "RESTRICTED_NO_PERSON_CLAIM" : "NOT_UNIVERSAL_ONLY",
    dasha_precision_status: dashaOpen ? "DASHA_ACTIVE" : "DASHA_ABSENT_OR_CLOSED",
    divisional_status: divOpen ? "DIVISIONAL_ACTIVE" : "DIVISIONAL_ABSENT_OR_WEAK",
    micro_trigger_status: trigger ? "ACTIVE" : "ZERO_OR_INACTIVE"
  };
}

function buildEliteScore({ domainMatrix, gates, timing, dasha, divisional, confidenceScore }) {
  const score = {
    event_dna_completeness: domainMatrix.domain_lock_status === "STRONG_DOMAIN_LOCK" ? 8 : 5,
    natal_promise_density: gates.promise_gate.includes("AVAILABLE") ? 8 : 0,
    divisional_confirmation: isActiveDivisional(divisional) ? 8 : 0,
    dasha_fructification: isActiveDasha(dasha) ? 8 : 0,
    transit_trigger_maturity: hasTrigger(timing) ? 10 : 3,
    kp_micro_release: gates.micro_trigger_status === "ACTIVE" ? 8 : 3,
    domain_convergence: domainMatrix.domain_lock_status === "STRONG_DOMAIN_LOCK" ? 8 : 4,
    repetition_echo_support: 3,
    behavioural_drag_penalty: -2,
    reality_mediation_penalty: -2,
    data_integrity_penalty: 0
  };

  const total_score = Object.values(score).reduce((a, b) => a + b, 0);

  let elite_convergence_class = "LOW";
  if (total_score >= 55) elite_convergence_class = "A_PLUS_ELITE_DETERMINISTIC";
  else if (total_score >= 45) elite_convergence_class = "A_STRONG";
  else if (total_score >= 34) elite_convergence_class = "B_MODERATE";
  else if (total_score >= 24) elite_convergence_class = "C_RESTRICTED";

  return {
    ...score,
    total_score,
    elite_convergence_class,
    confidence_score_echo: confidenceScore
  };
}

function buildCausalChain({ domain, timing }) {
  const trigger = s(timing?.dominant_trigger_identity) || "NO_ACTIVE_MICRO_TRIGGER";
  return {
    cause_chain_status: hasTrigger(timing) ? "COMPLETE_LIVE_TRIGGER_CHAIN" : "PARTIAL_FORMING_CHAIN",
    cause: domain,
    trigger,
    mechanism: hasTrigger(timing) ? "micro timing release" : "aspect-domain pressure without release",
    route: domain,
    outcome: hasTrigger(timing) ? "ACTIVE_EVENT_FIELD" : "WINDOW_ONLY_FIELD"
  };
}

function buildProbabilityCollapse({ verdict, domainMatrix }) {
  return {
    probability_collapse_result:
      verdict.outcome === "EXACT"
        ? "DIRECT_EXECUTION"
        : verdict.outcome === "PREDICTIVE"
        ? "DELAYED_EXECUTION"
        : "NO_LAWFUL_EXACT_RELEASE_IN_CURRENT_WINDOW",
    winning_signal: domainMatrix.dominant_domain,
    secondary_signal: domainMatrix.secondary_domain,
    suppressed_signal_class: "LOWER_RANKED_OR_NON_EXECUTABLE_SIGNALS_SUPPRESSED"
  };
}

function buildInterpretation(domain, gates) {
  const map = {
    communication: ["message / reply / paperwork / customer route", "communication field"],
    money: ["payment / value / income / release route", "money field"],
    business: ["deal / order / customer / trade route", "business field"],
    conflict: ["pressure / dispute / reaction route", "conflict field"],
    protection: ["protection / containment / hidden-risk route", "protection field"],
    movement: ["movement / dispatch / travel / relocation route", "movement field"],
    relationship: ["contact / emotion / response route", "relationship field"],
    work: ["job / duty / career route", "work field"],
    authority: ["authority / legal / approval route", "authority field"],
    spiritual: ["spiritual / unseen / inner route", "spiritual field"],
    health: ["health / stress / body-mind route", "health field"],
    general: ["general life field", "general field"]
  };

  const [channel, field] = map[domain] || map.general;
  const exact = gates.execution_gate === "ACTIVE";

  return {
    present_manifestation: exact
      ? `${field} is live and actively releasing through ${channel}.`
      : `${field} is forming but not fully released; use window mode.`,
    future_event_nature: exact
      ? `Immediate manifestation is possible through ${channel}.`
      : `Future movement may form through ${channel}, but exact trigger is not unlocked.`,
    future_channel: channel,
    future_tone: exact ? "active / immediate / executable" : "forming / restricted / conditional",
    interpretation_source: exact ? "live_trigger_lock" : "domain_aspect_fallback"
  };
}

function buildRemedyDecision({ domain, gates, interpretation }) {
  let style = "GENERAL_STABILISATION";
  if (gates.confidence_band === "A_PLUS_ELITE" || gates.confidence_band === "A_STRONG") {
    style = "TARGETED_MATERIAL_SYMBOLIC_REMEDY";
  } else if (gates.confidence_band === "B_MODERATE") {
    style = "LIGHT_TARGETED_REMEDY";
  }

  return {
    remedy_picker_ready: true,
    dominant_domain: domain,
    remedy_channel: interpretation.future_channel,
    remedy_tone: interpretation.future_tone,
    confidence_gate: gates.confidence_band,
    recommended_remedy_style: style,
    remedy_scope: "EXECUTION_SUPPORT_ONLY",
    remedy_non_interference_status: "ACTIVE",
    behavioural_remedy_status: "FORBIDDEN_NULL",
    admissible_remedy_types: ["material", "symbolic", "dhikr/dua", "timed action"],
    warning:
      style === "GENERAL_STABILISATION"
        ? "Use light/general remedy only unless trigger strengthens."
        : "Targeted remedy allowed inside precision ceiling."
  };
}

function buildVerdict({ timing, predictive, domainMatrix, gates }) {
  if (hasTrigger(timing) && timing.exact_time_candidate_utc) {
    return {
      outcome: "EXACT",
      event_state: "ACTIVE_TRIGGER",
      best_actionable_time_utc: timing.exact_time_candidate_utc,
      best_actionable_mode: "PRESENT_TRIGGER",
      dominant_domain: domainMatrix.dominant_domain,
      secondary_domain: domainMatrix.secondary_domain,
      precision_ceiling: gates.precision_gate
    };
  }

  if (predictive?.best_future_candidate?.predicted_time_utc) {
    return {
      outcome: "PREDICTIVE",
      event_state: "FUTURE_TRIGGER",
      best_actionable_time_utc: predictive.best_future_candidate.predicted_time_utc,
      best_actionable_mode: "PREDICTIVE",
      dominant_domain: domainMatrix.dominant_domain,
      secondary_domain: domainMatrix.secondary_domain,
      precision_ceiling: gates.precision_gate
    };
  }

  return {
    outcome: "WINDOW",
    event_state: "LOW_ACTIVITY",
    best_actionable_time_utc: null,
    best_actionable_mode: "WAIT_OR_GENERAL_WINDOW",
    dominant_domain: domainMatrix.dominant_domain,
    secondary_domain: domainMatrix.secondary_domain,
    precision_ceiling: gates.precision_gate
  };
}

export function buildDeterministicOracleEcosystem(input = {}) {
  const clientMode = obj(input.clientMode || input.client_mode);
  const transit = obj(input.transit || input.predictivePacket || input);
  const multi = obj(input.multi);
  const predictivePacket = obj(input.predictivePacket || transit);

  const question = clientMode?.input_context?.question || "";
  const questionDomain = getQuestionDomain(question);

  const timing = obj(
    predictivePacket.timing_evidence || {
      trigger_present:
        transit?.micro_status?.trigger_present === true ||
        n(multi?.active_trigger_snapshots) > 0,
      dominant_trigger_identity:
        transit?.micro_dominant_trigger?.type ||
        multi?.dominant_trigger_identity ||
        null,
      exact_time_candidate_utc:
        transit?.micro_dominant_trigger?.peak_time_utc ||
        multi?.micro_dominant_trigger?.peak_time_utc ||
        null,
      convergence_strength:
        multi?.convergence_strength ||
        transit?.micro_convergence?.convergence_strength ||
        "low"
    }
  );

  const confidenceScore = n(predictivePacket?.confidence?.confidence_score, hasTrigger(timing) ? 70 : 45);

  const domainMatrix = buildDomainMatrix({
    questionDomain,
    aspects: predictivePacket.aspects_summary || predictivePacket.aspects || transit.aspects || [],
    kpCusps: predictivePacket.kp_cusps || transit.kp_cusps,
    timing
  });

  const eventDNA = buildEventDNA(domainMatrix.dominant_domain);

  const gates = buildLegalGates({
    clientMode,
    timing,
    dasha: predictivePacket.dasha || transit.dasha,
    divisional: predictivePacket.divisional || transit.divisional,
    confidenceScore
  });

  const eliteScore = buildEliteScore({
    domainMatrix,
    gates,
    timing,
    dasha: predictivePacket.dasha || transit.dasha,
    divisional: predictivePacket.divisional || transit.divisional,
    confidenceScore
  });

  const predictive = obj(predictivePacket.predictive_smart_mode);

  const verdict = buildVerdict({
    timing,
    predictive,
    domainMatrix,
    gates
  });

  const interpretation = buildInterpretation(domainMatrix.dominant_domain, gates);

  const remedy = buildRemedyDecision({
    domain: domainMatrix.dominant_domain,
    gates,
    interpretation
  });

  const causalChain = buildCausalChain({
    domain: domainMatrix.dominant_domain,
    timing
  });

  const probabilityCollapse = buildProbabilityCollapse({
    verdict,
    domainMatrix
  });

  const precisionLaw = {
    exact_time_permission_ladder: gates.precision_gate,
    micro_trigger_zero_law:
      gates.micro_trigger_status === "ZERO_OR_INACTIVE" ? "ACTIVE_DOWNGRADE" : "NOT_ACTIVE",
    name_only_precision_mode: gates.name_only_precision_status,
    universal_precision_mode: gates.universal_precision_status,
    dasha_fallback_restriction: gates.dasha_precision_status,
    confidence_band: gates.confidence_band
  };

  const finalVerdictLock = {
    signal_reduction_result: verdict.outcome,
    winning_signal_class: verdict.event_state,
    suppressed_signal_class: "LOWER_RANKED_SIGNALS_SUPPRESSED",
    final_freeze_state: "LOCKED_FOR_THIS_PACKET"
  };

  const courtroomPacket = {
    query_intent_class: "LIVE_ORACLE_EVENT_FIELD_SCAN",
    dominant_executable_event: domainMatrix.dominant_domain,
    non_executable_residue: domainMatrix.secondary_domain,
    event_dna: eventDNA,
    legal_gates: gates,
    causal_chain: causalChain,
    precision_law: precisionLaw,
    elite_scoring_matrix: eliteScore,
    probability_collapse: probabilityCollapse,
    final_verdict_lock: finalVerdictLock
  };

  return {
    engine_status: VERSION,
    system_status: "OK",
    oracle_mode: "ELITE_DETERMINISTIC_ORACLE_ECOSYSTEM",
    client_mode: clientMode,

    raw_evidence: {
      authority: predictivePacket.authority || transit.authority || null,
      freshness: predictivePacket.freshness || transit.freshness || null,
      integrity: predictivePacket.integrity || transit.integrity || null,
      location_used: predictivePacket.location_used || transit.location_used || null,
      panchanga: predictivePacket.panchanga || transit.panchanga || null,
      planets: predictivePacket.planets || null,
      aspects_summary: predictivePacket.aspects_summary || transit.aspects || [],
      kp_cusps: predictivePacket.kp_cusps || transit.kp_cusps || null,
      dasha: predictivePacket.dasha || transit.dasha || null,
      divisional: predictivePacket.divisional || transit.divisional || null
    },

    timing_evidence: timing,
    trigger_maturity: {
      trigger_present: hasTrigger(timing),
      dominant_trigger_identity: timing.dominant_trigger_identity || null,
      exact_time_candidate_utc: timing.exact_time_candidate_utc || null,
      maturity_status: hasTrigger(timing) ? "MATURE_ACTIVE" : "IMMATURE_OR_FORMING",
      convergence_strength: timing.convergence_strength || "low"
    },

    domain_matrix: domainMatrix,
    event_dna: eventDNA,
    legal_gates: gates,
    causal_chain: causalChain,
    precision_law: precisionLaw,
    elite_scoring_matrix: eliteScore,
    probability_collapse: probabilityCollapse,

    event_interpretation: interpretation,
    oracle_verdict: verdict,
    remedy_decision_support: remedy,
    final_verdict_lock: finalVerdictLock,
    courtroom_packet: courtroomPacket,

    passthrough: predictivePacket
  };
}