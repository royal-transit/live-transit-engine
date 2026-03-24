import swe from "swisseph-v2";

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
  "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

const NAK_LORDS = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu",
  "Jupiter", "Saturn", "Mercury", "Ketu", "Venus", "Sun",
  "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu",
  "Jupiter", "Saturn", "Mercury"
];

const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday"
];

const EXALTATION_SIGNS = {
  Sun: "Aries",
  Moon: "Taurus",
  Mars: "Capricorn",
  Mercury: "Virgo",
  Jupiter: "Cancer",
  Venus: "Pisces",
  Saturn: "Libra"
};

const DEBILITATION_SIGNS = {
  Sun: "Libra",
  Moon: "Scorpio",
  Mars: "Cancer",
  Mercury: "Pisces",
  Jupiter: "Capricorn",
  Venus: "Virgo",
  Saturn: "Aries"
};

const MICRO_ASPECT_TARGETS = [
  { name: "conjunction", angle: 0 },
  { name: "square", angle: 90 },
  { name: "trine", angle: 120 },
  { name: "opposition", angle: 180 }
];

const DASHA_SEQUENCE = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu",
  "Jupiter", "Saturn", "Mercury"
];

const VIMSHOTTARI_YEARS = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17
};

const YEAR_DAYS = 365.2425;

function normalize360(value) {
  let result = value % 360;
  if (result < 0) result += 360;
  return result;
}

function round(value, digits = 6) {
  return Number(Number(value).toFixed(digits));
}

function getSignData(longitude) {
  const normalized = normalize360(longitude);
  const signIndex = Math.floor(normalized / 30);
  return {
    sign: SIGNS[signIndex],
    degree: round(normalized % 30, 6)
  };
}

function getNakshatraData(longitude) {
  const normalized = normalize360(longitude);
  const nakSize = 360 / 27;
  const padaSize = nakSize / 4;

  const nakIndex = Math.floor(normalized / nakSize);
  const pada = Math.floor((normalized % nakSize) / padaSize) + 1;

  return {
    nakshatra: NAKSHATRAS[nakIndex],
    nakshatra_lord: NAK_LORDS[nakIndex],
    pada,
    nak_index: nakIndex,
    offset_in_nak: normalized % nakSize,
    nak_size: nakSize
  };
}

function getDignity(planetName, sign) {
  if (EXALTATION_SIGNS[planetName] === sign) return "exalted";
  if (DEBILITATION_SIGNS[planetName] === sign) return "debilitated";
  return "normal";
}

function getAngularDifference(a, b) {
  const diff = Math.abs(normalize360(a) - normalize360(b));
  return diff > 180 ? 360 - diff : diff;
}

function isCombust(planetName, sunLongitude, planetLongitude) {
  const diff = getAngularDifference(sunLongitude, planetLongitude);

  if (planetName === "Mercury") return diff < 14;
  if (planetName === "Venus") return diff < 10;
  if (planetName === "Mars") return diff < 17;
  if (planetName === "Jupiter") return diff < 11;
  if (planetName === "Saturn") return diff < 15;

  return false;
}

function getMoonPhaseFromDiff(diff) {
  return diff < 180 ? "waxing" : "waning";
}

function getTithi(sunLongitude, moonLongitude) {
  const diff = normalize360(moonLongitude - sunLongitude);
  return Math.floor(diff / 12) + 1;
}

function buildPlanetData(planetName, longitude, latitude, speed, sunLongitude) {
  const normalizedLongitude = normalize360(longitude);
  const signData = getSignData(normalizedLongitude);
  const nakData = getNakshatraData(normalizedLongitude);

  return {
    longitude: round(normalizedLongitude, 6),
    latitude: round(latitude ?? 0, 6),
    sign: signData.sign,
    degree: signData.degree,
    nakshatra: nakData.nakshatra,
    nakshatra_lord: nakData.nakshatra_lord,
    pada: nakData.pada,
    retrograde: (speed ?? 0) < 0,
    speed: round(speed ?? 0, 6),
    dignity: getDignity(planetName, signData.sign),
    combust: isCombust(planetName, sunLongitude, normalizedLongitude)
  };
}

