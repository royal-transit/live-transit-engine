import { predictiveSmartMode } from "./predictiveSmartMode.js";

const VERSION = "SMART_ORACLE_ELITE_UNIVERSAL_LIVE_V10_FULL_REPLACEMENT";

function toTimestamp(value) {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

function safeString(v, fb = "") {
  return typeof v === "string" ? v.trim() : fb;
}

function safeNumber(v, fb = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function normalizeName(name) {
  return safeString(name).toLowerCase();
}

function detectSubjectMode(query = {}) {
  const name = safeString(query?.name || query?.subject_name || "");
  const birthDateTime = safeString(query?.birth_datetime || "");
  const dob = safeString(query?.dob || "");
  const tob = safeString(query?.tob || "");
  const pob = safeString(query?.pob || "");

  const hasName = Boolean(name);
  const hasBirthDateTime = Boolean(birthDateTime);
  const hasFullParts = Boolean(dob && tob && pob);

  if (hasName && (hasBirthDateTime || hasFullParts)) {
    return {
      subject_mode: "NAME_FULL_DETAIL_LIVE",
      identity_depth: "LEVEL_5_FULL_BIRTH_LIVE",
      precision_mode: "FULL_BIRTH_LIVE",
      name
    };
  }

  if (hasBirthDateTime || hasFullParts) {
    return {
      subject_mode: "FULL_DETAIL_LIVE",
      identity_depth: "LEVEL_5_FULL_BIRTH_LIVE",
      precision_mode: "FULL_BIRTH_LIVE",
      name: name || null
    };
  }

  if (hasName) {
    return {
      subject_mode: "NAME_ONLY_LIVE",
      identity_depth: "LEVEL_2_NAME_ONLY_LIVE",
      precision_mode: "NAME_ONLY_LIVE",
      name
    };
  }

  return {
    subject_mode: "UNIVERSAL_LIVE_ONLY",
    identity_depth: "LEVEL_1_UNIVERSAL_LIVE",
    precision_mode: "LIVE_ONLY",
    name: null
  };
}

function buildBirthDateTimeFromParts(query = {}) {
  if (query?.birth_datetime) return safeString(query.birth_datetime);

  const dob = safeString(query?.dob || "");
  const tob = safeString(query?.tob || "00:00");
  const timezoneOffset = safeString(query?.timezone_offset || "+00:00");

  if (!dob) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    return `${dob}T${tob.length === 5 ? `${tob}:00` : tob}${timezoneOffset}`;
  }

  const m = dob.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}T${tob.length === 5 ? `${tob}:00` : tob}${timezoneOffset}`;
  }

  return null;
}

function cloneTriggerCandidate(candidate, source, bucket) {
  if (!candidate || typeof candidate !== "object") return null;
  return { ...candidate, source, bucket };
}

function bucketByTimeDiffHours(hoursAhead) {
  if (hoursAhead === null || hoursAhead === undefined) return "discarded_weak_triggers";
  if (hoursAhead <= 0.5) return "current_active_triggers";
  if (hoursAhead <= 24) return "next_24h_triggers";
  if (hoursAhead <= 72) return "next_72h_triggers";
  return "discarded_weak_triggers";
}

function buildCandidateFingerprint(candidate) {
  if (!candidate || typeof candidate !== "object") return "unknown_candidate";

  const kind = candidate.kind || candidate.type || "unknown_kind";
  const time =
    candidate.predicted_time_utc ||
    candidate.exact_time_utc ||
    candidate.peak_time_utc ||
    "no_time";

  const sourcePair =
    candidate?.details?.pair ||
    candidate?.details?.dominant_trigger_identity ||
    candidate?.details?.next_event ||
    candidate?.reason ||
    candidate?.type ||
    "no_detail";

  return `${kind}|${time}|${sourcePair}`;
}

function dedupeCandidates(list) {
  const seen = new Set();
  const out = [];

  for (const item of safeArray(list)) {
    const fp = buildCandidateFingerprint(item);
    if (!seen.has(fp)) {
      seen.add(fp);
      out.push(item);
    }
  }

  return out;
}

function sortCandidates(list) {
  return [...safeArray(list)].sort((a, b) => {
    const strengthDiff = safeNumber(b?.strength_score || b?.peak_strength) - safeNumber(a?.strength_score || a?.peak_strength);
    if (strengthDiff !== 0) return strengthDiff;

    const ta = toTimestamp(a?.predicted_time_utc || a?.exact_time_utc || a?.peak_time_utc);
    const tb = toTimestamp(b?.predicted_time_utc || b?.exact_time_utc || b?.peak_time_utc);

    if (ta === null && tb === null) return 0;
    if (ta === null) return 1;
    if (tb === null) return -1;
    return ta - tb;
  });
}

function pushRankedTrigger(triggers, candidate, source, hoursAhead = null) {
  if (!candidate) return;

  const strength = safeNumber(candidate.strength_score || candidate.peak_strength, 0);
  let bucket = bucketByTimeDiffHours(hoursAhead);

  if (strength >= 0.8 && bucket === "next_24h_triggers") bucket = "current_active_triggers";
  else if (strength >= 0.6 && bucket === "next_72h_triggers") bucket = "next_24h_triggers";
  else if (strength < 0.35) bucket = "discarded_weak_triggers";

  const enriched = cloneTriggerCandidate(candidate, source, bucket);
  if (enriched) triggers[bucket].push(enriched);
}

function buildLiveCurrentTrigger(snapshot) {
  const timing = snapshot?.timing_evidence || {};
  if (!timing?.trigger_present || !timing?.dominant_trigger_identity) return null;

  return {
    kind: "live_current_trigger",
    predicted_time_utc: timing?.exact_time_candidate_utc || snapshot?.timestamp || null,
    confidence: "HIGH",
    strength_score: 0.95,
    reason: `Current dominant trigger already live: ${timing.dominant_trigger_identity}`,
    details: {
      dominant_trigger_identity: timing.dominant_trigger_identity,
      timing_grade: timing.timing_grade || null,
      timing_source: timing.timing_source || null
    }
  };
}

function fullTriggerScan(snapshot) {
  const triggers = {
    current_active_triggers: [],
    next_24h_triggers: [],
    next_72h_triggers: [],
    dominant_trigger: null,
    secondary_trigger: null,
    discarded_weak_triggers: []
  };

  const modules = snapshot?.predictive_smart_mode?.modules || {};
  const predictive = snapshot?.predictive_smart_mode || {};
  const scanBaseTs =
    toTimestamp(snapshot?.timestamp) ||
    toTimestamp(snapshot?.freshness?.generated_at) ||
    Date.now();

  const liveCurrent = buildLiveCurrentTrigger(snapshot);
  if (liveCurrent) {
    triggers.current_active_triggers.push(
      cloneTriggerCandidate(liveCurrent, "timing_evidence", "current_active_triggers")
    );
  }

  if (predictive?.best_future_candidate?.predicted_time_utc) {
    const ts = toTimestamp(predictive.best_future_candidate.predicted_time_utc);
    pushRankedTrigger(
      triggers,
      predictive.best_future_candidate,
      "predictive_smart_mode.best_future_candidate",
      ts !== null ? (ts - scanBaseTs) / 3600000 : null
    );
  }

  if (modules.aspect_approach_timing) {
    Object.entries(modules.aspect_approach_timing).forEach(([key, mod]) => {
      if (mod?.candidate?.predicted_time_utc) {
        const ts = toTimestamp(mod.candidate.predicted_time_utc);
        pushRankedTrigger(
          triggers,
          { ...mod.candidate, details: { ...(mod.candidate.details || {}), module_key: key } },
          `aspect_approach_timing.${key}`,
          ts !== null ? (ts - scanBaseTs) / 3600000 : null
        );
      }
    });
  }

  if (Array.isArray(modules.nakshatra_boundary_trigger?.candidates)) {
    modules.nakshatra_boundary_trigger.candidates.forEach((candidate, idx) => {
      const ts = toTimestamp(candidate?.predicted_time_utc);
      pushRankedTrigger(
        triggers,
        { ...candidate, details: { ...(candidate.details || {}), candidate_index: idx } },
        "nakshatra_boundary_trigger",
        ts !== null ? (ts - scanBaseTs) / 3600000 : null
      );
    });
  }

  if (modules.multi_snapshot_predictive_merge?.candidate?.predicted_time_utc) {
    const candidate = modules.multi_snapshot_predictive_merge.candidate;
    const ts = toTimestamp(candidate.predicted_time_utc);
    pushRankedTrigger(
      triggers,
      candidate,
      "multi_snapshot_predictive_merge",
      ts !== null ? (ts - scanBaseTs) / 3600000 : null
    );
  }

  triggers.current_active_triggers = sortCandidates(dedupeCandidates(triggers.current_active_triggers));
  triggers.next_24h_triggers = sortCandidates(dedupeCandidates(triggers.next_24h_triggers));
  triggers.next_72h_triggers = sortCandidates(dedupeCandidates(triggers.next_72h_triggers));
  triggers.discarded_weak_triggers = sortCandidates(dedupeCandidates(triggers.discarded_weak_triggers));

  const allStrong = sortCandidates(
    dedupeCandidates([
      ...triggers.current_active_triggers,
      ...triggers.next_24h_triggers,
      ...triggers.next_72h_triggers
    ])
  );

  triggers.dominant_trigger = allStrong[0] || null;
  const dominantFp = buildCandidateFingerprint(triggers.dominant_trigger);
  triggers.secondary_trigger =
    allStrong.find((item) => buildCandidateFingerprint(item) !== dominantFp) || null;

  return triggers;
}

function pickFirstUnique(candidates, usedFingerprints) {
  for (const item of safeArray(candidates)) {
    const fp = buildCandidateFingerprint(item);
    if (!usedFingerprints.has(fp)) {
      usedFingerprints.add(fp);
      return item;
    }
  }
  return null;
}

function buildThreeDayPhaseMap(data) {
  const scan = data?.trigger_scan || {};
  const timing = data?.timing_evidence || {};
  const used = new Set();

  const day1Primary =
    pickFirstUnique(
      [
        ...(scan?.current_active_triggers || []),
        ...(scan?.next_24h_triggers || []),
        ...(scan?.next_72h_triggers || []),
        ...(scan?.dominant_trigger ? [scan.dominant_trigger] : [])
      ],
      used
    ) || null;

  const day2Primary =
    pickFirstUnique(
      [
        ...(scan?.next_24h_triggers || []),
        ...(scan?.next_72h_triggers || []),
        ...(scan?.secondary_trigger ? [scan.secondary_trigger] : [])
      ],
      used
    ) || null;

  const day3Primary =
    pickFirstUnique(
      [
        ...(scan?.next_72h_triggers || []),
        ...(scan?.discarded_weak_triggers || [])
      ],
      used
    ) || null;

  return {
    day_1: {
      phase: timing?.trigger_present ? "activation_or_live_peak" : "immediate_build_or_first_gate",
      primary_trigger: day1Primary
    },
    day_2: {
      phase: "secondary_shift_or_followup",
      primary_trigger: day2Primary
    },
    day_3: {
      phase: "continuation_turn_or_manifestation_fade",
      primary_trigger: day3Primary
    }
  };
}

function normalizeDomainScoreMap() {
  return {
    money: 0,
    communication: 0,
    authority: 0,
    relationship: 0,
    conflict: 0,
    movement: 0,
    support: 0,
    spiritual: 0,
    legal: 0,
    health: 0,
    career: 0,
    business: 0,
    protection: 0
  };
}

function addWeight(map, key, weight) {
  if (!Object.prototype.hasOwnProperty.call(map, key)) return;
  map[key] += weight;
}

function aspectExists(aspects, a, b) {
  return safeArray(aspects).some(
    (x) => (x.planet1 === a && x.planet2 === b) || (x.planet1 === b && x.planet2 === a)
  );
}

function classifyTriggerDomains(data) {
  const aspects = safeArray(data?.aspects_summary);
  const timing = data?.timing_evidence || {};
  const triggerScan = data?.trigger_scan || {};
  const predictive = data?.predictive_smart_mode || {};
  const scores = normalizeDomainScoreMap();

  const dominantTrigger =
    timing?.dominant_trigger_identity ||
    triggerScan?.dominant_trigger?.details?.dominant_trigger_identity ||
    triggerScan?.dominant_trigger?.kind ||
    null;

  const futureCandidate = predictive?.best_future_candidate || null;

  if (["moon_degree_lock", "moon_nakshatra_entry", "moon_pada_entry"].includes(dominantTrigger)) {
    addWeight(scores, "relationship", 3);
    addWeight(scores, "movement", 3);
    addWeight(scores, "communication", 2);
    addWeight(scores, "spiritual", 1);
  }

  if (dominantTrigger === "moon_mars_square") {
    addWeight(scores, "conflict", 4);
    addWeight(scores, "protection", 3);
    addWeight(scores, "movement", 2);
  }

  if (dominantTrigger === "rahu_mercury_conjunction") {
    addWeight(scores, "communication", 4);
    addWeight(scores, "business", 3);
    addWeight(scores, "money", 2);
    addWeight(scores, "legal", 1);
  }

  if (dominantTrigger === "sun_saturn_conjunction") {
    addWeight(scores, "authority", 4);
    addWeight(scores, "career", 2);
    addWeight(scores, "legal", 2);
    addWeight(scores, "conflict", 1);
  }

  if (aspectExists(aspects, "Mercury", "Rahu")) {
    addWeight(scores, "communication", 3);
    addWeight(scores, "business", 2);
    addWeight(scores, "money", 1);
  }

  if (aspectExists(aspects, "Moon", "Mars")) {
    addWeight(scores, "conflict", 3);
    addWeight(scores, "protection", 2);
    addWeight(scores, "movement", 2);
  }

  if (aspectExists(aspects, "Sun", "Saturn")) {
    addWeight(scores, "authority", 3);
    addWeight(scores, "career", 2);
    addWeight(scores, "legal", 1);
  }

  if (aspectExists(aspects, "Venus", "Jupiter")) {
    addWeight(scores, "support", 3);
    addWeight(scores, "relationship", 2);
    addWeight(scores, "money", 1);
  }

  const futurePair = futureCandidate?.details?.pair || "";
  if (typeof futurePair === "string") {
    if (futurePair.includes("Mercury")) addWeight(scores, "communication", 2);
    if (futurePair.includes("Rahu")) addWeight(scores, "communication", 1);
    if (futurePair.includes("Mars")) addWeight(scores, "conflict", 2);
    if (futurePair.includes("Moon")) addWeight(scores, "relationship", 1);
    if (futurePair.includes("Sun") || futurePair.includes("Saturn")) addWeight(scores, "authority", 1);
    if (futurePair.includes("Venus") || futurePair.includes("Jupiter")) addWeight(scores, "support", 1);
  }

  const kp = data?.kp_cusps || {};
  const isActive = (cusp) => Boolean(cusp && cusp.sub_lord);

  if (isActive(kp["7"]) || isActive(kp["5"])) addWeight(scores, "relationship", 1);
  if (isActive(kp["3"])) addWeight(scores, "communication", 1);
  if (isActive(kp["2"]) || isActive(kp["10"]) || isActive(kp["11"])) addWeight(scores, "money", 1);
  if (isActive(kp["9"]) || isActive(kp["12"])) addWeight(scores, "spiritual", 1);
  if (isActive(kp["6"]) || isActive(kp["8"])) {
    addWeight(scores, "conflict", 1);
    addWeight(scores, "protection", 1);
    addWeight(scores, "health", 1);
  }

  const rankedDomains = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .filter(([, value]) => value > 0)
    .map(([domain, value]) => ({ domain, score: value }));

  return {
    dominant_domain: rankedDomains[0]?.domain || "general",
    secondary_domain: rankedDomains[1]?.domain || null,
    ranked_domains: rankedDomains,
    trigger_family: dominantTrigger || "unknown_trigger_family",
    kp_status: rankedDomains.length ? "KP_VALIDATION_ACTIVE_OR_DOMAIN_SUPPORTED" : "KP_VALIDATION_INACTIVE",
    kp_validation_applied: rankedDomains.length > 0
  };
}

function buildDomainNarrative(domain, mode = "future") {
  const copy = {
    money: {
      present: "Money, payment, value, order, release, or financial pressure is active now.",
      future: "A money-linked event may form through payment, order, release, pricing, deal-value, or income movement."
    },
    communication: {
      present: "Message, reply, call, negotiation, document, or contact pressure is active now.",
      future: "A communication-linked event may form through reply, proposal, deal-talk, document, message, or customer contact."
    },
    authority: {
      present: "Authority, duty, rule, delay, responsibility, or formal pressure is active now.",
      future: "An authority-linked development may form through approval, duty, formal contact, review, delay, or responsibility."
    },
    relationship: {
      present: "Emotional response, human closeness, attention, contact, or relational movement is active now.",
      future: "A relationship-linked development may unfold through contact, emotional movement, closeness, response, or renewed attention."
    },
    conflict: {
      present: "Friction, irritation, confrontation, pressure, or reactive heat is active now.",
      future: "A conflict-linked development may emerge through disagreement, pressure, sharp reaction, argument, or urgent movement."
    },
    movement: {
      present: "Movement, travel, dispatch, transition, delivery, or active shift is building now.",
      future: "A movement-linked event may unfold through travel, dispatch, relocation, delivery, fast response, or situational change."
    },
    support: {
      present: "Support, help, easing, cooperation, opening, or protective alignment is active now.",
      future: "A support-linked development may form through help, alliance, opportunity, easing, or beneficial alignment."
    },
    spiritual: {
      present: "Inner sensitivity, intuition, reflection, unseen pressure, or spiritual receptivity is active now.",
      future: "A spiritually-toned development may unfold through reflection, subtle response, intuition, or inner opening."
    },
    legal: {
      present: "Paperwork, rule, penalty, appeal, official check, or compliance pressure is active now.",
      future: "A legal or document-linked development may form through official contact, record, appeal, penalty, or compliance route."
    },
    health: {
      present: "Body pressure, stress, fatigue, inflammation, or routine correction signal is active now.",
      future: "A health-linked signal may form through stress, fatigue, inflammation, rest need, or body-warning pattern."
    },
    career: {
      present: "Work, role, duty, public output, application, or authority structure is active now.",
      future: "A career-linked development may form through work response, role pressure, authority contact, interview, or duty shift."
    },
    business: {
      present: "Trade, customer, order, negotiation, pricing, or deal-flow is active now.",
      future: "A business-linked development may form through order, client contact, pricing, negotiation, payment path, or deal movement."
    },
    protection: {
      present: "Protection, caution, conflict control, accident avoidance, or defensive awareness is active now.",
      future: "A protection-linked action may be needed through careful movement, conflict avoidance, vehicle caution, or energy clearing."
    },
    general: {
      present: "A general event-field is active, but not sharply narrowed to one domain.",
      future: "A general future event is forming, but the domain is not yet sharply narrowed."
    }
  };

  return copy[domain]?.[mode] || copy.general[mode];
}

function buildFutureToneFromDomain(domain, dominantTrigger) {
  if (["rahu_mercury_conjunction", "aspect_approach_timing", "multi_snapshot_predictive_merge"].includes(dominantTrigger)) {
    return "message / negotiation / paperwork / money-link";
  }
  if (["moon_degree_lock", "moon_nakshatra_entry", "moon_pada_entry"].includes(dominantTrigger)) {
    return "fresh / responsive / immediate";
  }
  if (dominantTrigger === "moon_mars_square") return "heated / urgent / reactive";
  if (dominantTrigger === "sun_saturn_conjunction") return "formal / pressured / duty-bound";

  const map = {
    money: "release / gain / value movement",
    communication: "message / reply / paperwork movement",
    authority: "formal / delayed / duty-weighted",
    relationship: "responsive / emotional / contact-opening",
    conflict: "heated / sharp / pressurised",
    movement: "active / shifting / fast-paced",
    support: "easing / helpful / aligned",
    spiritual: "subtle / inward / intuitive",
    legal: "formal / document-heavy / compliance-linked",
    health: "corrective / cautionary / body-signal",
    career: "duty / work / authority-linked",
    business: "deal / customer / payment-linked",
    protection: "cautious / defensive / cleansing-needed",
    general: "developing / transitional / mixed"
  };

  return map[domain] || map.general;
}

function buildFutureChannelFromDomain(domain, dominantTrigger) {
  if (["rahu_mercury_conjunction", "aspect_approach_timing", "multi_snapshot_predictive_merge"].includes(dominantTrigger)) {
    return "communication / deal / paperwork / reply";
  }
  if (["moon_degree_lock", "moon_nakshatra_entry", "moon_pada_entry"].includes(dominantTrigger)) {
    return "emotion / opening / movement / contact";
  }
  if (dominantTrigger === "moon_mars_square") return "emotion / confrontation / sudden action";
  if (dominantTrigger === "sun_saturn_conjunction") return "authority / structure / responsibility";

  const map = {
    money: "money / payment / release / value",
    communication: "communication / deal / paperwork / reply",
    authority: "authority / structure / duty / approval",
    relationship: "emotion / response / contact / closeness",
    conflict: "pressure / argument / confrontation / friction",
    movement: "movement / travel / dispatch / shift",
    support: "support / alliance / help / opportunity",
    spiritual: "inner field / intuition / reflection",
    legal: "legal / paperwork / official route / compliance",
    health: "health / body / stress / routine correction",
    career: "career / work / application / role",
    business: "business / customer / order / payment",
    protection: "protection / caution / vehicle / cleansing",
    general: "general life field"
  };

  return map[domain] || map.general;
}

function getDomainScore(domainHint, name) {
  const found = safeArray(domainHint?.ranked_domains).find((item) => item.domain === name);
  return found?.score || 0;
}

function buildCommunicationMoneyOverlay(domainHint) {
  const dominantDomain = domainHint?.dominant_domain || "general";
  const moneyScore = getDomainScore(domainHint, "money");
  const businessScore = getDomainScore(domainHint, "business");
  const communicationScore = getDomainScore(domainHint, "communication");

  if (dominantDomain !== "communication") return null;
  if (communicationScore <= 0) return null;
  if (moneyScore <= 0 && businessScore <= 0) return null;

  return {
    present:
      "Communication is active through message pressure, customer response, negotiation, order-talk, contact, or paperwork movement with money/business relevance underneath.",
    future:
      "A communication-linked event may form through message, reply, proposal, deal-talk, customer contact, order activity, or paperwork that can lead toward payment or money release.",
    channel: "communication / order / deal / paperwork / payment path",
    tone: "message / negotiation / paperwork / money-link"
  };
}

function buildEventInterpretation(data) {
  const aspects = safeArray(data?.aspects_summary);
  const timing = data?.timing_evidence || {};
  const predictive = data?.predictive_smart_mode || {};
  const triggerScan = data?.trigger_scan || {};
  const domainHint = data?.domain_hint || {};
  const dasha = data?.dasha || {};
  const divisional = data?.divisional || {};

  let pastPattern = "Similar event-family may have repeated before under related live-transit trigger structure.";
  let presentManifestation = "Background phase with no dominant lived event fully breaking through.";
  let futureEventNature = "No strong future event nature isolated yet.";
  let futureChannel = "general";
  let futureTone = "neutral";

  const dominantTrigger =
    timing?.dominant_trigger_identity ||
    triggerScan?.dominant_trigger?.details?.dominant_trigger_identity ||
    triggerScan?.dominant_trigger?.kind ||
    null;

  const dominantDomain = domainHint?.dominant_domain || "general";
  const overlay = buildCommunicationMoneyOverlay(domainHint);

  if (overlay) {
    presentManifestation = overlay.present;
    futureEventNature = overlay.future;
    futureChannel = overlay.channel;
    futureTone = overlay.tone;
    pastPattern = "Similar pattern may have unfolded before through message, customer, order, document, deal-flow, or money-release route.";
  } else if (dominantTrigger || predictive?.best_future_candidate?.predicted_time_utc) {
    presentManifestation = buildDomainNarrative(dominantDomain, "present");
    futureEventNature = `${buildDomainNarrative(dominantDomain, "future")} The projected trigger is building toward activation.`;
    futureChannel = buildFutureChannelFromDomain(dominantDomain, dominantTrigger);
    futureTone = buildFutureToneFromDomain(dominantDomain, dominantTrigger);
    pastPattern = `Similar pattern may have unfolded before in the ${dominantDomain} domain when related trigger structure matured.`;
  } else {
    if (aspectExists(aspects, "Mercury", "Rahu")) {
      presentManifestation = buildDomainNarrative("communication", "present");
      futureEventNature = buildDomainNarrative("communication", "future");
      futureChannel = "communication / deal / paperwork";
      futureTone = "message / negotiation / paperwork movement";
    }
    if (aspectExists(aspects, "Moon", "Mars")) {
      presentManifestation = buildDomainNarrative("conflict", "present");
      futureEventNature = buildDomainNarrative("conflict", "future");
      futureChannel = "emotion / conflict / movement";
      futureTone = "heated / urgent / reactive";
    }
    if (aspectExists(aspects, "Sun", "Saturn")) {
      presentManifestation = buildDomainNarrative("authority", "present");
      futureEventNature = buildDomainNarrative("authority", "future");
      futureChannel = "authority / duty / public pressure";
      futureTone = "formal / pressured / duty-bound";
    }
    if (aspectExists(aspects, "Venus", "Jupiter")) {
      presentManifestation = buildDomainNarrative("support", "present");
      futureEventNature = buildDomainNarrative("support", "future");
      futureChannel = "support / alliance / opportunity";
      futureTone = "easing / helpful / aligned";
    }
  }

  if (timing.trigger_present === true && dominantTrigger) {
    futureEventNature = `${futureEventNature} Present trigger is already live through ${dominantTrigger}.`;
  }

  if (dasha?.status === "active" && divisional?.status === "active") {
    pastPattern = `${pastPattern} Natal timing permission is open, so event selection is stronger.`;
  }

  return {
    past_pattern: pastPattern,
    present_manifestation: presentManifestation,
    future_event_nature: futureEventNature,
    future_channel: futureChannel,
    future_tone: futureTone,
    interpretation_source: dominantTrigger ? "dominant_trigger_lock" : "aspect_domain_fallback"
  };
}

function buildConfidenceEnhanced(baseConfidence, data) {
  const timing = data?.timing_evidence || {};
  const predictive = data?.predictive_smart_mode || {};
  const score = safeNumber(baseConfidence?.confidence_score, 0);

  let confidenceClass = "MODERATE";
  let confidenceWarning = null;

  if (timing.trigger_present === true && timing.exact_time_candidate_utc && score >= 75) {
    confidenceClass = "TIMING_STRONG_EVENT_STRONG";
  } else if (predictive?.best_future_candidate?.predicted_time_utc && score >= 60) {
    confidenceClass = "PREDICTIVE_STRONG";
    confidenceWarning = "Future-based projection is active; confirm against live trigger if decision is critical.";
  } else if (timing.trigger_present === false && score < 60) {
    confidenceClass = "LOW_CONVERGENCE";
    confidenceWarning = "Present timing support is weak; use window mode.";
  }

  return {
    ...baseConfidence,
    confidence_class: confidenceClass,
    confidence_warning: confidenceWarning
  };
}

function buildOracleVerdict(data) {
  const timing = data?.timing_evidence || {};
  const decision = data?.timing_decision || {};
  const predictive = data?.predictive_smart_mode || {};
  const domainHint = data?.domain_hint || {};

  if (timing.trigger_present === true && decision?.exact_time_candidate_utc) {
    return {
      outcome: "EXACT",
      event_state: "ACTIVE_TRIGGER",
      best_actionable_time_utc: decision.exact_time_candidate_utc,
      best_actionable_mode: "PRESENT_TRIGGER",
      dominant_domain: domainHint?.dominant_domain || "general",
      secondary_domain: domainHint?.secondary_domain || null,
      kp_status: domainHint?.kp_status || "UNKNOWN"
    };
  }

  if (predictive?.best_future_candidate?.predicted_time_utc) {
    return {
      outcome: "PREDICTIVE",
      event_state: "FUTURE_TRIGGER",
      best_actionable_time_utc: predictive.best_future_candidate.predicted_time_utc,
      best_actionable_mode: "PREDICTIVE",
      dominant_domain: domainHint?.dominant_domain || "general",
      secondary_domain: domainHint?.secondary_domain || null,
      kp_status: domainHint?.kp_status || "UNKNOWN"
    };
  }

  return {
    outcome: "WINDOW",
    event_state: "LOW_ACTIVITY",
    best_actionable_time_utc: null,
    best_actionable_mode: "WAIT_OR_GENERAL_WINDOW",
    dominant_domain: domainHint?.dominant_domain || "general",
    secondary_domain: domainHint?.secondary_domain || null,
    kp_status: domainHint?.kp_status || "UNKNOWN"
  };
}

function buildRemedyDecisionSupport(data) {
  const verdict = data?.oracle_verdict || {};
  const domain = verdict?.dominant_domain || data?.domain_hint?.dominant_domain || "general";
  const tone = data?.event_interpretation?.future_tone || "mixed";
  const channel = data?.event_interpretation?.future_channel || "general";
  const confidence = data?.confidence?.confidence_level || "LOW";

  return {
    remedy_picker_ready: true,
    dominant_domain: domain,
    remedy_channel: channel,
    remedy_tone: tone,
    confidence_gate: confidence,
    recommended_remedy_style:
      domain === "protection" || domain === "conflict"
        ? "PROTECTION_COOLING_AND_CONTROL"
        : domain === "money" || domain === "business"
          ? "MONEY_RELEASE_AND_COMMUNICATION_OPENING"
          : domain === "relationship"
            ? "EMOTIONAL_SOFTENING_AND_CONTACT_ALIGNMENT"
            : domain === "spiritual"
              ? "SPIRITUAL_GROUNDING_AND_CLEAN_RECEPTIVITY"
              : "GENERAL_STABILISATION",
    warning:
      confidence === "LOW"
        ? "Use light/general remedy only unless live trigger strengthens."
        : null
  };
}

function buildComplianceBlock(data) {
  const timing = data?.timing_evidence || {};
  const domainHint = data?.domain_hint || {};
  const interpretation = data?.event_interpretation || {};
  const confidence = data?.confidence || {};
  const threeDay = data?.three_day_phase_map || null;

  return {
    calculation_authority: {
      source: data?.authority?.source || "Swiss Ephemeris",
      ayanamsa: data?.authority?.ayanamsa || "Lahiri",
      zodiac: data?.authority?.zodiac || "Sidereal",
      integrity_status: data?.integrity?.status || "UNKNOWN",
      export_type: "ORACLE_STRUCTURED_PACKET",
      packet_grade: "ELITE_COMPLIANT"
    },
    evidence_normalisation: {
      natal_layer: data?.dasha?.status === "active" ? "AVAILABLE" : "LIMITED",
      divisional_layer: data?.divisional?.status === "active" ? "STRONG" : "WEAK",
      transit_layer: "ACTIVE",
      kp_micro_timing: timing?.precision_allowed || "WINDOW",
      kp_validation: domainHint?.kp_status || "UNKNOWN",
      convergence_strength: timing?.convergence_strength || "LOW",
      dominant_domain: domainHint?.dominant_domain || "general",
      secondary_domain: domainHint?.secondary_domain || null
    },
    execution_context: {
      context_type: domainHint?.dominant_domain || "general",
      channel_type: interpretation?.future_channel || "general",
      execution_status: timing?.trigger_present === true ? "ACTIVE" : "PENDING_TRIGGER",
      permission_status: data?.dasha?.status === "active" ? "OPEN" : "LIMITED",
      route_status: timing?.trigger_present === true ? "DIRECT" : "FORMING_ROUTE",
      manifestation_form: interpretation?.future_tone || "UNDEFINED"
    },
    fate_structure: {
      fate_gate: timing?.trigger_present === true ? "OPEN" : "FORMING",
      execution_strength: confidence?.confidence_level || "MEDIUM",
      authority_planet: timing?.dominant_trigger_identity || domainHint?.trigger_family || "UNKNOWN",
      event_radar: threeDay
    }
  };
}

function buildClientModePacket(subjectMode, query) {
  return {
    subject_mode: subjectMode.subject_mode,
    identity_depth: subjectMode.identity_depth,
    precision_mode: subjectMode.precision_mode,
    subject_name: subjectMode.name,
    normalized_name: subjectMode.name ? normalizeName(subjectMode.name) : null,
    input_context: {
      question: safeString(query?.question || ""),
      facts: safeString(query?.facts || ""),
      lat: query?.lat || null,
      lon: query?.lon || null,
      birth_datetime: query?.birth_datetime || null,
      dob: query?.dob || null,
      tob: query?.tob || null,
      pob: query?.pob || null,
      timezone_offset: query?.timezone_offset || null
    },
    usage_rule:
      subjectMode.precision_mode === "FULL_BIRTH_LIVE"
        ? "Use natal dasha/divisional/KP overlays with live transit."
        : subjectMode.precision_mode === "NAME_ONLY_LIVE"
          ? "Use name as context only; do not claim natal certainty."
          : "Use universal live transit only."
  };
}

export default async function handler(req, res) {
  try {
    const baseUrl = "https://live-transit-engine.vercel.app";
    const subjectMode = detectSubjectMode(req.query || {});
    const birthDateTime = buildBirthDateTimeFromParts(req.query || null);

    const lat = req.query?.lat || req.query?.latitude || null;
    const lon = req.query?.lon || req.query?.longitude || null;

    const params = new URLSearchParams();
    if (birthDateTime) params.set("birth_datetime", birthDateTime);
    if (lat) params.set("lat", String(lat));
    if (lon) params.set("lon", String(lon));

    const qs = params.toString();
    const transitUrl = `${baseUrl}/api/transit${qs ? `?${qs}` : ""}`;
    const multiSnapshotUrl = `${baseUrl}/api/multi-snapshot${qs ? `?${qs}` : ""}`;

    const [transitRes, multiRes] = await Promise.all([
      fetch(transitUrl),
      fetch(multiSnapshotUrl)
    ]);

    if (!transitRes.ok) throw new Error(`transit_fetch_failed_${transitRes.status}`);
    if (!multiRes.ok) throw new Error(`multi_snapshot_fetch_failed_${multiRes.status}`);

    const transit = await transitRes.json();
    const multi = await multiRes.json();

    const triggerPresent =
      transit?.micro_status?.trigger_present === true ||
      safeNumber(multi?.active_trigger_snapshots, 0) > 0;

    const precisionAllowed =
      transit?.micro_status?.precision_allowed ||
      (triggerPresent ? "minute_candidate" : "window_only");

    const dominantTriggerIdentity =
      transit?.micro_dominant_trigger?.type ||
      multi?.dominant_trigger_identity ||
      multi?.micro_dominant_trigger?.type ||
      null;

    const exactTimeCandidate =
      transit?.micro_dominant_trigger?.peak_time_utc ||
      multi?.micro_dominant_trigger?.peak_time_utc ||
      null;

    const convergenceStrength =
      multi?.convergence_strength ||
      transit?.micro_convergence?.convergence_strength ||
      "low";

    const clusterDensity =
      multi?.cluster_density ||
      transit?.micro_convergence?.cluster_density ||
      0;

    const activeTriggerSnapshots = safeNumber(multi?.active_trigger_snapshots, 0);
    const dashaStatus = transit?.dasha?.status || "absent";
    const divisionalStatus = transit?.divisional?.status || "absent";

    const timingMode =
      precisionAllowed === "minute_candidate" && exactTimeCandidate
        ? "exact_candidate"
        : "window_only";

    const exactDateCandidate = exactTimeCandidate ? exactTimeCandidate.split("T")[0] : null;

    const timeWindow = exactTimeCandidate
      ? {
          start_utc: transit?.micro_dominant_trigger?.cluster_start_utc || null,
          end_utc: transit?.micro_dominant_trigger?.cluster_end_utc || null
        }
      : { start_utc: null, end_utc: null };

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

    const kpSummary = transit?.kp_cusps || null;

    const dashaSummary =
      dashaStatus === "active"
        ? {
            status: "active",
            birth_reference: transit?.dasha?.birth_reference || null,
            mahadasha: transit?.dasha?.mahadasha || null,
            antardasha: transit?.dasha?.antardasha || null,
            pratyantar: transit?.dasha?.pratyantar || null,
            natal_timing_permission: "OPEN"
          }
        : {
            status: dashaStatus,
            required_input: transit?.dasha?.required_input || null,
            format: transit?.dasha?.format || null,
            natal_timing_permission: "CLOSED"
          };

    const divisionalSummary =
      divisionalStatus === "active"
        ? {
            status: "active",
            birth_datetime_utc: transit?.divisional?.birth_datetime_utc || null,
            available_charts: Object.keys(transit.divisional || {}).filter(
              (k) => !["status", "birth_datetime_utc"].includes(k)
            ),
            divisional_reinforcement_grade: "STRONG"
          }
        : {
            status: divisionalStatus,
            required_input: transit?.divisional?.required_input || null,
            supported: transit?.divisional?.supported || null,
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

    const convergenceNumeric = safeNumber(convergenceStrength, null);
    if (convergenceStrength === "high" || convergenceNumeric >= 0.75) {
      confidenceScore += 25;
      confidenceReasons.push("high convergence");
    } else if (convergenceStrength === "medium" || convergenceNumeric >= 0.4) {
      confidenceScore += 15;
      confidenceReasons.push("medium convergence");
    } else {
      confidenceReasons.push("low convergence");
    }

    if (activeTriggerSnapshots >= 5) {
      confidenceScore += 10;
      confidenceReasons.push("multi snapshot strong");
    }

    if (dashaStatus === "active") {
      confidenceScore += 10;
      confidenceReasons.push("dasha active");
    }

    if (divisionalStatus === "active") {
      confidenceScore += 10;
      confidenceReasons.push("divisional active");
    }

    if (transit?.strength) {
      const values = Object.values(transit.strength);
      if (values.length > 0) {
        const avgStrength =
          values.reduce((sum, val) => sum + safeNumber(val, 0), 0) / values.length;

        if (avgStrength >= 0.65) {
          confidenceScore += 10;
          confidenceReasons.push("strong planetary strength");
        } else if (avgStrength >= 0.5) {
          confidenceScore += 5;
          confidenceReasons.push("moderate planetary strength");
        }
      }
    }

    if (timingMode === "exact_candidate") {
      confidenceScore += 10;
      confidenceReasons.push("exact timing unlocked");
    }

    if (subjectMode.precision_mode === "NAME_ONLY_LIVE") {
      confidenceScore = Math.min(confidenceScore, 78);
      confidenceReasons.push("name-only ceiling applied");
    }

    if (subjectMode.precision_mode === "LIVE_ONLY") {
      confidenceScore = Math.min(confidenceScore, 72);
      confidenceReasons.push("universal-live-only ceiling applied");
    }

    confidenceScore = Math.max(0, Math.min(95, confidenceScore));

    let confidenceLevel = "LOW";
    if (confidenceScore >= 75) confidenceLevel = "HIGH";
    else if (confidenceScore >= 60) confidenceLevel = "MEDIUM";

    const baseOutput = {
      endpoint_called: "oracle.js",
      engine_status: "ORACLE_BASE_PACKET_v1",
      oracle_version: VERSION,
      timestamp: new Date().toISOString(),

      client_mode: buildClientModePacket(subjectMode, req.query || {}),

      authority: transit?.authority || null,
      freshness: transit?.freshness || null,
      integrity: transit?.integrity || null,
      location_used: transit?.location_used || null,

      panchanga: transit?.panchanga || null,
      ascendant: transit?.ascendant || null,
      houses: transit?.houses || null,
      kp_cusps: kpSummary,

      planets,
      aspects_summary: safeArray(transit?.aspects).slice(0, 30),
      strength: transit?.strength || null,

      dasha: dashaSummary,
      divisional: divisionalSummary,

      raw_micro: {
        transit_micro_window: transit?.micro_window || null,
        transit_micro_status: transit?.micro_status || null,
        transit_micro_convergence: transit?.micro_convergence || null,
        transit_micro_dominant_trigger: transit?.micro_dominant_trigger || null,
        transit_micro_clusters: safeArray(transit?.micro_clusters).slice(0, 25),
        multi_snapshot_summary: {
          active_trigger_snapshots: multi?.active_trigger_snapshots || 0,
          convergence_strength: multi?.convergence_strength || null,
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
        exact_date_candidate_utc: exactDateCandidate,
        convergence_strength: convergenceStrength,
        cluster_density: clusterDensity,
        active_trigger_snapshots: activeTriggerSnapshots,
        time_window: timeWindow,
        timing_grade: triggerPresent && exactTimeCandidate ? "EXACT_LOCK" : "WINDOW_OR_PREDICTIVE",
        timing_source: triggerPresent && exactTimeCandidate ? "present_trigger" : "future_or_window"
      },

      timing_decision: {
        mode: timingMode,
        exact_time_candidate_utc: exactTimeCandidate,
        exact_date_candidate_utc: exactDateCandidate,
        time_window_start_utc: timeWindow.start_utc,
        time_window_end_utc: timeWindow.end_utc,
        reason:
          timingMode === "exact_candidate"
            ? "minute candidate supported by trigger and convergence"
            : "exact minute not fully unlocked; defended window mode active"
      },

      confidence: {
        confidence_score: confidenceScore,
        confidence_level: confidenceLevel,
        confidence_reasons: confidenceReasons
      }
    };

    const finalOutput = predictiveSmartMode(baseOutput);

    const fullScan = fullTriggerScan(finalOutput);
    finalOutput.trigger_scan = fullScan;

    finalOutput.three_day_phase_map = buildThreeDayPhaseMap({
      ...finalOutput,
      trigger_scan: fullScan
    });

    finalOutput.domain_hint = classifyTriggerDomains({
      ...finalOutput,
      trigger_scan: fullScan
    });

    finalOutput.event_interpretation = buildEventInterpretation({
      ...finalOutput,
      trigger_scan: fullScan,
      domain_hint: finalOutput.domain_hint
    });

    finalOutput.confidence = buildConfidenceEnhanced(finalOutput.confidence, finalOutput);

    finalOutput.oracle_verdict = buildOracleVerdict({
      ...finalOutput,
      domain_hint: finalOutput.domain_hint
    });

    finalOutput.remedy_decision_support = buildRemedyDecisionSupport(finalOutput);

    finalOutput.compliance_block = buildComplianceBlock({
      ...finalOutput,
      event_interpretation: finalOutput.event_interpretation,
      domain_hint: finalOutput.domain_hint,
      three_day_phase_map: finalOutput.three_day_phase_map
    });

    if (finalOutput?.predictive_smart_mode) {
      finalOutput.predictive_smart_mode.predictive_status =
        finalOutput.predictive_smart_mode?.best_future_candidate
          ? "FUTURE_TRIGGER_LIVE"
          : "BYPASS_OR_INACTIVE";

      finalOutput.predictive_smart_mode.predictive_priority =
        finalOutput.timing_evidence?.trigger_present === true
          ? "SECONDARY_TO_PRESENT_EXACT"
          : "PRIMARY_FUTURE_SUPPORT";
    }

    finalOutput.engine_status = VERSION;
    finalOutput.oracle_mode = "UNIVERSAL_LIVE_NAME_ONLY_FULL_DETAIL_REMEDY_READY_ELITE_PACKET";
    finalOutput.system_status = "OK";

    return res.status(200).json(finalOutput);
  } catch (error) {
    return res.status(500).json({
      endpoint_called: "oracle.js",
      engine_status: VERSION,
      system_status: "ORACLE_FAILED",
      status: "oracle_failed",
      error: error.message || "unknown_oracle_error"
    });
  }
}