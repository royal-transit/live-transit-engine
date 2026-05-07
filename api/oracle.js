// FULL REPLACEMENT
// /api/oracle.js
// ELITE DST SAFE LIVE ORACLE ROUTER
// FULL FILE — NO PARTIAL PATCH

import { predictiveSmartMode } from "./predictiveSmartMode.js";
import { buildDeterministicOracleEcosystem } from "./oracleEcosystem.js";

const VERSION =
  "LIVE_ORACLE_ROUTER_V13_ELITE_DST_SAFE_DETERMINISTIC";

function s(v) {
  return String(v || "").trim();
}

function low(v) {
  return s(v).toLowerCase();
}

function n(v, fb = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fb;
}

function arr(v) {
  return Array.isArray(v) ? v : [];
}

// ======================================================
// DST / TIMEZONE SAFE ENGINE
// ======================================================

function getOffsetForTimezone(date, timeZone = "Europe/London") {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      timeZoneName: "shortOffset",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).formatToParts(date);

    const tz =
      parts.find((p) => p.type === "timeZoneName")?.value || "GMT";

    const match = tz.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);

    if (!match) return "+00:00";

    const rawHour = Number(match[1]);
    const sign = rawHour >= 0 ? "+" : "-";

    const hh = String(Math.abs(rawHour)).padStart(2, "0");
    const mm = match[2] || "00";

    return `${sign}${hh}:${mm}`;
  } catch {
    return "+00:00";
  }
}

function buildBirthDateTimeFromQuery(query = {}) {
  if (query.birth_datetime) {
    return s(query.birth_datetime);
  }

  const dob = s(query.dob);
  const tob = s(query.tob);

  if (!dob || !tob) return null;

  const timezone =
    s(query.timezone) ||
    s(query.timezone_name) ||
    "Europe/London";

  const probeDate = new Date(`${dob}T${tob}:00Z`);

  const offset = getOffsetForTimezone(probeDate, timezone);

  return `${dob}T${tob}:00${offset}`;
}

// ======================================================
// CLIENT MODE
// ======================================================

function buildClientMode(query = {}) {
  const name = s(query.name);
  const birthDatetime = buildBirthDateTimeFromQuery(query);

  if (birthDatetime) {
    return {
      subject_mode: name
        ? "NAME_FULL_DETAIL_LIVE"
        : "FULL_BIRTH_LIVE",

      identity_depth: "LEVEL_5_FULL_BIRTH_LIVE",
      precision_mode: "FULL_BIRTH_LIVE",

      subject_name: name || null,
      normalized_name: name ? low(name) : null,

      input_context: {
        question: s(query.question || "raw transit"),
        facts: s(query.facts || ""),

        lat: query.lat ?? null,
        lon: query.lon ?? null,

        birth_datetime: birthDatetime,

        dob: query.dob ?? null,
        tob: query.tob ?? null,
        pob: query.pob ?? null,

        timezone:
          s(query.timezone) ||
          s(query.timezone_name) ||
          "Europe/London"
      },

      timezone_runtime: {
        mode: "IANA_TIMEZONE_DYNAMIC_DST",
        timezone:
          s(query.timezone) ||
          s(query.timezone_name) ||
          "Europe/London",

        resolved_offset: birthDatetime.slice(-6)
      },

      usage_rule:
        "DST safe full birth mode active. Dynamic timezone offset resolved automatically."
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
        question: s(query.question || "raw transit"),
        facts: s(query.facts || ""),

        lat: query.lat ?? null,
        lon: query.lon ?? null,

        birth_datetime: null,
        dob: null,
        tob: null,
        pob: null,

        timezone:
          s(query.timezone) ||
          s(query.timezone_name) ||
          "Europe/London"
      },

      timezone_runtime: {
        mode: "LIVE_DYNAMIC_TIMEZONE",
        timezone:
          s(query.timezone) ||
          s(query.timezone_name) ||
          "Europe/London"
      },

      usage_rule:
        "Name only live mode. No natal certainty allowed."
    };
  }

  return {
    subject_mode: "UNIVERSAL_LIVE_ONLY",

    identity_depth: "LEVEL_1_UNIVERSAL_LIVE",
    precision_mode: "LIVE_ONLY",

    subject_name: null,
    normalized_name: null,

    input_context: {
      question: s(query.question || "raw transit"),
      facts: s(query.facts || ""),

      lat: query.lat ?? null,
      lon: query.lon ?? null,

      birth_datetime: null,
      dob: null,
      tob: null,
      pob: null,

      timezone:
        s(query.timezone) ||
        s(query.timezone_name) ||
        "Europe/London"
    },

    timezone_runtime: {
      mode: "LIVE_DYNAMIC_TIMEZONE",
      timezone:
        s(query.timezone) ||
        s(query.timezone_name) ||
        "Europe/London"
    },

    usage_rule:
      "Universal live mode using DST-safe timezone runtime."
  };
}