function buildPointData(longitude) {
  const normalizedLongitude = normalize360(longitude);
  const signData = getSignData(normalizedLongitude);
  const nakData = getNakshatraData(normalizedLongitude);

  return {
    longitude: round(normalizedLongitude, 6),
    sign: signData.sign,
    degree: signData.degree,
    nakshatra: nakData.nakshatra,
    nakshatra_lord: nakData.nakshatra_lord,
    pada: nakData.pada
  };
}

function parseCalcResult(result) {
  if (!result) throw new Error("Swiss Ephemeris returned empty result");
  if (result.error) throw new Error(String(result.error));

  const longitude =
    result.longitude ??
    result.lon ??
    result.xx?.[0];

  const latitude =
    result.latitude ??
    result.lat ??
    result.xx?.[1] ??
    0;

  const speed =
    result.speed ??
    result.speedLong ??
    result.xx?.[3] ??
    0;

  if (typeof longitude !== "number" || Number.isNaN(longitude)) {
    throw new Error("Swiss Ephemeris longitude missing or invalid");
  }

  return { longitude, latitude, speed };
}

function calcPlanet(jd, planetId, flags) {
  return parseCalcResult(swe.swe_calc_ut(jd, planetId, flags));
}

function parseHouseResult(result) {
  if (!result) throw new Error("Swiss Ephemeris houses returned empty");

  const housesArray =
    result.house ??
    result.houses ??
    result.xx;

  if (!housesArray || !housesArray[1]) {
    throw new Error("houses array missing");
  }

  return housesArray;
}

function getAspect(a, b) {
  const diff = Math.abs(normalize360(a) - normalize360(b));
  const orb = Math.min(diff, 360 - diff);

  if (Math.abs(orb - 0) < 6) return "conjunction";
  if (Math.abs(orb - 60) < 5) return "sextile";
  if (Math.abs(orb - 90) < 6) return "square";
  if (Math.abs(orb - 120) < 6) return "trine";
  if (Math.abs(orb - 180) < 6) return "opposition";

  return null;
}

function getStrengthScore(planet) {
  let score = 0.5;

  if (planet.dignity === "exalted") score = 0.9;
  if (planet.dignity === "debilitated") score = 0.2;

  if (planet.retrograde) score += 0.05;
  if (planet.combust) score -= 0.15;

  if (score > 1) score = 1;
  if (score < 0) score = 0;

  return round(score, 2);
}

function calculateWholeSignHouses(ascendantLongitude) {
  const ascNormalized = normalize360(ascendantLongitude);
  const ascSignIndex = Math.floor(ascNormalized / 30);
  const houses = {};

  for (let i = 1; i <= 12; i++) {
    const signIndex = (ascSignIndex + (i - 1)) % 12;
    const signStart = signIndex * 30;
    houses[String(i)] = buildPointData(signStart);
  }

  return houses;
}

function getTargetDistance(diff, target) {
  return Math.abs(diff - target);
}

function buildIsoFromOffset(baseDate, offsetSeconds) {
  return new Date(baseDate.getTime() + offsetSeconds * 1000).toISOString();
}

