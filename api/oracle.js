import { predictiveSmartMode } from "./predictiveSmartMode.js";

// ==============================
// CORE HELPERS
// ==============================

function toTimestamp(value) {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

function cloneTriggerCandidate(candidate, source, bucket) {
  if (!candidate || typeof candidate !== "object") return null;
  return {
    ...candidate,
    source,
    bucket
  };
}

function bucketByTimeDiffHours(hoursAhead) {
  if (hoursAhead === null || hoursAhead === undefined) {
    return "discarded_weak_triggers";
  }
  if (hoursAhead <= 0.5) return "current_active_triggers";
  if (hoursAhead <= 24) return "next_24h_triggers";
  if (hoursAhead <= 72) return "next_72h_triggers";
  return "discarded_weak_triggers";
}

function buildCandidateFingerprint(candidate) {
  if (!candidate || typeof candidate !== "object") return "unknown_candidate";

  const kind = candidate.kind || "unknown_kind";
  const time = candidate.predicted_time_utc || "no_time";
  const sourcePair =
    candidate?.details?.pair ||
    candidate?.details?.dominant_trigger_identity ||
    candidate?.details?.next_event ||
    candidate?.reason ||
    "no_detail";

  return `${kind}|${time}|${sourcePair}`;
}

function dedupeCandidates(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];

  for (const item of list) {
    const fp = buildCandidateFingerprint(item);
    if (!seen.has(fp)) {
      seen.add(fp);
      out.push(item);
    }
  }

  return out;
}

function sortCandidates(list) {
  return [...list].sort((a, b) => {
    const strengthDiff = Number(b?.strength_score || 0) - Number(a?.strength_score || 0);
    if (strengthDiff !== 0) return strengthDiff;

    const ta = toTimestamp(a?.predicted_time_utc);
    const tb = toTimestamp(b?.predicted_time_utc);

    if (ta === null && tb === null) return 0;
    if (ta === null) return 1;
    if (tb === null) return -1;
    return ta - tb;
  });
}

