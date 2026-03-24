export default async function handler(req, res) {
  try {
    const input = req.method === "POST" ? (req.body || {}) : (req.query || {});

    let lat = parseFloat(input.lat);
    let lon = parseFloat(input.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      lat = 51.5074;
      lon = -0.1278;
    }

    const birthDatetime =
      input.birth_datetime ??
      input.birthDatetime ??
      input.birth_iso ??
      input.dob_time_iso ??
      null;

    const natalMoonLongitudeRaw =
      input.natal_moon_longitude ??
      input.natalMoonLongitude ??
      input.birth_moon_longitude ??
      input.birthMoonLongitude ??
      null;

    const natalMoonLongitude =
      natalMoonLongitudeRaw === null || natalMoonLongitudeRaw === undefined || natalMoonLongitudeRaw === ""
        ? null
        : Number(natalMoonLongitudeRaw);

    const proto =
      req.headers["x-forwarded-proto"] ||
      req.headers["x-forwarded-protocol"] ||
      "https";

    const host = req.headers.host;
    const base = ${proto}://${host}/api;

    const qs = ?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)};

    async function safeFetchJson(url) {
      try {
        const response = await fetch(url);
        return await response.json();
      } catch (error) {
        return {
          error: "fetch_failed",
          details: error && error.message ? error.message : "unknown fetch failure",
          url
        };
      }
    }

    // PRIMARY AUTHORITY: transit.js only
    const transit = await safeFetchJson(${base}/transit${qs});

    // OPTIONAL SUPPORT ONLY: divisional transit packet
    const divisional = await safeFetchJson(${base}/divisional${qs});

    // Dasha MUST use natal moon + birth datetime, never transit moon
    let dasha = {
      mode: "unavailable",
      reason: "natal_birth_locked_inputs_missing",
      confidence: {
        level: "restricted",
        reason: "birth_datetime_and_natal_moon_longitude_required"
      }
    };

    if (
      birthDatetime &&
      Number.isFinite(natalMoonLongitude)
    ) {
      const dashaQs =
        ?moon_longitude=${encodeURIComponent(natalMoonLongitude)} +
        &birth_datetime=${encodeURIComponent(birthDatetime)} +
        &as_of=${encodeURIComponent((transit && transit.timestamp) ? transit.timestamp : new Date().toISOString())};

      dasha = await safeFetchJson(${base}/dasha${dashaQs});
    }

    // KP is intentionally quarantined until rebuilt properly
    const kp = {
      status: "excluded_from_authority",
      reason: "current_kp_engine_static_and_not_chart_synced"
    };

    // Use transit packet's own aspects/strength/micro data only
    const aspects = {
      timestamp: transit && transit.timestamp ? transit.timestamp : new Date().toISOString(),
      total_aspects: Array.isArray(transit?.aspects) ? transit.aspects.length : 0,
      aspects: Array.isArray(transit?.aspects) ? transit.aspects : [],
      source: "transit_packet_embedded"
    };

    const strength = {
      timestamp: transit && transit.timestamp ? transit.timestamp : new Date().toISOString(),
      strength: transit && transit.strength ? transit.strength : {},
      source: "transit_packet_embedded"
    };

    const microWindow = transit && transit.micro_window ? transit.micro_window : {
      scan_range_seconds: null,
      step_seconds: null,
      trigger_count: null,
      precision_mode: "unavailable"
    };

    const microTriggers = Array.isArray(transit?.micro_triggers) ? transit.micro_triggers : [];

    // Honest packet integrity
    const hasTransit =
      transit &&
      !transit.error &&
      transit.sun &&
      transit.moon &&
      transit.ascendant;

    const hasBirthLockedDasha =
      dasha &&
      !dasha.error &&
      dasha.mode === "full_natal";

    const divisionalStatus =
      divisional && !divisional.error
        ? "dynamic_support_only"
        : "unavailable";

    let calculationIntegrity = "restricted_single_authority";
    if (hasTransit && hasBirthLockedDasha) {
      calculationIntegrity = "single_authority_with_birth_locked_dasha";
    } else if (hasTransit) {
      calculationIntegrity = "single_authority_transit_only";
    }

    let dGrade = "D1";
    if (birthDatetime && Number.isFinite(natalMoonLongitude)) {
      dGrade = "D3";
    }

    let qGrade = "Q0";
    if (hasTransit && transit.micro_window && typeof transit.micro_window.trigger_count === "number") {
      qGrade = "Q2";
    }
    if (hasTransit && transit.confidence && transit.confidence.data_source === "Swiss Ephemeris") {
      qGrade = "Q3";
    }

    let timingPrecision = "restricted";
    if (qGrade === "Q3" && hasBirthLockedDasha && microTriggers.length > 0) {
      timingPrecision = "high_precision";
    } else if (qGrade === "Q3" && hasBirthLockedDasha) {
      timingPrecision = "hour_range_or_date_bound";
    } else if (qGrade === "Q2" || qGrade === "Q3") {
      timingPrecision = "date_bound_or_conditional";
    }

    let packetConfidence = "restricted";
    if (hasTransit && hasBirthLockedDasha && microTriggers.length > 0) {
      packetConfidence = "high";
    } else if (hasTransit && hasBirthLockedDasha) {
      packetConfidence = "moderate";
    } else if (hasTransit) {
      packetConfidence = "limited";
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),

      authority: {
        engine_name: "ROYEL_ASTRO_ENGINE",
        primary_calculation_authority: "Swiss Ephemeris",
        zodiac: "sidereal",
        ayanamsa: "lahiri"
      },

      integrity: {
        calculation_integrity: calculationIntegrity,
        primary_source: "Swiss Ephemeris",
        kp_source: "excluded_until_rebuilt",
        ayanamsa: "Lahiri",
        zodiac: "sidereal",
        data_pipeline: "single_authority_transit_packet",
        integrity_status: hasTransit ? "usable_with_restrictions" : "blocked"
      },

      quality: {
        d_grade: dGrade,
        q_grade: qGrade,
        source_reliability: hasTransit ? "high" : "restricted",
        timing_precision: timingPrecision,
        packet_confidence: packetConfidence
      },

      evidence_packet: {
        transit: transit,
        kp: kp,
        dasha: dasha,
        divisional: {
          status: divisionalStatus,
          packet: divisionalStatus === "dynamic_support_only" ? divisional : null
        },
        aspects: aspects,
        strength: strength,
        micro_window: microWindow,
        micro_triggers: microTriggers
      }
    });
  } catch (error) {
    return res.status(200).json({
      status: "oracle_error",
      message: error && error.message ? error.message : "unknown oracle error"
    });
  }
}