function scanMicroTriggers(baseDate, jd, flags) {
  const triggers = [];
  const pairs = [
    { planet1: "Moon", planet2: "Mercury", id1: swe.SE_MOON, id2: swe.SE_MERCURY },
    { planet1: "Moon", planet2: "Mars", id1: swe.SE_MOON, id2: swe.SE_MARS },
    { planet1: "Moon", planet2: "Rahu", id1: swe.SE_MOON, id2: swe.SE_TRUE_NODE },
    { planet1: "Mercury", planet2: "Mars", id1: swe.SE_MERCURY, id2: swe.SE_MARS },
    { planet1: "Mercury", planet2: "Rahu", id1: swe.SE_MERCURY, id2: swe.SE_TRUE_NODE },
    { planet1: "Mars", planet2: "Rahu", id1: swe.SE_MARS, id2: swe.SE_TRUE_NODE },
    { planet1: "Venus", planet2: "Jupiter", id1: swe.SE_VENUS, id2: swe.SE_JUPITER },
    { planet1: "Sun", planet2: "Saturn", id1: swe.SE_SUN, id2: swe.SE_SATURN }
  ];

  for (const pair of pairs) {
    for (const target of MICRO_ASPECT_TARGETS) {
      let best = null;

      for (let offset = -300; offset <= 300; offset += 1) {
        const jdStep = jd + offset / 86400;
        const p1 = calcPlanet(jdStep, pair.id1, flags);
        const p2 = calcPlanet(jdStep, pair.id2, flags);
        const diff = getAngularDifference(p1.longitude, p2.longitude);
        const distance = getTargetDistance(diff, target.angle);

        if (!best || distance < best.distance) {
          best = {
            distance,
            offset,
            exact_angle: round(diff, 6)
          };
        }
      }

      if (best && best.distance <= 0.05) {
        triggers.push({
          planet1: pair.planet1,
          planet2: pair.planet2,
          aspect: target.name,
          exact_angle: best.exact_angle,
          exactness_gap: round(best.distance, 6),
          exact_time_utc: buildIsoFromOffset(baseDate, best.offset),
          second_offset_from_snapshot: best.offset
        });
      }
    }
  }

  return triggers;
}

function detectUltraMicroTriggers(jd, flags, baseDate) {
  const triggers = [];

  for (let offset = -300; offset <= 300; offset++) {
    const jdStep = jd + offset / 86400;

    const moon = calcPlanet(jdStep, swe.SE_MOON, flags);
    const mercury = calcPlanet(jdStep, swe.SE_MERCURY, flags);
    const mars = calcPlanet(jdStep, swe.SE_MARS, flags);

    const moonSign = getSignData(moon.longitude);
    const nak = getNakshatraData(moon.longitude);

    const diffMM = getAngularDifference(moon.longitude, mercury.longitude);
    const diffMMars = getAngularDifference(moon.longitude, mars.longitude);

    if (Math.abs(diffMM - 90) < 0.05) {
      triggers.push({
        type: "moon_mercury_exact_square",
        exact_time_utc: buildIsoFromOffset(baseDate, offset)
      });
    }

    if (Math.abs(diffMMars - 90) < 0.05) {
      triggers.push({
        type: "moon_mars_exact_square",
        exact_time_utc: buildIsoFromOffset(baseDate, offset)
      });
    }

    if (nak.offset_in_nak < 0.05) {
      triggers.push({
        type: "moon_nakshatra_entry",
        nakshatra: nak.nakshatra,
        exact_time_utc: buildIsoFromOffset(baseDate, offset)
      });
    }

    if (Math.abs(moonSign.degree - Math.round(moonSign.degree)) < 0.05) {
      triggers.push({
        type: "moon_degree_lock",
        degree: Math.round(moonSign.degree),
        exact_time_utc: buildIsoFromOffset(baseDate, offset)
      });
    }
  }

  return triggers;
}

function getSubLord(longitude) {
  const nak = getNakshatraData(longitude);
  const startLord = nak.nakshatra_lord;
  const startIndex = DASHA_SEQUENCE.indexOf(startLord);

  if (startIndex === -1) {
    return startLord;
  }

  const nakSize = nak.nak_size;
  const offset = nak.offset_in_nak;

  let cumulative = 0;

  for (let i = 0; i < DASHA_SEQUENCE.length; i++) {
    const lord = DASHA_SEQUENCE[(startIndex + i) % DASHA_SEQUENCE.length];
    const segmentSize = nakSize * (VIMSHOTTARI_YEARS[lord] / 120);
    cumulative += segmentSize;

    if (offset <= cumulative + 1e-10) {
      return lord;
    }
  }

  return startLord;
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 86400000);
}