// ======================================================
// URL BUILDER
// ======================================================

function buildUrl(baseUrl, path, query = {}) {
  const params = new URLSearchParams();

  if (query.lat) params.set("lat", query.lat);
  if (query.lon) params.set("lon", query.lon);

  const timezone =
    s(query.timezone) ||
    s(query.timezone_name);

  if (timezone) {
    params.set("timezone", timezone);
  }

  const birthDatetime = buildBirthDateTimeFromQuery(query);

  if (birthDatetime) {
    params.set("birth_datetime", birthDatetime);
  }

  return `${baseUrl}${path}?${params.toString()}`;
}

// ======================================================
// PLANETS
// ======================================================

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

// ======================================================
// DASHA / DIVISIONAL
// ======================================================

function buildDashaSummary(transit = {}) {
  if (transit?.dasha?.status === "active") {
    return {
      ...transit.dasha,
      natal_timing_permission: "OPEN"
    };
  }

  return {
    status:
      transit?.dasha?.status ||
      "absent_no_birth_datetime",

    required_input:
      "birth_datetime OR dob+tob+timezone",

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
    status:
      transit?.divisional?.status ||
      "absent_no_birth_datetime",

    supported: ["D7", "D9", "D10", "D12", "D24"],

    divisional_reinforcement_grade:
      "WEAK_OR_ABSENT"
  };
}

// ======================================================
// CONFIDENCE
// ======================================================