function pushRankedTrigger(triggers, candidate, source, hoursAhead = null) {
  if (!candidate) return;

  const strength = Number(candidate.strength_score || 0);
  let bucket = bucketByTimeDiffHours(hoursAhead);

  if (strength >= 0.8 && bucket === "next_24h_triggers") {
    bucket = "current_active_triggers";
  } else if (strength >= 0.6 && bucket === "next_72h_triggers") {
    bucket = "next_24h_triggers";
  } else if (strength < 0.35) {
    bucket = "discarded_weak_triggers";
  }

  const enriched = cloneTriggerCandidate(candidate, source, bucket);
  if (enriched) {
    triggers[bucket].push(enriched);
  }
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

// ==============================
// PHASE 5:
// FULL TRIGGER SCAN + DEDUPE
// ==============================

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
    const hoursAhead = ts !== null ? (ts - scanBaseTs) / 3600000 : null;
    pushRankedTrigger(
      triggers,
      predictive.best_future_candidate,
      "predictive_smart_mode.best_future_candidate",
      hoursAhead
    );
  }

  if (modules.aspect_approach_timing) {
    Object.entries(modules.aspect_approach_timing).forEach(([key, mod]) => {
      if (mod?.candidate?.predicted_time_utc) {
        const ts = toTimestamp(mod.candidate.predicted_time_utc);
        const hoursAhead = ts !== null ? (ts - scanBaseTs) / 3600000 : null;
        pushRankedTrigger(
          triggers,
          {
            ...mod.candidate,
            details: {
              ...(mod.candidate.details || {}),
              module_key: key
            }
          },
          `aspect_approach_timing.${key}`,
          hoursAhead
        );
      }
    });
  }

  if (Array.isArray(modules.nakshatra_boundary_trigger?.candidates)) {
    modules.nakshatra_boundary_trigger.candidates.forEach((candidate, idx) => {
      const ts = toTimestamp(candidate?.predicted_time_utc);
      const hoursAhead = ts !== null ? (ts - scanBaseTs) / 3600000 : null;
      pushRankedTrigger(
        triggers,
        {
          ...candidate,
          details: {
            ...(candidate.details || {}),
            candidate_index: idx
          }
        },
        "nakshatra_boundary_trigger",
        hoursAhead
      );
    });
  }

  if (modules.multi_snapshot_predictive_merge?.candidate?.predicted_time_utc) {
    const candidate = modules.multi_snapshot_predictive_merge.candidate;
    const ts = toTimestamp(candidate.predicted_time_utc);
    const hoursAhead = ts !== null ? (ts - scanBaseTs) / 3600000 : null;
    pushRankedTrigger(
      triggers,
      candidate,
      "multi_snapshot_predictive_merge",
      hoursAhead
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

// ==============================
// PHASE 5:
// CLEANER 3-DAY MAP
// ==============================

function pickFirstUnique(candidates, usedFingerprints) {
  if (!Array.isArray(candidates)) return null;
  for (const item of candidates) {
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

// ==============================
// PHASE 3:
// DOMAIN HINT + TRIGGER FAMILY
// ==============================

function normalizeDomainScoreMap() {
  return {
    money: 0,
    communication: 0,
    authority: 0,
    relationship: 0,
    conflict: 0,
    movement: 0,
    support: 0,
    spiritual: 0
  };
}

function addWeight(map, key, weight) {
  if (!Object.prototype.hasOwnProperty.call(map, key)) return;
  map[key] += weight;
}

function classifyTriggerDomains(data) {
  const aspects = Array.isArray(data?.aspects_summary) ? data.aspects_summary : [];
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

  const hasRahuMercury = aspects.some(
    (a) =>
      (a.planet1 === "Mercury" && a.planet2 === "Rahu") ||
      (a.planet1 === "Rahu" && a.planet2 === "Mercury")
  );

  const hasMoonMars = aspects.some(
    (a) =>
      (a.planet1 === "Moon" && a.planet2 === "Mars") ||
      (a.planet1 === "Mars" && a.planet2 === "Moon")
  );

  const hasSunSaturn = aspects.some(
    (a) =>
      (a.planet1 === "Sun" && a.planet2 === "Saturn") ||
      (a.planet1 === "Saturn" && a.planet2 === "Sun")
  );

  const hasVenusJupiter = aspects.some(
    (a) =>
      (a.planet1 === "Venus" && a.planet2 === "Jupiter") ||
      (a.planet1 === "Jupiter" && a.planet2 === "Venus")
  );

  if (dominantTrigger === "moon_degree_lock" || dominantTrigger === "moon_nakshatra_entry") {
    addWeight(scores, "relationship", 3);
    addWeight(scores, "movement", 3);
    addWeight(scores, "communication", 2);
    addWeight(scores, "spiritual", 1);
  }

  if (dominantTrigger === "moon_mars_square") {
    addWeight(scores, "conflict", 4);
    addWeight(scores, "movement", 2);
    addWeight(scores, "relationship", 1);
  }

  if (dominantTrigger === "rahu_mercury_conjunction") {
    addWeight(scores, "communication", 4);
    addWeight(scores, "money", 2);
    addWeight(scores, "movement", 1);
  }

  if (dominantTrigger === "sun_saturn_conjunction") {
    addWeight(scores, "authority", 4);
    addWeight(scores, "conflict", 1);
    addWeight(scores, "movement", 1);
  }

  if (hasRahuMercury) {
    addWeight(scores, "communication", 3);
    addWeight(scores, "money", 1);
  }

  if (hasMoonMars) {
    addWeight(scores, "conflict", 3);
    addWeight(scores, "movement", 2);
  }

  if (hasSunSaturn) {
    addWeight(scores, "authority", 3);
    addWeight(scores, "conflict", 1);
  }

  if (hasVenusJupiter) {
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

  const rankedDomains = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .filter(([, value]) => value > 0)
    .map(([domain, value]) => ({ domain, score: value }));

  return {
    dominant_domain: rankedDomains[0]?.domain || "general",
    secondary_domain: rankedDomains[1]?.domain || null,
    ranked_domains: rankedDomains,
    trigger_family: dominantTrigger || "unknown_trigger_family"
  };
}

// ==============================
// PHASE 4:
// DOMAIN-AWARE WORDING LOCK
// ==============================

function buildDomainNarrative(domain, mode = "future") {
  const copy = {
    money: {
      present:
        "Money-related movement, release pressure, payment expectation, or value-linked activity is building now.",
      future:
        "A money-linked event is likely to take shape through payment, inflow, release, pricing, or deal-value movement."
    },
    communication: {
      present:
        "A communication field is opening through message pressure, reply expectation, negotiation, contact, or paperwork movement.",
      future:
        "A communication-linked event is likely to form through message, reply, proposal, deal-talk, contact, or document activity."
    },
    authority: {
      present:
        "Authority pressure, formal structure, responsibility, review, or duty-linked weight is active in the field now.",
      future:
        "An authority-linked development is likely to form through duty, formal contact, approval pressure, delay, or responsibility."
    },
    relationship: {
      present:
        "An emotional or relational field is active now through contact-opening, feeling shift, attention, response, or human closeness.",
      future:
        "A relationship-linked development is likely to unfold through contact, emotional movement, response, closeness, or renewed attention."
    },
    conflict: {
      present:
        "Pressure, irritation, friction, or confrontation energy is active now and can push a situation toward reaction.",
      future:
        "A conflict-linked development is likely to emerge through pressure, disagreement, sharp reaction, argument, or heated movement."
    },
    movement: {
      present:
        "Movement, travel, dispatch, transition, or active change in pace is building now in practical life.",
      future:
        "A movement-linked event is likely to unfold through travel, dispatch, relocation, fast response, or situational shift."
    },
    support: {
      present:
        "A supportive field is active now through help, alignment, easing, opening, or cooperative energy.",
      future:
        "A supportive development is likely to form through help, alliance, grace, opportunity, easing, or beneficial alignment."
    },
    spiritual: {
      present:
        "An inward, intuitive, or spiritually sensitive field is active now and can shape perception, receptivity, or reflection.",
      future:
        "A spiritually-toned or inward development is likely to unfold through reflection, subtle response, intuition, or inner opening."
    },
    general: {
      present:
        "A general event-field is active now, but the signal is not yet sharply narrowed to a single domain.",
      future:
        "A general future event is building, but the domain is not yet sharply narrowed."
    }
  };

  return copy[domain]?.[mode] || copy.general[mode];
}

function buildFutureToneFromDomain(domain, dominantTrigger) {
  const toneMap = {
    money: "release / gain / value movement",
    communication: "message / negotiation / paperwork movement",
    authority: "formal / delayed / duty-weighted",
    relationship: "responsive / emotional / contact-opening",
    conflict: "heated / sharp / pressurised",
    movement: "active / shifting / fast-paced",
    support: "easing / helpful / aligned",
    spiritual: "subtle / inward / intuitive",
    general: "developing / transitional / mixed"
  };

  if (
    dominantTrigger === "rahu_mercury_conjunction" ||
    dominantTrigger === "aspect_approach_timing" ||
    dominantTrigger === "multi_snapshot_predictive_merge"
  ) {
    return "message / negotiation / paperwork movement";
  }

  if (dominantTrigger === "moon_degree_lock" || dominantTrigger === "moon_nakshatra_entry") {
    return "fresh / responsive / immediate";
  }

  if (dominantTrigger === "moon_mars_square") {
    return "heated / urgent / reactive";
  }

  if (dominantTrigger === "sun_saturn_conjunction") {
    return "formal / pressured / duty-bound";
  }

  return toneMap[domain] || toneMap.general;
}

function buildFutureChannelFromDomain(domain, dominantTrigger) {
  const channelMap = {
    money: "money / payment / release / value",
    communication: "communication / deal / paperwork / reply",
    authority: "authority / structure / duty / approval",
    relationship: "emotion / response / contact / closeness",
    conflict: "pressure / argument / confrontation / friction",
    movement: "movement / travel / dispatch / shift",
    support: "support / alliance / help / opportunity",
    spiritual: "inner field / intuition / reflection",
    general: "general life field"
  };

  if (
    dominantTrigger === "rahu_mercury_conjunction" ||
    dominantTrigger === "aspect_approach_timing" ||
    dominantTrigger === "multi_snapshot_predictive_merge"
  ) {
    return "communication / deal / paperwork / reply";
  }

  if (dominantTrigger === "moon_degree_lock" || dominantTrigger === "moon_nakshatra_entry") {
    return "emotion / opening / movement / contact";
  }

  if (dominantTrigger === "moon_mars_square") {
    return "emotion / confrontation / sudden action";
  }

  if (dominantTrigger === "sun_saturn_conjunction") {
    return "authority / structure / responsibility";
  }

  return channelMap[domain] || channelMap.general;
}

// ==============================
// PHASE 6:
// COMMUNICATION -> MONEY BRIDGE
// ==============================

function getDomainScore(domainHint, name) {
  if (!domainHint?.ranked_domains || !Array.isArray(domainHint.ranked_domains)) return 0;
  const found = domainHint.ranked_domains.find((item) => item.domain === name);
  return found?.score || 0;
}

function buildCommunicationMoneyOverlay(domainHint) {
  const dominantDomain = domainHint?.dominant_domain || "general";
  const moneyScore = getDomainScore(domainHint, "money");
  const communicationScore = getDomainScore(domainHint, "communication");

  if (dominantDomain !== "communication") return null;
  if (moneyScore <= 0) return null;
  if (communicationScore <= 0) return null;

  return {
    present:
      "A communication field is opening through message pressure, customer response, negotiation, order-talk, contact, or paperwork movement with money relevance underneath.",
    future:
      "A communication-linked event is likely to form through message, reply, proposal, deal-talk, customer contact, order activity, or paperwork that can lead toward payment or money release.",
    channel:
      "communication / order / deal / paperwork / payment path",
    tone:
      "message / negotiation / paperwork / money-link"
  };
}

// ==============================
// PHASE 2 + 4 + 6:
// INTERPRETATION
// ==============================

function buildEventInterpretation(data) {
  const aspects = Array.isArray(data?.aspects_summary) ? data.aspects_summary : [];
  const timing = data?.timing_evidence || {};
  const predictive = data?.predictive_smart_mode || {};
  const triggerScan = data?.trigger_scan || {};
  const domainHint = data?.domain_hint || {};
  const dasha = data?.dasha || {};
  const divisional = data?.divisional || {};

  let pastPattern =
    "Pattern suggests a similar karmic cycle or event-family was activated before under a related trigger structure.";

  let presentManifestation =
    "Background phase with no dominant lived event fully breaking through.";
  let futureEventNature = "No strong future event nature isolated yet.";
  let futureChannel = "general";
  let futureTone = "neutral";

  const dominantTrigger =
    timing?.dominant_trigger_identity ||
    triggerScan?.dominant_trigger?.details?.dominant_trigger_identity ||
    triggerScan?.dominant_trigger?.kind ||
    null;

  const dominantDomain = domainHint?.dominant_domain || "general";
  const communicationMoneyOverlay = buildCommunicationMoneyOverlay(domainHint);

  const hasRahuMercury = aspects.some(
    (a) =>
      (a.planet1 === "Mercury" && a.planet2 === "Rahu") ||
      (a.planet1 === "Rahu" && a.planet2 === "Mercury")
  );

  const hasMoonMars = aspects.some(
    (a) =>
      (a.planet1 === "Moon" && a.planet2 === "Mars") ||
      (a.planet1 === "Mars" && a.planet2 === "Moon")
  );

  const hasSunSaturn = aspects.some(
    (a) =>
      (a.planet1 === "Sun" && a.planet2 === "Saturn") ||
      (a.planet1 === "Saturn" && a.planet2 === "Sun")
  );

  const hasVenusJupiter = aspects.some(
    (a) =>
      (a.planet1 === "Venus" && a.planet2 === "Jupiter") ||
      (a.planet1 === "Jupiter" && a.planet2 === "Venus")
  );

  if (
    dominantTrigger === "moon_nakshatra_entry" ||
    dominantTrigger === "moon_degree_lock"
  ) {
    presentManifestation =
      "A fresh emotional field, contact-opening atmosphere, movement in feeling, or immediate life-shift gate is active now.";
    futureEventNature =
      "A new lived phase is opening through contact, emotional shift, movement, response, or a fresh unfolding event tied to the present lunar trigger.";
    futureChannel = "emotion / opening / movement / contact";
    futureTone = "fresh / responsive / immediate";
    pastPattern =
      "A similar lunar opening likely marked the beginning of a noticeable emotional, contact-based, or movement-linked phase before.";
  } else if (dominantTrigger === "moon_mars_square") {
    presentManifestation =
      "Emotional heat, confrontation pressure, reactive movement, or sharp inner agitation is active now.";
    futureEventNature =
      "A sharp emotional, conflict-driven, or sudden reaction event is likely to peak through pressure, argument, urgency, or impulsive movement.";
    futureChannel = "emotion / confrontation / sudden action";
    futureTone = "heated / urgent / reactive";
    pastPattern =
      "A similar cycle likely brought heat, irritation, emotional reaction, conflict, or pressure-led movement before.";
  } else if (dominantTrigger === "rahu_mercury_conjunction") {
    presentManifestation =
      "Hidden communication, mixed signals, paperwork distortion, or clever negotiation pressure is active now.";
    futureEventNature =
      "A message, proposal, deal, contact, or decision-linked communication is likely to peak with a hidden twist, layered meaning, or manipulative undertone.";
    futureChannel = "communication / deal / paperwork";
    futureTone = "message / negotiation / paperwork movement";
    pastPattern =
      "A similar cycle likely brought confusing communication, hidden motives, misleading talk, paperwork stress, or a deal that looked clearer than it really was.";
  } else if (dominantTrigger === "sun_saturn_conjunction") {
    presentManifestation =
      "Authority pressure, burden, responsibility, delay, or recognition under weight is active now.";
    futureEventNature =
      "A duty-linked, authority-linked, or pressure-driven event is likely to crystallise through responsibility, formal contact, delay, or public weight.";
    futureChannel = "authority / structure / responsibility";
    futureTone = "formal / pressured / duty-bound";
    pastPattern =
      "A similar cycle likely brought duty, delay, formal pressure, burden, or authority-linked heaviness before.";
  } else if (
    dominantTrigger === "aspect_approach_timing" ||
    dominantTrigger === "multi_snapshot_predictive_merge" ||
    predictive?.best_future_candidate?.predicted_time_utc
  ) {
    if (communicationMoneyOverlay) {
      presentManifestation = communicationMoneyOverlay.present;
      futureEventNature =
        `${communicationMoneyOverlay.future} The projected trigger is building toward activation.`;
      futureChannel = communicationMoneyOverlay.channel;
      futureTone = communicationMoneyOverlay.tone;
      pastPattern =
        "A similar pattern likely unfolded before through communication, order-talk, customer response, or deal-flow that later connected to money movement.";
    } else {
      presentManifestation = buildDomainNarrative(dominantDomain, "present");
      futureEventNature =
        `${buildDomainNarrative(dominantDomain, "future")} The projected trigger is building toward activation.`;
      futureChannel = buildFutureChannelFromDomain(dominantDomain, dominantTrigger);
      futureTone = buildFutureToneFromDomain(dominantDomain, dominantTrigger);
      pastPattern =
        `A similar pattern likely unfolded before in the ${dominantDomain} domain when a related trigger structure matured.`;
    }
  } else if (dominantTrigger === "live_current_trigger") {
    presentManifestation =
      "A present trigger is already live and is actively shaping the immediate event-field.";
    futureEventNature =
      "The live trigger is already in motion and is likely to manifest through its dominant channel without delay.";
    futureChannel = "live trigger / immediate field";
    futureTone = "active / immediate";
  } else {
    if (hasRahuMercury) {
      presentManifestation =
        "Hidden communication, mixed signals, clever negotiation, paperwork distortion, or deal-confusion environment is active.";
      futureEventNature =
        "A message, proposal, contact, or decision-linked communication is likely to emerge with a hidden twist, trap, or layered meaning.";
      futureChannel = "communication / deal / paperwork";
      futureTone = "message / negotiation / paperwork movement";
      pastPattern =
        "A similar cycle likely brought confusing communication, hidden motives, misleading talk, paperwork stress, or a deal that looked clearer than it really was.";
    }

    if (hasMoonMars) {
      presentManifestation =
        "Emotional heat, reactive pressure, conflict-proneness, or fast-moving agitation is active in lived reality.";
      if (futureEventNature === "No strong future event nature isolated yet.") {
        futureEventNature =
          "A sharp emotional exchange, argument, impulsive move, or pressure-driven reaction may form next.";
        futureChannel = "emotion / conflict / movement";
        futureTone = "heated / urgent / reactive";
      }
    }

    if (hasSunSaturn) {
      presentManifestation =
        "Authority pressure, burden, responsibility, delay, or recognition under weight is active now.";
      if (futureEventNature === "No strong future event nature isolated yet.") {
        futureEventNature =
          "A duty-linked decision, authority interaction, pressure event, or formal burden may crystallise next.";
        futureChannel = "authority / duty / public pressure";
        futureTone = "formal / pressured / duty-bound";
      }
    }

    if (hasVenusJupiter) {
      if (futureEventNature === "No strong future event nature isolated yet.") {
        futureEventNature =
          "A support window, alliance, help, blessing, easing, or graceful opening may emerge.";
        futureChannel = "support / alliance / opportunity";
        futureTone = "easing / helpful / aligned";
      }
    }

    if (communicationMoneyOverlay && futureChannel.includes("communication")) {
      presentManifestation = communicationMoneyOverlay.present;
      futureEventNature = communicationMoneyOverlay.future;
      futureChannel = communicationMoneyOverlay.channel;
      futureTone = communicationMoneyOverlay.tone;
    }
  }

  if (timing.trigger_present === true && dominantTrigger) {
    futureEventNature =
      `${futureEventNature} Present trigger is already live through ${dominantTrigger}.`;
  }

  if (dasha?.status === "active" && divisional?.status === "active") {
    pastPattern =
      `${pastPattern} Natal timing permission is open, so past repetition logic is stronger and more trustworthy.`;
  }

  return {
    past_pattern: pastPattern,
    present_manifestation: presentManifestation,
    future_event_nature: futureEventNature,
    future_channel: futureChannel,
    future_tone: futureTone,
    interpretation_source: dominantTrigger ? "dominant_trigger_lock" : "aspect_fallback"
  };
}

function buildConfidenceEnhanced(baseConfidence, data) {
  const timing = data?.timing_evidence || {};
  const predictive = data?.predictive_smart_mode || {};

  let confidenceClass = "MODERATE";
  let confidenceWarning = null;

  if (
    timing.trigger_present === true &&
    timing.convergence_strength === "high" &&
    timing.exact_time_candidate_utc
  ) {
    confidenceClass = "TIMING_STRONG_EVENT_STRONG";
  } else if (predictive?.best_future_candidate?.predicted_time_utc) {
    confidenceClass = "PREDICTIVE_STRONG";
    confidenceWarning = "No present trigger; future-based projection is active.";
  } else if (
    timing.trigger_present === false &&
    timing.convergence_strength === "low"
  ) {
    confidenceClass = "LOW_CONVERGENCE";
    confidenceWarning = "Present timing support is weak.";
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
      dominant_domain: domainHint?.dominant_domain || "general"
    };
  }

  if (predictive?.best_future_candidate?.predicted_time_utc) {
    return {
      outcome: "PREDICTIVE",
      event_state: "FUTURE_TRIGGER",
      best_actionable_time_utc: predictive.best_future_candidate.predicted_time_utc,
      best_actionable_mode: "PREDICTIVE",
      dominant_domain: domainHint?.dominant_domain || "general"
    };
  }

  return {
    outcome: "WINDOW",
    event_state: "LOW_ACTIVITY",
    best_actionable_time_utc: null,
    best_actionable_mode: "WAIT",
    dominant_domain: domainHint?.dominant_domain || "general"
  };
}

// ==============================
// MAIN HANDLER
// ==============================

export default async function handler(req, res) {
  try {
    const baseUrl = "https://live-transit-engine.vercel.app";
    const birthDateTime = req.query?.birth_datetime || null;

    const transitUrl = birthDateTime
      ? `${baseUrl}/api/transit?birth_datetime=${encodeURIComponent(birthDateTime)}`
      : `${baseUrl}/api/transit`;

    const multiSnapshotUrl = birthDateTime
      ? `${baseUrl}/api/multi-snapshot?birth_datetime=${encodeURIComponent(birthDateTime)}`
      : `${baseUrl}/api/multi-snapshot`;

    const [transitRes, multiRes] = await Promise.all([
      fetch(transitUrl),
      fetch(multiSnapshotUrl)
    ]);

    if (!transitRes.ok) {
      throw new Error(`transit_fetch_failed_${transitRes.status}`);
    }

    if (!multiRes.ok) {
      throw new Error(`multi_snapshot_fetch_failed_${multiRes.status}`);
    }

    const transit = await transitRes.json();
    const multi = await multiRes.json();

    const triggerPresent =
      transit?.micro_status?.trigger_present === true ||
      (multi?.active_trigger_snapshots || 0) > 0;

    const precisionAllowed =
      transit?.micro_status?.precision_allowed ||
      (triggerPresent ? "minute_candidate" : "window_only");

    const dominantTriggerIdentity =
      transit?.micro_dominant_trigger?.type ||
      multi?.dominant_trigger_identity ||
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

    const activeTriggerSnapshots =
      multi?.active_trigger_snapshots || 0;

    const dashaStatus = transit?.dasha?.status || "absent";
    const divisionalStatus = transit?.divisional?.status || "absent";

    let timingMode = "window_only";
    if (precisionAllowed === "minute_candidate" && exactTimeCandidate) {
      timingMode = "exact_candidate";
    }

    const exactDateCandidate = exactTimeCandidate
      ? exactTimeCandidate.split("T")[0]
      : null;

    const timeWindow = exactTimeCandidate
      ? {
          start_utc:
            transit?.micro_dominant_trigger?.cluster_start_utc || null,
          end_utc:
            transit?.micro_dominant_trigger?.cluster_end_utc || null
        }
      : {
          start_utc: null,
          end_utc: null
        };

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

    const kpSummary = transit?.kp_cusps
      ? {
          "1": transit.kp_cusps["1"] || null,
          "2": transit.kp_cusps["2"] || null,
          "4": transit.kp_cusps["4"] || null,
          "5": transit.kp_cusps["5"] || null,
          "6": transit.kp_cusps["6"] || null,
          "7": transit.kp_cusps["7"] || null,
          "8": transit.kp_cusps["8"] || null,
          "9": transit.kp_cusps["9"] || null,
          "10": transit.kp_cusps["10"] || null,
          "11": transit.kp_cusps["11"] || null,
          "12": transit.kp_cusps["12"] || null
        }
      : null;

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

    if (convergenceStrength === "high" || Number(convergenceStrength) >= 0.75) {
      confidenceScore += 25;
      confidenceReasons.push("high convergence");
    } else if (
      convergenceStrength === "medium" ||
      Number(convergenceStrength) >= 0.4
    ) {
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
          values.reduce((sum, val) => sum + Number(val || 0), 0) / values.length;

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

    if (confidenceScore > 95) confidenceScore = 95;
    if (confidenceScore < 0) confidenceScore = 0;

    let confidenceLevel = "LOW";
    if (confidenceScore >= 75) confidenceLevel = "HIGH";
    else if (confidenceScore >= 60) confidenceLevel = "MEDIUM";

    const baseOutput = {
      endpoint_called: "oracle.js",
      timestamp: new Date().toISOString(),

      authority: transit?.authority || null,
      freshness: transit?.freshness || null,
      integrity: transit?.integrity || null,
      location_used: transit?.location_used || null,

      panchanga: transit?.panchanga || null,
      ascendant: transit?.ascendant || null,
      houses: transit?.houses || null,
      kp_cusps: kpSummary,

      planets,
      aspects_summary: Array.isArray(transit?.aspects)
        ? transit.aspects.slice(0, 20)
        : [],
      strength: transit?.strength || null,

      dasha: dashaSummary,
      divisional: divisionalSummary,

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
        timing_grade:
          triggerPresent && exactTimeCandidate
            ? "EXACT_LOCK"
            : "WINDOW_OR_PREDICTIVE",
        timing_source:
          triggerPresent && exactTimeCandidate
            ? "present_trigger"
            : "future_or_window"
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
      },

      engine_status: "ORACLE_BASE_PACKET_v1"
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

    finalOutput.confidence = buildConfidenceEnhanced(
      finalOutput.confidence,
      finalOutput
    );

    finalOutput.oracle_verdict = buildOracleVerdict({
      ...finalOutput,
      domain_hint: finalOutput.domain_hint
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

    finalOutput.engine_status = "SMART_ORACLE_PREMIUM_v7";
    finalOutput.oracle_mode = "all_domain_ecosystem_packet";

    return res.status(200).json(finalOutput);
  } catch (error) {
    return res.status(500).json({
      endpoint_called: "oracle.js",
      status: "oracle_failed",
      error: error.message || "unknown_oracle_error"
    });
  }
}