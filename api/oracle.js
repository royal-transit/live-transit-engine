import { predictiveSmartMode } from "./predictiveSmartMode.js";

/*
  SMART ORACLE ELITE UNIVERSAL LIVE V11 — UHAP FULL PACKET BUILD
  Purpose:
  - Universal live only
  - Name-only live
  - Full birth live
  - Returns UHAP-style elite packet fields for GPT remedy/verdict work
*/

const VERSION = "SMART_ORACLE_ELITE_UNIVERSAL_LIVE_V11_UHAP_FULL_PACKET";

function toTimestamp(value) {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

function norm(v) {
  return String(v || "").trim();
}

function lower(v) {
  return norm(v).toLowerCase();
}

function round(v, d = 2) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Number(n.toFixed(d));
}

function bool(v) {
  return v === true;
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function parseClientMode(query = {}) {
  const name = norm(query.name);
  const birthDatetime = norm(query.birth_datetime);
  const dob = norm(query.dob);
  const tob = norm(query.tob);
  const pob = norm(query.pob);

  const hasName = Boolean(name);
  const hasFullBirth = Boolean(birthDatetime || (dob && tob));

  if (hasFullBirth) {
    return {
      subject_mode: hasName ? "NAME_FULL_DETAIL_LIVE" : "FULL_BIRTH_LIVE",
      identity_depth: "LEVEL_5_FULL_BIRTH_LIVE",
      precision_mode: "FULL_BIRTH_LIVE",
      subject_name: name || null,
      normalized_name: name ? lower(name) : null,
      usage_rule: "Full birth data may support natal timing if backend dasha/divisional are active."
    };
  }

  if (hasName) {
    return {
      subject_mode: "NAME_ONLY_LIVE",
      identity_depth: "LEVEL_2_NAME_ONLY_LIVE",
      precision_mode: "NAME_ONLY_LIVE",
      subject_name: name,
      normalized_name: lower(name),
      usage_rule: "Use name as context only; do not claim natal certainty."
    };
  }

  return {
    subject_mode: "UNIVERSAL_LIVE_ONLY",
    identity_depth: "LEVEL_1_UNIVERSAL_LIVE",
    precision_mode: "LIVE_ONLY",
    subject_name: null,
    normalized_name: null,
    usage_rule: "Use universal live transit only."
  };
}

function buildQueryContext(query = {}) {
  return {
    question: norm(query.question || "raw transit"),
    facts: norm(query.facts || ""),
    lat: query.lat ?? null,
    lon: query.lon ?? null,
    birth_datetime: query.birth_datetime ?? null,
    dob: query.dob ?? null,
    tob: query.tob ?? null,
    pob: query.pob ?? null,
    timezone_offset: query.timezone_offset ?? null
  };
}

function buildTransitUrl(baseUrl, query = {}) {
  const params = new URLSearchParams();

  if (query.lat) params.set("lat", query.lat);
  if (query.lon) params.set("lon", query.lon);

  if (query.birth_datetime) {
    params.set("birth_datetime", query.birth_datetime);
  } else if (query.dob && query.tob) {
    const tz = query.timezone_offset || "+06:00";
    params.set("birth_datetime", `${query.dob}T${query.tob}:00${tz}`);
  }

  const qs = params.toString();
  return `${baseUrl}/api/transit${qs ? `?${qs}` : ""}`;
}

function buildMultiSnapshotUrl(baseUrl, query = {}) {
  const params = new URLSearchParams();

  if (query.lat) params.set("lat", query.lat);
  if (query.lon) params.set("lon", query.lon);

  if (query.birth_datetime) {
    params.set("birth_datetime", query.birth_datetime);
  } else if (query.dob && query.tob) {
    const tz = query.timezone_offset || "+06:00";
    params.set("birth_datetime", `${query.dob}T${query.tob}:00${tz}`);
  }

  const qs = params.toString();
  return `${baseUrl}/api/multi-snapshot${qs ? `?${qs}` : ""}`;
}

function classifyQuestionDomain(question = "") {
  const q = lower(question);

  if (/(money|payment|cash|income|rizq|business|deal|order|customer|profit|finance|টাকা|পেমেন্ট|ব্যবসা)/i.test(q)) return "money";
  if (/(message|call|reply|contact|document|paper|email|communication|মেসেজ|ফোন|ডকুমেন্ট)/i.test(q)) return "communication";
  if (/(love|wife|husband|relationship|marriage|partner|break|রিলেশন|বিয়ে|সম্পর্ক)/i.test(q)) return "relationship";
  if (/(job|work|career|interview|employment|boss|কাজ|জব|ইন্টারভিউ)/i.test(q)) return "work";
  if (/(visa|immigration|home office|legal|court|authority|gov|appeal|ভিসা|কোর্ট)/i.test(q)) return "authority";
  if (/(travel|delivery|car|vehicle|move|relocation|ডেলিভারি|গাড়ি|যাত্রা)/i.test(q)) return "movement";
  if (/(health|stress|hospital|illness|mind|fear|anxiety|শরীর|হাসপাতাল|মন)/i.test(q)) return "health";
  if (/(spiritual|dua|ritual|nazar|jinn|remedy|রুহানি|নজর|দোয়া)/i.test(q)) return "spiritual";

  return "general";
}

function detectAspects(aspects = []) {
  const has = (a, b, type = null) =>
    safeArray(aspects).some((x) => {
      const matchPair =
        (x.planet1 === a && x.planet2 === b) ||
        (x.planet1 === b && x.planet2 === a);
      return matchPair && (!type || x.type === type);
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

function scoreDomains({ aspects, kp, questionDomain, clientMode }) {
  const s = {
    communication: 0,
    conflict: 0,
    protection: 0,
    money: 0,
    movement: 0,
    business: 0,
    relationship: 0,
    spiritual: 0,
    health: 0,
    authority: 0,
    work: 0,
    general: 0
  };

  const a = detectAspects(aspects);

  if (a.mercury_rahu) {
    s.communication += 3;
    s.money += 1;
    s.business += 1;
    s.protection += 1;
  }

  if (a.mercury_ketu) {
    s.communication += 1;
    s.spiritual += 1;
    s.protection += 1;
  }

  if (a.moon_mars_square) {
    s.conflict += 4;
    s.movement += 2;
    s.health += 1;
    s.protection += 2;
  }

  if (a.moon_jupiter_opposition) {
    s.relationship += 1;
    s.money += 1;
    s.spiritual += 1;
  }

  if (a.mars_jupiter_square) {
    s.conflict += 1;
    s.business += 1;
    s.movement += 1;
  }

  if (a.sun_jupiter) {
    s.authority += 1;
    s.support += 1;
  }

  if (a.rahu_ketu) {
    s.protection += 1;
    s.spiritual += 1;
  }

  if (kp) {
    if (kp["3"]) s.communication += 1;
    if (kp["2"] || kp["10"] || kp["11"]) s.money += 1;
    if (kp["7"] || kp["5"]) s.relationship += 1;
    if (kp["9"] || kp["12"]) s.spiritual += 1;
    if (kp["6"] || kp["8"]) s.conflict += 1;
  }

  if (questionDomain && s[questionDomain] !== undefined) s[questionDomain] += 2;

  if (clientMode.precision_mode === "NAME_ONLY_LIVE") s.general += 1;
  if (clientMode.precision_mode === "LIVE_ONLY") s.general += 1;

  const ranked = Object.entries(s)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([domain, score]) => ({ domain, score }));

  return {
    dominant_domain: ranked[0]?.domain || questionDomain || "general",
    secondary_domain: ranked[1]?.domain || null,
    ranked_domains: ranked,
    domain_source: "question + transit aspects + KP support"
  };
}

function buildEventDNA(domain) {
  const table = {
    communication: {
      event_class: "communication / message / document movement",
      house_cluster: ["3", "6", "10"],
      primary_significators: ["Mercury", "Moon", "Sun"],
      divisional_requirement: "D1 primary; D10 if authority/work document",
      dasha_requirement: "Mercury/Moon/Sun/Rahu support preferred",
      transit_requirement: "Mercury/Rahu/Moon trigger or 3rd-house KP support",
      denial_indicators: ["Saturn delay", "Rahu confusion", "6th dispute"],
      substitute_route: ["message first", "document correction", "indirect reply"]
    },
    money: {
      event_class: "money / payment / value release",
      house_cluster: ["2", "11", "6"],
      primary_significators: ["Jupiter", "Venus", "Mercury"],
      divisional_requirement: "D1 primary; D10 for business income",
      dasha_requirement: "2/11 linked dasha preferred",
      transit_requirement: "Jupiter/Venus/Mercury or Moon release",
      denial_indicators: ["Saturn delay", "6th obligation", "Rahu distortion"],
      substitute_route: ["partial release", "split payment", "delayed transfer"]
    },
    relationship: {
      event_class: "relationship / contact / emotional response",
      house_cluster: ["5", "7", "11"],
      primary_significators: ["Venus", "Moon", "Mercury"],
      divisional_requirement: "D1 + D9 preferred",
      dasha_requirement: "Venus/Moon/7th linkage preferred",
      transit_requirement: "Moon/Venus/Mercury release",
      denial_indicators: ["6th conflict", "8th rupture", "Rahu confusion"],
      substitute_route: ["message first", "mediated contact", "soft reopening"]
    },
    conflict: {
      event_class: "pressure / dispute / reaction",
      house_cluster: ["6", "8", "12"],
      primary_significators: ["Mars", "Saturn", "Rahu", "Ketu"],
      divisional_requirement: "D1 primary",
      dasha_requirement: "Mars/Saturn/Rahu/Ketu involvement",
      transit_requirement: "Mars/Moon or Rahu/Mars activation",
      denial_indicators: ["overreaction", "hidden enemy", "authority pressure"],
      substitute_route: ["delay", "containment", "controlled response"]
    },
    movement: {
      event_class: "movement / travel / dispatch / shift",
      house_cluster: ["3", "4", "9", "12"],
      primary_significators: ["Moon", "Mercury", "Rahu", "Saturn"],
      divisional_requirement: "D1 primary",
      dasha_requirement: "3/9/12 linkage preferred",
      transit_requirement: "Moon boundary or Rahu/Mercury trigger",
      denial_indicators: ["third-party delay", "route blockage"],
      substitute_route: ["short movement", "delayed dispatch", "route change"]
    },
    authority: {
      event_class: "authority / legal / office / formal processing",
      house_cluster: ["6", "9", "10", "12"],
      primary_significators: ["Sun", "Saturn", "Mercury", "Rahu"],
      divisional_requirement: "D1 primary; D10 helpful",
      dasha_requirement: "Sun/Saturn/Mercury/Rahu support",
      transit_requirement: "Sun/Saturn/Mercury or KP 10th support",
      denial_indicators: ["queue", "scrutiny", "technical objection"],
      substitute_route: ["review first", "request for evidence", "slow approval"]
    },
    spiritual: {
      event_class: "spiritual / unseen / internal field",
      house_cluster: ["8", "9", "12"],
      primary_significators: ["Moon", "Jupiter", "Saturn", "Rahu", "Ketu"],
      divisional_requirement: "D1 primary; D9 helpful",
      dasha_requirement: "9/12 or Jupiter/Ketu/Rahu support",
      transit_requirement: "Moon/Ketu/Rahu/Jupiter sensitivity",
      denial_indicators: ["fear distortion", "mental overload"],
      substitute_route: ["symbolic cleansing", "protection", "dhikr-linked action"]
    },
    health: {
      event_class: "health / stress / body-mind pressure",
      house_cluster: ["1", "6", "8", "12"],
      primary_significators: ["Moon", "Saturn", "Mars", "Rahu"],
      divisional_requirement: "D1 primary",
      dasha_requirement: "6/8/12 linkage",
      transit_requirement: "Moon/Mars/Saturn/Rahu pressure",
      denial_indicators: ["stress", "sleep disruption", "inflammation"],
      substitute_route: ["care action", "restoration", "medical route"]
    },
    work: {
      event_class: "job / career / work route",
      house_cluster: ["2", "6", "10", "11"],
      primary_significators: ["Saturn", "Mercury", "Sun"],
      divisional_requirement: "D1 + D10 preferred",
      dasha_requirement: "6/10/11 dasha support",
      transit_requirement: "Saturn/Sun/Mercury or 10th KP",
      denial_indicators: ["delay", "authority friction"],
      substitute_route: ["temporary role", "conditional opening", "late response"]
    },
    general: {
      event_class: "general live field",
      house_cluster: ["1", "3", "10"],
      primary_significators: ["Moon", "Mercury", "Saturn"],
      divisional_requirement: "limited unless full birth supplied",
      dasha_requirement: "limited unless full birth supplied",
      transit_requirement: "active live trigger",
      denial_indicators: ["low convergence", "no micro trigger"],
      substitute_route: ["general stabilisation"]
    }
  };

  const dna = table[domain] || table.general;

  return {
    domain,
    event_class: dna.event_class,
    house_cluster: dna.house_cluster,
    primary_significators: dna.primary_significators,
    secondary_significators: [],
    divisional_support_requirement: dna.divisional_requirement,
    dasha_requirement: dna.dasha_requirement,
    transit_trigger_requirement: dna.transit_requirement,
    denial_distortion_indicators: dna.denial_indicators,
    substitute_route_indicators: dna.substitute_route,
    dna_completeness: domain === "general" ? "RESTRICTED" : "PARTIAL",
    dna_stress_factor: dna.denial_indicators.join(" / "),
    dna_substitute_route_risk: dna.substitute_route.join(" / ")
  };
}

function buildGates({ clientMode, transit, timing, confidence, domainHint }) {
  const fullBirth = clientMode.precision_mode === "FULL_BIRTH_LIVE";
  const nameOnly = clientMode.precision_mode === "NAME_ONLY_LIVE";
  const universal = clientMode.precision_mode === "LIVE_ONLY";

  const dashaActive = transit?.dasha?.status === "active";
  const divisionalActive = transit?.divisional?.status === "active";
  const microActive = bool(timing?.trigger_present);
  const clean = transit?.integrity?.status === "CLEAN";
  const fresh = transit?.freshness?.status === "LIVE";

  let precisionLevel = "LEVEL_2_DATE_PART_OF_DAY";
  let ceiling = "BROAD_WINDOW";

  if (fullBirth && dashaActive && divisionalActive && microActive && clean && fresh) {
    precisionLevel = "LEVEL_5_EXACT_MINUTE";
    ceiling = "EXACT_MINUTE_ALLOWED";
  } else if (fullBirth && dashaActive && microActive && clean) {
    precisionLevel = "LEVEL_4_EXACT_HOUR";
    ceiling = "EXACT_HOUR_ALLOWED";
  } else if (microActive && clean && fresh) {
    precisionLevel = "LEVEL_3_HOUR_RANGE";
    ceiling = "HOUR_RANGE_ALLOWED";
  } else if (nameOnly || universal) {
    precisionLevel = "LEVEL_2_DATE_PART_OF_DAY";
    ceiling = "NAME_OR_UNIVERSAL_RESTRICTED_WINDOW";
  }

  const confidenceBand =
    confidence?.confidence_score >= 75 ? "A_STRONG" :
    confidence?.confidence_score >= 60 ? "B_MODERATE" :
    "C_RESTRICTED";

  return {
    data_integrity_gate: clean && fresh ? "PASS" : "RESTRICTED",
    promise_gate: fullBirth ? "NATAL_CHECK_AVAILABLE" : "NATAL_NOT_AVAILABLE",
    permission_gate: microActive ? "PRESENT_TRIGGER_OPEN" : "PENDING_OR_FORMING",
    execution_gate: microActive ? "ACTIVE" : "LOW_ACTIVITY_OR_FORMING",
    precision_gate: ceiling,
    confidence_band: confidenceBand,
    micro_trigger_status: microActive ? "ACTIVE" : "ZERO_OR_INACTIVE",
    name_only_precision_status: nameOnly ? "RESTRICTED_CONDITIONAL" : "NOT_NAME_ONLY",
    universal_precision_status: universal ? "RESTRICTED_UNIVERSAL_ONLY" : "NOT_UNIVERSAL_ONLY",
    dasha_precision_status: dashaActive ? "ACTIVE" : "RESTRICTED_ABSENT",
    divisional_status: divisionalActive ? "ACTIVE" : "WEAK_OR_ABSENT",
    dominant_domain: domainHint?.dominant_domain || "general"
  };
}

function buildEliteScore({ clientMode, timing, confidence, transit, domainHint }) {
  const fullBirth = clientMode.precision_mode === "FULL_BIRTH_LIVE";
  const dashaActive = transit?.dasha?.status === "active";
  const divisionalActive = transit?.divisional?.status === "active";
  const microActive = bool(timing?.trigger_present);

  const score = {
    event_dna_completeness: domainHint?.dominant_domain === "general" ? 3 : 6,
    natal_promise_density: fullBirth ? 6 : 0,
    divisional_confirmation: divisionalActive ? 7 : 0,
    dasha_fructification: dashaActive ? 7 : 0,
    transit_trigger_maturity: microActive ? 8 : 3,
    kp_micro_release: microActive ? 8 : 2,
    repetition_echo_support: 3,
    behavioural_drag_penalty: -2,
    reality_mediation_penalty: -2,
    data_integrity_penalty: transit?.integrity?.status === "CLEAN" ? 0 : -5
  };

  const total = Object.values(score).reduce((a, b) => a + b, 0);

  let cls = "WEAK_OR_NON_CONFIRMATORY";
  if (total >= 42) cls = "ELITE_STRONG_CONVERGENCE";
  else if (total >= 34) cls = "STRONG_CONVERGENCE";
  else if (total >= 26) cls = "MODERATE_CONDITIONAL";
  else if (total >= 18) cls = "RESTRICTED";

  return {
    ...score,
    total_score: round(total, 2),
    elite_convergence_class: cls,
    confidence_score_echo: confidence?.confidence_score ?? null
  };
}

function buildInterpretation(domain, timing, predictive) {
  const live = bool(timing?.trigger_present);
  const future = predictive?.best_future_candidate;

  const base = {
    communication: {
      present: "Communication, reply, document, customer, order-talk, or message pressure is the dominant field.",
      future: "A communication-linked development may form through message, reply, document, negotiation, or payment-path contact.",
      channel: "communication / order / deal / paperwork / payment path",
      tone: "message / negotiation / paperwork / money-link"
    },
    conflict: {
      present: "Pressure, irritation, heat, or reactive field is active in the background.",
      future: "A pressure-linked event may form through disagreement, urgency, sharp response, or containment need.",
      channel: "pressure / reaction / protection / movement",
      tone: "heated / controlled / defensive"
    },
    money: {
      present: "Money, value, customer, payment, or deal-value movement is forming.",
      future: "A money-linked development may form through payment, release, pricing, order, or deal flow.",
      channel: "money / payment / value / customer path",
      tone: "release / negotiation / value movement"
    },
    relationship: {
      present: "Emotional or relational contact-field is sensitive.",
      future: "A relationship-linked response may form through attention, message, closeness, or emotional movement.",
      channel: "emotion / contact / response",
      tone: "responsive / emotional"
    },
    spiritual: {
      present: "Spiritual, inward, unseen, or protection-sensitive field is active.",
      future: "A subtle opening may form through intuition, protection, cleansing, or inner correction.",
      channel: "spiritual / protection / inner field",
      tone: "subtle / inward / protective"
    },
    general: {
      present: "General live transit field is active but not sharply released.",
      future: "A general window is forming, but no exact release is unlocked.",
      channel: "general life field",
      tone: "forming / mixed / transitional"
    }
  };

  const x = base[domain] || base.general;

  return {
    past_pattern: `Similar pattern may have appeared before through ${x.channel}.`,
    present_manifestation: live
      ? `${x.present} Present trigger is live.`
      : x.present,
    future_event_nature: future
      ? `${x.future} Predictive candidate is available.`
      : x.future,
    future_channel: x.channel,
    future_tone: x.tone,
    interpretation_source: live ? "live_trigger_lock" : future ? "predictive_candidate" : "aspect_domain_fallback"
  };
}

function buildRemedySupport({ domain, interpretation, gates }) {
  const style =
    gates.confidence_band === "A_STRONG" ? "TARGETED_MATERIAL_SYMBOLIC_REMEDY" :
    gates.confidence_band === "B_MODERATE" ? "LIGHT_TARGETED_REMEDY" :
    "GENERAL_STABILISATION";

  return {
    remedy_picker_ready: true,
    dominant_domain: domain,
    remedy_channel: interpretation.future_channel,
    remedy_tone: interpretation.future_tone,
    confidence_gate: gates.confidence_band,
    recommended_remedy_style: style,
    remedy_non_interference_status: "ACTIVE",
    remedy_scope: "EXECUTION_SUPPORT_ONLY",
    behavioural_remedy_status: "FORBIDDEN_NULL",
    remedy_admissibility_required: ["MATERIAL", "SYMBOLIC", "ACTION"],
    warning:
      gates.confidence_band === "C_RESTRICTED"
        ? "Use light/general remedy only unless live trigger strengthens."
        : "Targeted remedy allowed within precision ceiling."
  };
}

function buildVerdict({ timing, predictive, domainHint, gates }) {
  if (bool(timing?.trigger_present) && timing?.exact_time_candidate_utc) {
    return {
      outcome: "EXACT",
      event_state: "ACTIVE_TRIGGER",
      best_actionable_time_utc: timing.exact_time_candidate_utc,
      best_actionable_mode: "PRESENT_TRIGGER",
      dominant_domain: domainHint.dominant_domain,
      secondary_domain: domainHint.secondary_domain,
      precision_ceiling: gates.precision_gate
    };
  }

  if (predictive?.best_future_candidate?.predicted_time_utc) {
    return {
      outcome: "PREDICTIVE",
      event_state: "FUTURE_TRIGGER",
      best_actionable_time_utc: predictive.best_future_candidate.predicted_time_utc,
      best_actionable_mode: "PREDICTIVE",
      dominant_domain: domainHint.dominant_domain,
      secondary_domain: domainHint.secondary_domain,
      precision_ceiling: gates.precision_gate
    };
  }

  return {
    outcome: "WINDOW",
    event_state: "LOW_ACTIVITY",
    best_actionable_time_utc: null,
    best_actionable_mode: "WAIT_OR_GENERAL_WINDOW",
    dominant_domain: domainHint.dominant_domain,
    secondary_domain: domainHint.secondary_domain,
    precision_ceiling: gates.precision_gate
  };
}

function buildCompliance({ transit, gates, domainHint, interpretation, threeDay }) {
  return {
    calculation_authority: {
      source: transit?.authority?.source || "Swiss Ephemeris",
      ayanamsa: transit?.authority?.ayanamsa || "lahiri",
      zodiac: transit?.authority?.zodiac || "sidereal",
      integrity_status: transit?.integrity?.status || "UNKNOWN",
      export_type: "ORACLE_STRUCTURED_PACKET",
      packet_grade: "UHAP_ELITE_COMPLIANT"
    },
    evidence_normalisation: {
      natal_layer: gates.promise_gate,
      divisional_layer: gates.divisional_status,
      transit_layer: "ACTIVE",
      kp_micro_timing: gates.precision_gate,
      convergence_strength: transit?.timing_evidence?.convergence_strength || "low",
      dominant_domain: domainHint.dominant_domain,
      secondary_domain: domainHint.secondary_domain
    },
    execution_context: {
      context_type: domainHint.dominant_domain,
      channel_type: interpretation.future_channel,
      execution_status: gates.execution_gate,
      permission_status: gates.permission_gate,
      route_status: bool(transit?.timing_evidence?.trigger_present) ? "DIRECT" : "FORMING_ROUTE",
      manifestation_form: interpretation.future_tone
    },
    fate_structure: {
      fate_gate: gates.permission_gate,
      execution_strength: gates.confidence_band,
      authority_planet: transit?.timing_evidence?.dominant_trigger_identity || domainHint.dominant_domain,
      event_radar: threeDay
    }
  };
}

function fullTriggerScan(packet) {
  const predictive = packet?.predictive_smart_mode || {};
  const timing = packet?.timing_evidence || {};
  const nowTs = toTimestamp(packet?.timestamp) || Date.now();

  const out = {
    current_active_triggers: [],
    next_24h_triggers: [],
    next_72h_triggers: [],
    dominant_trigger: null,
    secondary_trigger: null,
    discarded_weak_triggers: []
  };

  if (timing.trigger_present) {
    out.current_active_triggers.push({
      kind: "live_current_trigger",
      predicted_time_utc: timing.exact_time_candidate_utc || packet.timestamp,
      confidence: "HIGH",
      strength_score: 0.95,
      reason: "Current live trigger present",
      details: {
        dominant_trigger_identity: timing.dominant_trigger_identity
      }
    });
  }

  const candidate = predictive?.best_future_candidate;
  if (candidate?.predicted_time_utc) {
    const ts = toTimestamp(candidate.predicted_time_utc);
    const h = ts ? (ts - nowTs) / 3600000 : 999;

    const enriched = {
      ...candidate,
      source: "predictive_smart_mode.best_future_candidate"
    };

    if (h <= 24) out.next_24h_triggers.push(enriched);
    else if (h <= 72) out.next_72h_triggers.push(enriched);
    else out.discarded_weak_triggers.push(enriched);
  }

  const all = [
    ...out.current_active_triggers,
    ...out.next_24h_triggers,
    ...out.next_72h_triggers
  ].sort((a, b) => Number(b.strength_score || 0) - Number(a.strength_score || 0));

  out.dominant_trigger = all[0] || null;
  out.secondary_trigger = all[1] || null;

  return out;
}

function buildThreeDayPhaseMap(triggerScan, timing) {
  return {
    day_1: {
      phase: timing?.trigger_present ? "activation_or_live_peak" : "immediate_build_or_first_gate",
      primary_trigger:
        triggerScan.current_active_triggers[0] ||
        triggerScan.next_24h_triggers[0] ||
        null
    },
    day_2: {
      phase: "secondary_shift_or_followup",
      primary_trigger:
        triggerScan.next_24h_triggers[1] ||
        triggerScan.next_72h_triggers[0] ||
        null
    },
    day_3: {
      phase: "continuation_turn_or_manifestation_fade",
      primary_trigger:
        triggerScan.next_72h_triggers[1] ||
        triggerScan.discarded_weak_triggers[0] ||
        null
    }
  };
}

export default async function handler(req, res) {
  try {
    const baseUrl = "https://live-transit-engine.vercel.app";
    const query = req.query || {};

    const clientMode = parseClientMode(query);
    clientMode.input_context = buildQueryContext(query);

    const transitUrl = buildTransitUrl(baseUrl, query);
    const multiUrl = buildMultiSnapshotUrl(baseUrl, query);

    const [transitRes, multiRes] = await Promise.all([
      fetch(transitUrl),
      fetch(multiUrl)
    ]);

    if (!transitRes.ok) throw new Error(`transit_fetch_failed_${transitRes.status}`);
    if (!multiRes.ok) throw new Error(`multi_snapshot_fetch_failed_${multiRes.status}`);

    const transit = await transitRes.json();
    const multi = await multiRes.json();

    const triggerPresent =
      transit?.micro_status?.trigger_present === true ||
      Number(multi?.active_trigger_snapshots || 0) > 0;

    const exactTimeCandidate =
      transit?.micro_dominant_trigger?.peak_time_utc ||
      multi?.micro_dominant_trigger?.peak_time_utc ||
      null;

    const precisionAllowed =
      transit?.micro_status?.precision_allowed ||
      (triggerPresent ? "minute_candidate" : "window_only");

    const dominantTriggerIdentity =
      transit?.micro_dominant_trigger?.type ||
      multi?.dominant_trigger_identity ||
      null;

    const convergenceStrength =
      multi?.convergence_strength ||
      transit?.micro_convergence?.convergence_strength ||
      "low";

    const clusterDensity =
      multi?.cluster_density ||
      transit?.micro_convergence?.cluster_density ||
      0;

    const activeTriggerSnapshots = Number(multi?.active_trigger_snapshots || 0);

    const planets = {
      sun: transit?.sun || null,
      moon: transit?.moon || null,
      mercury: transit?.mercury || null,
      venus: transit?.venus || null,
      mars: transit?.mars || null,
      jupiter: transit?.jupiter || null,
      saturn: transit?.saturn || null,
      rahu: transit?.rahu || null,
      ketu: transit?.ketu || null
    };

    const kpCusps = transit?.kp_cusps || null;

    const dasha =
      transit?.dasha?.status === "active"
        ? {
            ...transit.dasha,
            natal_timing_permission: "OPEN"
          }
        : {
            status: transit?.dasha?.status || "absent_no_birth_datetime",
            required_input: "birth_datetime OR dob+tob+timezone_offset",
            format: transit?.dasha?.format || null,
            natal_timing_permission: "CLOSED"
          };

    const divisional =
      transit?.divisional?.status === "active"
        ? {
            ...transit.divisional,
            divisional_reinforcement_grade: "STRONG"
          }
        : {
            status: transit?.divisional?.status || "absent_no_birth_datetime",
            required_input: "birth_datetime OR dob+tob+timezone_offset",
            supported: ["D7", "D9", "D10", "D12", "D24"],
            divisional_reinforcement_grade: "WEAK_OR_ABSENT"
          };

    let confidenceScore = 30;
    const confidenceReasons = [];

    if (transit?.integrity?.status === "CLEAN") {
      confidenceScore += 5;
      confidenceReasons.push("clean integrity");
    }

    if (transit?.freshness?.status === "LIVE") {
      confidenceScore += 5;
      confidenceReasons.push("live freshness");
    }

    if (triggerPresent) {
      confidenceScore += 25;
      confidenceReasons.push("micro trigger active");
    } else {
      confidenceReasons.push("no active trigger");
    }

    if (convergenceStrength === "high" || Number(convergenceStrength) >= 0.75) {
      confidenceScore += 25;
      confidenceReasons.push("high convergence");
    } else if (convergenceStrength === "medium" || Number(convergenceStrength) >= 0.4) {
      confidenceScore += 15;
      confidenceReasons.push("medium convergence");
    } else {
      confidenceReasons.push("low convergence");
    }

    if (activeTriggerSnapshots >= 5) {
      confidenceScore += 10;
      confidenceReasons.push("multi snapshot strong");
    }

    if (dasha.status === "active") {
      confidenceScore += 10;
      confidenceReasons.push("dasha active");
    }

    if (divisional.status === "active") {
      confidenceScore += 10;
      confidenceReasons.push("divisional active");
    }

    const strengthValues = Object.values(transit?.strength || {});
    if (strengthValues.length) {
      const avg = strengthValues.reduce((a, b) => a + Number(b || 0), 0) / strengthValues.length;
      if (avg >= 0.65) {
        confidenceScore += 10;
        confidenceReasons.push("strong planetary strength");
      } else if (avg >= 0.5) {
        confidenceScore += 5;
        confidenceReasons.push("moderate planetary strength");
      }
    }

    if (clientMode.precision_mode === "NAME_ONLY_LIVE") {
      confidenceScore = Math.min(confidenceScore, 65);
      confidenceReasons.push("name-only ceiling applied");
    }

    if (clientMode.precision_mode === "LIVE_ONLY") {
      confidenceScore = Math.min(confidenceScore, 55);
      confidenceReasons.push("universal-live-only ceiling applied");
    }

    confidenceScore = Math.max(0, Math.min(95, confidenceScore));

    const confidenceLevel =
      confidenceScore >= 75 ? "HIGH" :
      confidenceScore >= 60 ? "MEDIUM" :
      "LOW";

    const baseOutput = {
      endpoint_called: "oracle.js",
      engine_status: VERSION,
      oracle_version: VERSION,
      timestamp: new Date().toISOString(),

      client_mode: clientMode,

      authority: transit?.authority || null,
      freshness: transit?.freshness || null,
      integrity: transit?.integrity || null,
      location_used: transit?.location_used || null,

      panchanga: transit?.panchanga || null,
      ascendant: transit?.ascendant || null,
      houses: transit?.houses || null,
      kp_cusps: kpCusps,

      planets,
      aspects_summary: safeArray(transit?.aspects).slice(0, 40),
      strength: transit?.strength || null,

      dasha,
      divisional,

      raw_micro: {
        transit_micro_window: transit?.micro_window || null,
        transit_micro_status: transit?.micro_status || null,
        transit_micro_convergence: transit?.micro_convergence || null,
        transit_micro_dominant_trigger: transit?.micro_dominant_trigger || null,
        transit_micro_clusters: transit?.micro_clusters || [],
        multi_snapshot_summary: {
          active_trigger_snapshots: multi?.active_trigger_snapshots || 0,
          convergence_strength: multi?.convergence_strength || "low",
          cluster_density: multi?.cluster_density || null,
          dominant_trigger_identity: multi?.dominant_trigger_identity || null,
          micro_dominant_trigger: multi?.micro_dominant_trigger || null
        }
      },

      timing_evidence: {
        trigger_present: triggerPresent,
        precision_allowed: precisionAllowed,
        dominant_trigger_identity: dominantTriggerIdentity,
        exact_time_candidate_utc: exactTimeCandidate,
        exact_date_candidate_utc: exactTimeCandidate ? exactTimeCandidate.split("T")[0] : null,
        convergence_strength: convergenceStrength,
        cluster_density: clusterDensity,
        active_trigger_snapshots: activeTriggerSnapshots,
        time_window: {
          start_utc: transit?.micro_dominant_trigger?.cluster_start_utc || null,
          end_utc: transit?.micro_dominant_trigger?.cluster_end_utc || null
        },
        timing_grade: triggerPresent && exactTimeCandidate ? "EXACT_LOCK" : "WINDOW_OR_PREDICTIVE",
        timing_source: triggerPresent && exactTimeCandidate ? "present_trigger" : "future_or_window"
      },

      timing_decision: {
        mode: triggerPresent && exactTimeCandidate ? "exact_candidate" : "window_only",
        exact_time_candidate_utc: exactTimeCandidate,
        exact_date_candidate_utc: exactTimeCandidate ? exactTimeCandidate.split("T")[0] : null,
        time_window_start_utc: transit?.micro_dominant_trigger?.cluster_start_utc || null,
        time_window_end_utc: transit?.micro_dominant_trigger?.cluster_end_utc || null,
        reason:
          triggerPresent && exactTimeCandidate
            ? "minute candidate supported by trigger and convergence"
            : "exact minute not fully unlocked; defended window mode active"
      },

      confidence: {
        confidence_score: confidenceScore,
        confidence_level: confidenceLevel,
        confidence_reasons: confidenceReasons
      }
    };

    const predictivePacket = predictiveSmartMode(baseOutput);

    const triggerScan = fullTriggerScan(predictivePacket);
    const threeDay = buildThreeDayPhaseMap(triggerScan, predictivePacket.timing_evidence);

    const questionDomain = classifyQuestionDomain(clientMode.input_context.question);
    const domainHint = scoreDomains({
      aspects: predictivePacket.aspects_summary,
      kp: predictivePacket.kp_cusps,
      questionDomain,
      clientMode
    });

    domainHint.trigger_family =
      predictivePacket.timing_evidence?.dominant_trigger_identity ||
      triggerScan?.dominant_trigger?.kind ||
      "unknown_trigger_family";

    domainHint.kp_status = kpCusps ? "KP_VALIDATION_ACTIVE_OR_DOMAIN_SUPPORTED" : "KP_ABSENT";
    domainHint.kp_validation_applied = Boolean(kpCusps);

    const eventDNA = buildEventDNA(domainHint.dominant_domain);

    const gates = buildGates({
      clientMode,
      transit: predictivePacket,
      timing: predictivePacket.timing_evidence,
      confidence: predictivePacket.confidence,
      domainHint
    });

    const eliteScore = buildEliteScore({
      clientMode,
      timing: predictivePacket.timing_evidence,
      confidence: predictivePacket.confidence,
      transit: predictivePacket,
      domainHint
    });

    const interpretation = buildInterpretation(
      domainHint.dominant_domain,
      predictivePacket.timing_evidence,
      predictivePacket.predictive_smart_mode
    );

    const remedySupport = buildRemedySupport({
      domain: domainHint.dominant_domain,
      interpretation,
      gates
    });

    const verdict = buildVerdict({
      timing: predictivePacket.timing_evidence,
      predictive: predictivePacket.predictive_smart_mode,
      domainHint,
      gates
    });

    const compliance = buildCompliance({
      transit: predictivePacket,
      gates,
      domainHint,
      interpretation,
      threeDay
    });

    const uhapCourtroomPacket = {
      query_intent_class: "EVENT_OR_RAW_TRANSIT_SCAN",
      dominant_executable_event: domainHint.dominant_domain,
      non_executable_residue: "SUPPRESSED_OR_NONE",

      event_dna: eventDNA,

      legal_gates: gates,

      causal_chain: {
        cause_chain_status: gates.execution_gate === "ACTIVE" ? "COMPLETE" : "PARTIAL_FORMING",
        cause: domainHint.trigger_family,
        trigger: predictivePacket.timing_evidence?.dominant_trigger_identity || "NO_ACTIVE_MICRO_TRIGGER",
        mechanism: interpretation.future_tone,
        route: interpretation.future_channel,
        outcome: verdict.event_state
      },

      precision_law: {
        exact_time_permission_ladder: gates.precision_gate,
        micro_trigger_zero_law:
          gates.micro_trigger_status === "ZERO_OR_INACTIVE" ? "ACTIVE_DOWNGRADE" : "NOT_ACTIVE",
        name_only_precision_mode: gates.name_only_precision_status,
        universal_precision_mode: gates.universal_precision_status,
        dasha_fallback_restriction: gates.dasha_precision_status,
        confidence_band: gates.confidence_band
      },

      elite_scoring_matrix: eliteScore,

      probability_collapse: {
        probability_collapse_result:
          verdict.outcome === "EXACT" ? "DIRECT_EXECUTION" :
          verdict.outcome === "PREDICTIVE" ? "DELAYED_EXECUTION" :
          "NO_LAWFUL_EXACT_RELEASE_IN_CURRENT_WINDOW",
        dominant_executable_path: interpretation.future_channel,
        secondary_path_status: "SUPPRESSED_IN_FINAL_VERDICT"
      },

      final_verdict_lock: {
        signal_reduction_result: verdict.outcome,
        winning_signal_class: verdict.event_state,
        suppressed_signal_class: "LOWER_RANKED_SIGNALS_SUPPRESSED",
        final_freeze_state: "LOCKED_FOR_THIS_PACKET"
      }
    };

    const finalOutput = {
      ...predictivePacket,

      engine_status: VERSION,
      oracle_version: VERSION,

      trigger_scan: triggerScan,
      three_day_phase_map: threeDay,
      domain_hint: domainHint,
      event_interpretation: interpretation,
      oracle_verdict: verdict,
      remedy_decision_support: remedySupport,
      compliance_block: compliance,
      uhap_courtroom_packet: uhapCourtroomPacket,

      oracle_mode:
        clientMode.precision_mode === "FULL_BIRTH_LIVE"
          ? "UNIVERSAL_LIVE_FULL_BIRTH_UHAP_ELITE_PACKET"
          : clientMode.precision_mode === "NAME_ONLY_LIVE"
          ? "UNIVERSAL_LIVE_NAME_ONLY_UHAP_ELITE_PACKET"
          : "UNIVERSAL_LIVE_ONLY_UHAP_ELITE_PACKET",

      system_status: "OK"
    };

    if (finalOutput.predictive_smart_mode) {
      finalOutput.predictive_smart_mode.predictive_status =
        finalOutput.predictive_smart_mode?.best_future_candidate
          ? "FUTURE_TRIGGER_LIVE"
          : "BYPASS_OR_INACTIVE";

      finalOutput.predictive_smart_mode.predictive_priority =
        finalOutput.timing_evidence?.trigger_present === true
          ? "SECONDARY_TO_PRESENT_EXACT"
          : "PRIMARY_FUTURE_SUPPORT";
    }

    return res.status(200).json(finalOutput);
  } catch (error) {
    return res.status(500).json({
      endpoint_called: "oracle.js",
      engine_status: VERSION,
      system_status: "ORACLE_FAILED",
      error: error.message || "unknown_oracle_error"
    });
  }
}