function buildConfidence({
  triggerPresent,
  exactTimeCandidate,
  convergenceStrength,
  activeTriggerSnapshots,
  transit,
  clientMode
}) {
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

  if (
    convergenceStrength === "high" ||
    n(convergenceStrength) >= 0.75
  ) {
    score += 25;
    reasons.push("high convergence");
  } else if (
    convergenceStrength === "medium" ||
    n(convergenceStrength) >= 0.4
  ) {
    score += 15;
    reasons.push("medium convergence");
  } else {
    reasons.push("low convergence");
  }

  if (activeTriggerSnapshots >= 5) {
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

  score = Math.max(0, Math.min(score, 95));

  return {
    confidence_score: score,

    confidence_level:
      score >= 75
        ? "HIGH"
        : score >= 60
        ? "MEDIUM"
        : "LOW",

    confidence_reasons: reasons
  };
}

// ======================================================
// MAIN HANDLER
// ======================================================

export default async function handler(req, res) {
  try {
    const query = req.query || {};

    const clientMode = buildClientMode(query);

    const baseUrl =
      "https://live-transit-engine.vercel.app";

    const transitUrl = buildUrl(
      baseUrl,
      "/api/transit",
      query
    );

    const multiUrl = buildUrl(
      baseUrl,
      "/api/multi-snapshot",
      query
    );

    const [transitRes, multiRes] =
      await Promise.all([
        fetch(transitUrl),
        fetch(multiUrl)
      ]);

    if (!transitRes.ok) {
      throw new Error(
        `transit_fetch_failed_${transitRes.status}`
      );
    }

    if (!multiRes.ok) {
      throw new Error(
        `multi_snapshot_fetch_failed_${multiRes.status}`
      );
    }

    const transit = await transitRes.json();
    const multi = await multiRes.json();

    const triggerPresent =
      transit?.micro_status?.trigger_present ===
        true ||
      n(multi?.active_trigger_snapshots) > 0;

    const exactTimeCandidate =
      transit?.micro_dominant_trigger
        ?.peak_time_utc ||
      multi?.micro_dominant_trigger
        ?.peak_time_utc ||
      null;

    const dominantTriggerIdentity =
      transit?.micro_dominant_trigger?.type ||
      multi?.dominant_trigger_identity ||
      null;

    const convergenceStrength =
      multi?.convergence_strength ||
      transit?.micro_convergence
        ?.convergence_strength ||
      "low";

    const clusterDensity =
      multi?.cluster_density ||
      transit?.micro_convergence
        ?.cluster_density ||
      0;

    const activeTriggerSnapshots = n(
      multi?.active_trigger_snapshots
    );

    const confidence = buildConfidence({
      triggerPresent,
      exactTimeCandidate,
      convergenceStrength,
      activeTriggerSnapshots,
      transit,
      clientMode
    });

    const basePacket = {
      endpoint_called: "oracle.js",

      engine_status: VERSION,
      oracle_version: VERSION,

      timestamp: new Date().toISOString(),

      client_mode: clientMode,

      authority: transit?.authority || null,
      freshness: transit?.freshness || null,
      integrity: transit?.integrity || null,

      location_used:
        transit?.location_used || null,

      panchanga:
        transit?.panchanga || null,

      ascendant:
        transit?.ascendant || null,

      houses:
        transit?.houses || null,

      kp_cusps:
        transit?.kp_cusps || null,

      planets: buildPlanets(transit),

      aspects_summary:
        arr(transit?.aspects).slice(0, 50),

      strength:
        transit?.strength || null,

      dasha:
        buildDashaSummary(transit),

      divisional:
        buildDivisionalSummary(transit),

      raw_micro: {
        transit_micro_window:
          transit?.micro_window || null,

        transit_micro_status:
          transit?.micro_status || null,

        transit_micro_convergence:
          transit?.micro_convergence || null,

        transit_micro_dominant_trigger:
          transit?.micro_dominant_trigger ||
          null,

        transit_micro_clusters:
          transit?.micro_clusters || [],

        multi_snapshot_summary: {
          active_trigger_snapshots:
            activeTriggerSnapshots,

          convergence_strength:
            convergenceStrength,

          cluster_density:
            clusterDensity,

          dominant_trigger_identity:
            dominantTriggerIdentity
        }
      },

      timing_evidence: {
        trigger_present: triggerPresent,

        precision_allowed:
          triggerPresent &&
          exactTimeCandidate
            ? "minute_candidate"
            : "window_only",

        dominant_trigger_identity:
          dominantTriggerIdentity,

        exact_time_candidate_utc:
          exactTimeCandidate,

        exact_date_candidate_utc:
          exactTimeCandidate
            ? exactTimeCandidate.split("T")[0]
            : null,

        convergence_strength:
          convergenceStrength,

        cluster_density:
          clusterDensity,

        active_trigger_snapshots:
          activeTriggerSnapshots,

        timing_grade:
          triggerPresent &&
          exactTimeCandidate
            ? "EXACT_LOCK"
            : "WINDOW_OR_PREDICTIVE",

        timing_source:
          triggerPresent &&
          exactTimeCandidate
            ? "present_trigger"
            : "future_or_window"
      },

      timing_decision: {
        mode:
          triggerPresent &&
          exactTimeCandidate
            ? "exact_candidate"
            : "window_only",

        exact_time_candidate_utc:
          exactTimeCandidate,

        reason:
          triggerPresent &&
          exactTimeCandidate
            ? "minute candidate supported by trigger and convergence"
            : "exact minute not fully unlocked"
      },

      confidence,

      system_status: "BASE_PACKET_OK"
    };

    // ======================================================
    // PREDICTIVE SMART MODE
    // ======================================================

    const predictivePacket =
      predictiveSmartMode(basePacket);

    // ======================================================
    // ECOSYSTEM
    // ======================================================

    const ecosystem =
      buildDeterministicOracleEcosystem({
        clientMode,
        transit,
        multi,
        predictivePacket
      });

    // ======================================================
    // FINAL
    // ======================================================

    return res.status(200).json({
      ...predictivePacket,

      deterministic_ecosystem:
        ecosystem,

      raw_evidence:
        ecosystem.raw_evidence,

      trigger_maturity:
        ecosystem.trigger_maturity,

      domain_matrix:
        ecosystem.domain_matrix,

      event_dna:
        ecosystem.event_dna,

      legal_gates:
        ecosystem.legal_gates,

      causal_chain:
        ecosystem.causal_chain,

      precision_law:
        ecosystem.precision_law,

      elite_scoring_matrix:
        ecosystem.elite_scoring_matrix,

      probability_collapse:
        ecosystem.probability_collapse,

      event_interpretation:
        ecosystem.event_interpretation,

      oracle_verdict:
        ecosystem.oracle_verdict,

      remedy_decision_support:
        ecosystem.remedy_decision_support,

      final_verdict_lock:
        ecosystem.final_verdict_lock,

      courtroom_packet:
        ecosystem.courtroom_packet,

      uhap_courtroom_packet:
        ecosystem.courtroom_packet,

      system_status: "OK",

      oracle_mode:
        "ELITE_DST_SAFE_DETERMINISTIC_ORACLE_ECOSYSTEM"
    });
  } catch (error) {
    return res.status(500).json({
      endpoint_called: "oracle.js",

      engine_status: VERSION,

      system_status: "ORACLE_FAILED",

      error:
        error?.message ||
        "unknown_oracle_error"
    });
  }
}