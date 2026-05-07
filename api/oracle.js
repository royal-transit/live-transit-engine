// /api/oracle.js
// FULL REPLACEMENT — ELITE LIVE ORACLE ROUTER
// Purpose: collect live transit + multi snapshot + predictive smart mode,
// then pass everything into deterministic ecosystem brain.

import { predictiveSmartMode } from "./predictiveSmartMode.js";
import { buildDeterministicOracleEcosystem } from "./oracleEcosystem.js";

const VERSION = "LIVE_ORACLE_ROUTER_V12_ELITE_DETERMINISTIC_ECOSYSTEM";

function norm(v) {
  return String(v || "").trim();
}

function low(v) {
  return norm(v).toLowerCase();
}

function num(v, fb = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function buildBirthDateTimeFromQuery(query = {}) {
  if (query.birth_datetime) return norm(query.birth_datetime);

  if (query.dob && query.tob) {
    const tz = norm(query.timezone_offset || "+06:00");
    const dob = norm(query.dob);
    const tob = norm(query.tob);

    if (/^\d{2}:\d{2}$/.test(tob)) {
      return `${dob}T${tob}:00${tz}`;
    }

    return `${dob}T${tob}${tz}`;
  }

  return null;
}

function buildClientMode(query = {}) {
  const name = norm(query.name);
  const birthDatetime = buildBirthDateTimeFromQuery(query);

  if (birthDatetime) {
    return {
      subject_mode: name ? "NAME_FULL_DETAIL_LIVE" : "FULL_BIRTH_LIVE",
      identity_depth: "LEVEL_5_FULL_BIRTH_LIVE",
      precision_mode: "FULL_BIRTH_LIVE",
      subject_name: name || null,
      normalized_name: name ? low(name) : null,
      input_context: {
        question: norm(query.question || "raw transit"),
        facts: norm(query.facts || ""),
        lat: query.lat ?? null,
        lon: query.lon ?? null,
        birth_datetime: birthDatetime,
        dob: query.dob ?? null,
        tob: query.tob ?? null,
        pob: query.pob ?? null,
        timezone_offset: query.timezone_offset ?? null
      },
      usage_rule:
        "Full birth data supplied; natal timing may be used only if backend dasha/divisional are active."
    };
  }

  if (name) {
    return {
      subject_mode: "NAME_ONLY_LIVE",
      identity_depth: "LEVEL_2_NAME_ONLY_LIVE",
      precision_mode: "NAME_ONLY_LIVE",
      subject_name: name,
      normalized_name: low(name),
      input_context: {
        question: norm(query.question || "raw transit"),
        facts: norm(query.facts || ""),
        lat: query.lat ?? null,
        lon: query.lon ?? null,
        birth_datetime: null,
        dob: null,
        tob: null,
        pob: null,
        timezone_offset: null
      },
      usage_rule: "Use name as context only; do not claim natal certainty."
    };
  }

  return {
    subject_mode: "UNIVERSAL_LIVE_ONLY",
    identity_depth: "LEVEL_1_UNIVERSAL_LIVE",
    precision_mode: "LIVE_ONLY",
    subject_name: null,
    normalized_name: null,
    input_context: {
      question: norm(query.question || "raw transit"),
      facts: norm(query.facts || ""),
      lat: query.lat ?? null,
      lon: query.lon ?? null,
      birth_datetime: null,
      dob: null,
      tob: null,
      pob: null,
      timezone_offset: null
    },
    usage_rule: "Use universal live transit only."
  };
}

function buildUrl(baseUrl, path, query = {}) {
  const params = new URLSearchParams();

  if (query.lat) params.set("lat", query.lat);
  if (query.lon) params.set("lon", query.lon);

  const birthDatetime = buildBirthDateTimeFromQuery(query);
  if (birthDatetime) params.set("birth_datetime", birthDatetime);

  const qs = params.toString();
  return `${baseUrl}${path}${qs ? `?${qs}` : ""}`;
}

function buildPlanets(transit = {}) {
  return {
    sun: transit.sun || null,
    moon: transit.moon || null,
    mercury: transit.mercury || null,
    venus: transit.venus || null,
    mars: transit.mars || null,
    jupiter: transit.jupiter || null,
    saturn: transit.saturn || null,
    rahu: transit.rahu || null,
    ketu: transit.ketu || null
  };
}

function buildDashaSummary(transit = {}) {
  if (transit?.dasha?.status === "active") {
    return {
      ...transit.dasha,
      natal_timing_permission: "OPEN"
    };
  }

  return {
    status: transit?.dasha?.status || "absent_no_birth_datetime",
    required_input: "birth_datetime OR dob+tob+timezone_offset",
    format:
      transit?.dasha?.format ||
      "ISO 8601 with timezone, e.g. 1988-12-11T10:59:00+06:00",
    natal_timing_permission: "CLOSED"
  };
}

function buildDivisionalSummary(transit = {}) {
  if (transit?.divisional?.status === "active") {
    return {
      ...transit.divisional,
      divisional_reinforcement_grade: "STRONG"
    };
  }

  return {
    status: transit?.divisional?.status || "absent_no_birth_datetime",
    required_input: "birth_datetime OR dob+tob+timezone_offset",
    supported: ["D7", "D9", "D10", "D12", "D24"],
    divisional_reinforcement_grade: "WEAK_OR_ABSENT"
  };
}

function calculateConfidence({ transit, multi, triggerPresent, exactTimeCandidate, clientMode }) {
  let score = 30;
  const reasons = [];

  if (transit?.integrity?.status === "CLEAN") {
    score += 5;
    reasons.push("clean integrity");
  }

  if (transit?.freshness?.status === "LIVE") {
    score += 5;
    reasons.push("live freshness");
  }

  if (triggerPresent) {
    score += 25;
    reasons.push("micro trigger active");
  } else {
    reasons.push("no active trigger");
  }

  const convergence =
    multi?.convergence_strength ||
    transit?.micro_convergence?.convergence_strength ||
    "low";

  if (convergence === "high" || num(convergence) >= 0.75) {
    score += 25;
    reasons.push("high convergence");
  } else if (convergence === "medium" || num(convergence) >= 0.4) {
    score += 15;
    reasons.push("medium convergence");
  } else {
    reasons.push("low convergence");
  }

  if (num(multi?.active_trigger_snapshots) >= 5) {
    score += 10;
    reasons.push("multi snapshot strong");
  }

  if (transit?.dasha?.status === "active") {
    score += 10;
    reasons.push("dasha active");
  }

  if (transit?.divisional?.status === "active") {
    score += 10;
    reasons.push("divisional active");
  }

  const strengthValues = Object.values(transit?.strength || {});
  if (strengthValues.length) {
    const avg =
      strengthValues.reduce((sum, value) => sum + num(value), 0) /
      strengthValues.length;

    if (avg >= 0.65) {
      score += 10;
      reasons.push("strong planetary strength");
    } else if (avg >= 0.5) {
      score += 5;
      reasons.push("moderate planetary strength");
    }
  }

  if (exactTimeCandidate) {
    score += 10;
    reasons.push("exact timing unlocked");
  }

  if (clientMode.precision_mode === "NAME_ONLY_LIVE") {
    score = Math.min(score, 65);
    reasons.push("name-only ceiling applied");
  }

  if (clientMode.precision_mode === "LIVE_ONLY") {
    score = Math.min(score, 55);
    reasons.push("universal-live-only ceiling applied");
  }

  score = Math.max(0, Math.min(95, score));

  const level =
    score >= 75 ? "HIGH" :
    score >= 60 ? "MEDIUM" :
    "LOW";

  return {
    confidence_score: score,
    confidence_level: level,
    confidence_reasons: reasons
  };
}

function buildBaseOraclePacket({ clientMode, transit, multi }) {
  const triggerPresent =
    transit?.micro_status?.trigger_present === true ||
    num(multi?.active_trigger_snapshots) > 0;

  const exactTimeCandidate =
    transit?.micro_dominant_trigger?.peak_time_utc ||
    multi?.micro_dominant_trigger?.peak_time_utc ||
    null;

  const dominantTriggerIdentity =
    transit?.micro_dominant_trigger?.type ||
    multi?.dominant_trigger_identity ||
    null;

  const precisionAllowed =
    transit?.micro_status?.precision_allowed ||
    (triggerPresent ? "minute_candidate" : "window_only");

  const convergenceStrength =
    multi?.convergence_strength ||
    transit?.micro_convergence?.convergence_strength ||
    "low";

  const clusterDensity =
    multi?.cluster_density ||
    transit?.micro_convergence?.cluster_density ||
    0;

  const activeTriggerSnapshots = num(multi?.active_trigger_snapshots);

  const timeWindow = exactTimeCandidate
    ? {
        start_utc: transit?.micro_dominant_trigger?.cluster_start_utc || null,
        end_utc: transit?.micro_dominant_trigger?.cluster_end_utc || null
      }
    : {
        start_utc: null,
        end_utc: null
      };

  const confidence = calculateConfidence({
    transit,
    multi,
    triggerPresent,
    exactTimeCandidate,
    clientMode
  });

  return {
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
    kp_cusps: transit?.kp_cusps || null,

    planets: buildPlanets(transit),
    aspects_summary: safeArray(transit?.aspects).slice(0, 40),
    strength: transit?.strength || null,

    dasha: buildDashaSummary(transit),
    divisional: buildDivisionalSummary(transit),

    raw_micro: {
      transit_micro_window: transit?.micro_window || null,
      transit_micro_status: transit?.micro_status || null,
      transit_micro_convergence: transit?.micro_convergence || null,
      transit_micro_dominant_trigger: transit?.micro_dominant_trigger || null,
      transit_micro_clusters: transit?.micro_clusters || [],
      transit_micro_triggers: transit?.micro_triggers || [],
      multi_snapshot_summary: {
        active_trigger_snapshots: activeTriggerSnapshots,
        convergence_strength: convergenceStrength,
        cluster_density: clusterDensity,
        dominant_trigger_identity: multi?.dominant_trigger_identity || null,
        micro_dominant_trigger: multi?.micro_dominant_trigger || null
      }
    },

    timing_evidence: {
      trigger_present: triggerPresent,
      precision_allowed: precisionAllowed,
      dominant_trigger_identity: dominantTriggerIdentity,
      exact_time_candidate_utc: exactTimeCandidate,
      exact_date_candidate_utc: exactTimeCandidate
        ? exactTimeCandidate.split("T")[0]
        : null,
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
      mode:
        triggerPresent && exactTimeCandidate
          ? "exact_candidate"
          : "window_only",
      exact_time_candidate_utc: exactTimeCandidate,
      exact_date_candidate_utc: exactTimeCandidate
        ? exactTimeCandidate.split("T")[0]
        : null,
      time_window_start_utc: timeWindow.start_utc,
      time_window_end_utc: timeWindow.end_utc,
      reason:
        triggerPresent && exactTimeCandidate
          ? "minute candidate supported by trigger and convergence"
          : "exact minute not fully unlocked; defended window mode active"
    },

    confidence,

    system_status: "BASE_PACKET_OK"
  };
}

function enhancePredictiveStatus(packet) {
  const out = { ...packet };

  if (out.predictive_smart_mode) {
    out.predictive_smart_mode.predictive_status =
      out.predictive_smart_mode?.best_future_candidate
        ? "FUTURE_TRIGGER_LIVE"
        : "BYPASS_OR_INACTIVE";

    out.predictive_smart_mode.predictive_priority =
      out.timing_evidence?.trigger_present === true
        ? "SECONDARY_TO_PRESENT_EXACT"
        : "PRIMARY_FUTURE_SUPPORT";
  }

  return out;
}

export default async function handler(req, res) {
  try {
    const baseUrl = "https://live-transit-engine.vercel.app";
    const query = req.query || {};

    const clientMode = buildClientMode(query);

    const transitUrl = buildUrl(baseUrl, "/api/transit", query);
    const multiUrl = buildUrl(baseUrl, "/api/multi-snapshot", query);

    const [transitRes, multiRes] = await Promise.all([
      fetch(transitUrl),
      fetch(multiUrl)
    ]);

    if (!transitRes.ok) {
      throw new Error(`transit_fetch_failed_${transitRes.status}`);
    }

    if (!multiRes.ok) {
      throw new Error(`multi_snapshot_fetch_failed_${multiRes.status}`);
    }

    const transit = await transitRes.json();
    const multi = await multiRes.json();

    const basePacket = buildBaseOraclePacket({
      clientMode,
      transit,
      multi
    });

    const predictivePacketRaw = predictiveSmartMode(basePacket);
    const predictivePacket = enhancePredictiveStatus(predictivePacketRaw);

    const ecosystem = buildDeterministicOracleEcosystem({
      clientMode,
      transit,
      multi,
      predictivePacket
    });

    const finalOutput = {
      ...predictivePacket,

      engine_status: VERSION,
      oracle_version: VERSION,
      oracle_mode:
        clientMode.precision_mode === "FULL_BIRTH_LIVE"
          ? "UNIVERSAL_LIVE_FULL_BIRTH_DETERMINISTIC_ECOSYSTEM"
          : clientMode.precision_mode === "NAME_ONLY_LIVE"
          ? "UNIVERSAL_LIVE_NAME_ONLY_DETERMINISTIC_ECOSYSTEM"
          : "UNIVERSAL_LIVE_ONLY_DETERMINISTIC_ECOSYSTEM",

      deterministic_ecosystem: ecosystem,

      raw_evidence: ecosystem.raw_evidence,
      trigger_maturity: ecosystem.trigger_maturity,
      domain_matrix: ecosystem.domain_matrix,

      event_dna: ecosystem.event_dna,
      legal_gates: ecosystem.legal_gates,
      causal_chain: ecosystem.causal_chain,
      precision_law: ecosystem.precision_law,
      elite_scoring_matrix: ecosystem.elite_scoring_matrix,
      probability_collapse: ecosystem.probability_collapse,

      event_interpretation: ecosystem.event_interpretation,
      oracle_verdict: ecosystem.oracle_verdict,
      remedy_decision_support: ecosystem.remedy_decision_support,
      final_verdict_lock: ecosystem.final_verdict_lock,
      courtroom_packet: ecosystem.courtroom_packet,
      uhap_courtroom_packet: ecosystem.courtroom_packet,

      system_status: "OK"
    };

    return res.status(200).json(finalOutput);
  } catch (error) {
    return res.status(500).json({
      endpoint_called: "oracle.js",
      engine_status: VERSION,
      system_status: "ORACLE_FAILED",
      error: error?.message || "unknown_oracle_error"
    });
  }
}