function buildSubPeriods(startDate, endDate, startLord) {
  const periods = [];
  const totalDays = (endDate.getTime() - startDate.getTime()) / 86400000;
  const startIndex = DASHA_SEQUENCE.indexOf(startLord);

  let cursor = new Date(startDate);

  for (let i = 0; i < DASHA_SEQUENCE.length; i++) {
    const lord = DASHA_SEQUENCE[(startIndex + i) % DASHA_SEQUENCE.length];
    const fraction = VIMSHOTTARI_YEARS[lord] / 120;
    const segmentDays = totalDays * fraction;
    const segmentEnd = addDays(cursor, segmentDays);

    periods.push({
      lord,
      start: new Date(cursor),
      end: new Date(segmentEnd),
      duration_days: round(segmentDays, 4)
    });

    cursor = segmentEnd;
  }

  if (periods.length > 0) {
    periods[periods.length - 1].end = new Date(endDate);
    periods[periods.length - 1].duration_days = round(
      (endDate.getTime() - periods[periods.length - 1].start.getTime()) / 86400000,
      4
    );
  }

  return periods;
}

function findActivePeriod(periods, targetDate) {
  for (const period of periods) {
    if (targetDate >= period.start && targetDate < period.end) {
      return period;
    }
  }

  return periods[periods.length - 1] || null;
}

function buildMahadashaTimeline(birthDate, moonLongitude, targetDate) {
  const nak = getNakshatraData(moonLongitude);
  const startLord = nak.nakshatra_lord;
  const startIndex = DASHA_SEQUENCE.indexOf(startLord);

  const elapsedFraction = nak.offset_in_nak / nak.nak_size;
  const remainingFraction = 1 - elapsedFraction;
  const firstYears = VIMSHOTTARI_YEARS[startLord] * remainingFraction;

  const periods = [];
  let cursor = new Date(birthDate);

  for (let i = 0; i < 18; i++) {
    const lord = DASHA_SEQUENCE[(startIndex + i) % DASHA_SEQUENCE.length];
    const years = i === 0 ? firstYears : VIMSHOTTARI_YEARS[lord];
    const days = years * YEAR_DAYS;
    const end = addDays(cursor, days);

    periods.push({
      lord,
      start: new Date(cursor),
      end: new Date(end),
      duration_years: round(years, 6),
      duration_days: round(days, 4)
    });

    cursor = end;

    if (cursor > addDays(targetDate, YEAR_DAYS * 2)) {
      break;
    }
  }

  return periods;
}

function parseBirthDateTime(input) {
  if (!input || typeof input !== "string") return null;

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}

function buildDashaContext(birthDateTime, now, flags) {
  const utHour =
    birthDateTime.getUTCHours() +
    birthDateTime.getUTCMinutes() / 60 +
    birthDateTime.getUTCSeconds() / 3600;

  const birthJd = swe.swe_julday(
    birthDateTime.getUTCFullYear(),
    birthDateTime.getUTCMonth() + 1,
    birthDateTime.getUTCDate(),
    utHour,
    swe.SE_GREG_CAL
  );

  const birthMoon = calcPlanet(birthJd, swe.SE_MOON, flags);
  const birthMoonNak = getNakshatraData(birthMoon.longitude);

  const mahaTimeline = buildMahadashaTimeline(birthDateTime, birthMoon.longitude, now);
  const activeMaha = findActivePeriod(mahaTimeline, now);

  const antarTimeline = buildSubPeriods(activeMaha.start, activeMaha.end, activeMaha.lord);
  const activeAntar = findActivePeriod(antarTimeline, now);

  const pratyantarTimeline = buildSubPeriods(activeAntar.start, activeAntar.end, activeAntar.lord);
  const activePratyantar = findActivePeriod(pratyantarTimeline, now);

  return {
    status: "active",
    birth_reference: {
      birth_datetime_utc: birthDateTime.toISOString(),
      birth_moon_longitude: round(birthMoon.longitude, 6),
      birth_moon_nakshatra: birthMoonNak.nakshatra,
      birth_moon_nakshatra_lord: birthMoonNak.nakshatra_lord
    },
    mahadasha: {
      lord: activeMaha.lord,
      start: activeMaha.start.toISOString(),
      end: activeMaha.end.toISOString()
    },
    antardasha: {
      lord: activeAntar.lord,
      start: activeAntar.start.toISOString(),
      end: activeAntar.end.toISOString()
    },
    pratyantar: {
      lord: activePratyantar.lord,
      start: activePratyantar.start.toISOString(),
      end: activePratyantar.end.toISOString()
    }
  };
}

export default async function handler(req, res) {
  try {
    const now = new Date();

    const lat = parseFloat(req.query?.lat ?? "51.5074");
    const lon = parseFloat(req.query?.lon ?? "-0.1278");
    const birthDateTimeRaw = req.query?.birth_datetime ?? null;

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({
        error: "invalid_location_input",
        details: "lat and lon must be valid numbers"
      });
    }

    swe.swe_set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);

    const utHour =
      now.getUTCHours() +
      now.getUTCMinutes() / 60 +
      now.getUTCSeconds() / 3600;

    const jd = swe.swe_julday(
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
      now.getUTCDate(),
      utHour,
      swe.SE_GREG_CAL
    );

    const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL;

    const sun = calcPlanet(jd, swe.SE_SUN, flags);
    const moon = calcPlanet(jd, swe.SE_MOON, flags);
    const mercury = calcPlanet(jd, swe.SE_MERCURY, flags);
    const venus = calcPlanet(jd, swe.SE_VENUS, flags);
    const mars = calcPlanet(jd, swe.SE_MARS, flags);
    const jupiter = calcPlanet(jd, swe.SE_JUPITER, flags);
    const saturn = calcPlanet(jd, swe.SE_SATURN, flags);
    const rahu = calcPlanet(jd, swe.SE_TRUE_NODE, flags);

    const ketuLongitude = normalize360(rahu.longitude + 180);

    const generatedAt = now.toISOString();
    const snapshotAgeSeconds = 0;

    const result = {
      timestamp: generatedAt,
      authority: {
        source: "Swiss Ephemeris",
        zodiac: "sidereal",
        ayanamsa: "lahiri",
        node_mode: "true_node"
      },
      quality: {
        q_grade: "Q3",
        timing_precision: "live_degree_level",
        integrity_status: "clean_single_source"
      },
      freshness: {
        generated_at: generatedAt,
        age_seconds: snapshotAgeSeconds,
        status: "LIVE"
      },
      integrity: {
        status: "CLEAN",
        issues: []
      },
      location_used: {
        latitude: round(lat, 6),
        longitude: round(lon, 6)
      }
    };

    const lunarDiff = normalize360(moon.longitude - sun.longitude);

    result.panchanga = {
      tithi: getTithi(sun.longitude, moon.longitude),
      weekday: WEEKDAYS[now.getUTCDay()],
      weekday_number: now.getUTCDay(),
      moon_phase: getMoonPhaseFromDiff(lunarDiff)
    };

    result.sun = buildPlanetData("Sun", sun.longitude, sun.latitude, sun.speed, sun.longitude);
    result.moon = buildPlanetData("Moon", moon.longitude, moon.latitude, moon.speed, sun.longitude);
    result.mercury = buildPlanetData("Mercury", mercury.longitude, mercury.latitude, mercury.speed, sun.longitude);
    result.venus = buildPlanetData("Venus", venus.longitude, venus.latitude, venus.speed, sun.longitude);
    result.mars = buildPlanetData("Mars", mars.longitude, mars.latitude, mars.speed, sun.longitude);
    result.jupiter = buildPlanetData("Jupiter", jupiter.longitude, jupiter.latitude, jupiter.speed, sun.longitude);
    result.saturn = buildPlanetData("Saturn", saturn.longitude, saturn.latitude, saturn.speed, sun.longitude);
    result.rahu = buildPlanetData("Rahu", rahu.longitude, rahu.latitude, rahu.speed, sun.longitude);
    result.ketu = buildPlanetData("Ketu", ketuLongitude, rahu.latitude, rahu.speed, sun.longitude);

    const housesRaw = swe.swe_houses(jd, lat, lon, "P");
    const housesArray = parseHouseResult(housesRaw);
    const ascendantLongitude = normalize360(housesArray[1]);

    result.ascendant = buildPointData(ascendantLongitude);
    result.houses = calculateWholeSignHouses(ascendantLongitude);

    result.kp_cusps = {};
    for (let i = 1; i <= 12; i++) {
      const rawValue = housesArray[i];

      if (typeof rawValue !== "number" || Number.isNaN(rawValue)) {
        continue;
      }

      const cuspLongitude = normalize360(rawValue);
      const signData = getSignData(cuspLongitude);
      const nakData = getNakshatraData(cuspLongitude);
      const subLord = getSubLord(cuspLongitude);

      result.kp_cusps[i] = {
        longitude: round(cuspLongitude, 6),
        sign: signData.sign,
        degree: signData.degree,
        star_lord: nakData.nakshatra_lord,
        sub_lord: subLord
      };
    }

    const birthDateTime = parseBirthDateTime(birthDateTimeRaw);

    if (birthDateTime) {
      result.dasha = buildDashaContext(birthDateTime, now, flags);
    } else {
      result.dasha = {
        status: "absent_no_birth_datetime",
        required_input: "birth_datetime",
        format: "ISO 8601 with timezone, e.g. 1988-12-11T10:59:00+06:00"
      };
    }

    const planetLongitudes = {
      Sun: result.sun.longitude,
      Moon: result.moon.longitude,
      Mercury: result.mercury.longitude,
      Venus: result.venus.longitude,
      Mars: result.mars.longitude,
      Jupiter: result.jupiter.longitude,
      Saturn: result.saturn.longitude,
      Rahu: result.rahu.longitude,
      Ketu: result.ketu.longitude
    };

    const aspectKeys = Object.keys(planetLongitudes);
    const aspects = [];

    for (let i = 0; i < aspectKeys.length; i++) {
      for (let j = i + 1; j < aspectKeys.length; j++) {
        const p1 = aspectKeys[i];
        const p2 = aspectKeys[j];
        const aspect = getAspect(planetLongitudes[p1], planetLongitudes[p2]);

        if (aspect) {
          aspects.push({
            planet1: p1,
            planet2: p2,
            type: aspect
          });
        }
      }
    }

    result.aspects = aspects;

    result.strength = {
      Sun: getStrengthScore(result.sun),
      Moon: getStrengthScore(result.moon),
      Mercury: getStrengthScore(result.mercury),
      Venus: getStrengthScore(result.venus),
      Mars: getStrengthScore(result.mars),
      Jupiter: getStrengthScore(result.jupiter),
      Saturn: getStrengthScore(result.saturn)
    };

    const microTriggers = [
      ...scanMicroTriggers(now, jd, flags),
      ...detectUltraMicroTriggers(jd, flags, now)
    ];

    result.micro_window = {
      scan_range_seconds: 300,
      step_seconds: 1,
      trigger_count: microTriggers.length,
      precision_mode: "ultra_micro_scan"
    };

    result.micro_status = {
      trigger_present: microTriggers.length > 0,
      precision_allowed: microTriggers.length > 0 ? "minute_candidate" : "window_only"
    };

    result.micro_triggers = microTriggers;

    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({
      error: "transit_engine_failed",
      details: error && error.message ? error.message : "unknown transit error"
    });
  }
}
