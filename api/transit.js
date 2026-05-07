import swe from "swisseph-v2";

const ENGINE_STATUS = "UNIVERSAL_LIVE_TRANSIT_ORACLE_V9_ELITE_INPUT_NORMALIZED";

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const SIGNS_BN = {
  Aries: "মেষ", Taurus: "বৃষ", Gemini: "মিথুন", Cancer: "কর্কট",
  Leo: "সিংহ", Virgo: "কন্যা", Libra: "তুলা", Scorpio: "বৃশ্চিক",
  Sagittarius: "ধনু", Capricorn: "মকর", Aquarius: "কুম্ভ", Pisces: "মীন"
};

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

const CHALDEAN = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8
};

const YEAR_DAYS = 365.2425;
const NAK_SIZE = 360 / 27;
const PADA_SIZE = NAK_SIZE / 4;

const TRIGGER_PAIRS = [
  { planet1: "Moon", planet2: "Mercury", id1: swe.SE_MOON, id2: swe.SE_MERCURY },
  { planet1: "Moon", planet2: "Mars", id1: swe.SE_MOON, id2: swe.SE_MARS },
  { planet1: "Moon", planet2: "Rahu", id1: swe.SE_MOON, id2: swe.SE_TRUE_NODE },
  { planet1: "Moon", planet2: "Saturn", id1: swe.SE_MOON, id2: swe.SE_SATURN },
  { planet1: "Moon", planet2: "Jupiter", id1: swe.SE_MOON, id2: swe.SE_JUPITER },
  { planet1: "Mercury", planet2: "Mars", id1: swe.SE_MERCURY, id2: swe.SE_MARS },
  { planet1: "Mercury", planet2: "Rahu", id1: swe.SE_MERCURY, id2: swe.SE_TRUE_NODE },
  { planet1: "Mars", planet2: "Rahu", id1: swe.SE_MARS, id2: swe.SE_TRUE_NODE },
  { planet1: "Sun", planet2: "Saturn", id1: swe.SE_SUN, id2: swe.SE_SATURN },
  { planet1: "Venus", planet2: "Jupiter", id1: swe.SE_VENUS, id2: swe.SE_JUPITER }
];

const MICRO_ASPECT_TARGETS = [
  { name: "conjunction", angle: 0, orb: 0.05 },
  { name: "sextile", angle: 60, orb: 0.05 },
  { name: "square", angle: 90, orb: 0.05 },
  { name: "trine", angle: 120, orb: 0.05 },
  { name: "opposition", angle: 180, orb: 0.05 }
];

function norm(v) {
  return String(v ?? "").trim();
}

function cleanNullable(v) {
  const s = norm(v);
  return s ? s : null;
}

function normalize360(value) {
  let result = value % 360;
  if (result < 0) result += 360;
  return result;
}

function round(value, digits = 6) {
  return Number(Number(value).toFixed(digits));
}

function digitalRoot(n) {
  let x = Math.abs(Number(n) || 0);
  while (x > 9) x = String(x).split("").reduce((a, b) => a + Number(b), 0);
  return x;
}

function buildNameProfile(rawName) {
  const clean = norm(rawName).replace(/[^a-zA-Z\s]/g, "").replace(/\s+/g, " ").trim();
  const upper = clean.toUpperCase();
  const tokens = clean ? clean.toLowerCase().split(" ") : [];
  const values = upper.replace(/\s/g, "").split("").map((c) => CHALDEAN[c] || 0).filter(Boolean);
  const total = values.reduce((a, b) => a + b, 0);
  const root = total ? digitalRoot(total) : null;

  const firstLetter = upper[0] || null;
  const firstSoundKey = firstLetter ? firstLetter.toLowerCase() : null;

  const rashiByFirst = {
    A: "Aries", L: "Aries", E: "Aries",
    B: "Taurus", V: "Taurus", U: "Taurus", W: "Taurus",
    K: "Gemini", C: "Gemini", G: "Gemini",
    D: "Cancer", H: "Cancer",
    M: "Leo", T: "Leo",
    P: "Virgo",
    R: "Libra",
    N: "Scorpio", Y: "Scorpio",
    S: "Sagittarius",
    J: "Capricorn",
    Q: "Aquarius", X: "Aquarius",
    O: "Pisces", Z: "Pisces", F: "Pisces"
  };

  const derivedRashi = rashiByFirst || null;

  return {
    raw_name: rawName || null,
    normalized_name: clean ? clean.toLowerCase() : null,
    tokens,
    token_count: tokens.length,
    first_letter: firstLetter,
    first_sound_key: firstSoundKey,
    name_length: upper.replace(/\s/g, "").length,
    syllable_count: tokens.length || null,
    values,
    compound_number: total || null,
    root_number: root,
    vibration_class:
      root === 1 ? "COMMAND" :
      root === 2 ? "EMOTIONAL" :
      root === 3 ? "EXPRESSIVE" :
      root === 4 ? "STRUCTURAL" :
      root === 5 ? "MERCURIAL" :
      root === 6 ? "VENUSIAN" :
      root === 7 ? "MYSTIC" :
      root === 8 ? "SATURNIC" :
      root === 9 ? "MARTIAL" :
      "UNKNOWN",
    derived_rashi_sign: derivedRashi,
    derived_rashi_bengali: derivedRashi ? SIGNS_BN[derivedRashi] : null,
    alias_candidates: clean ? [clean, clean.toLowerCase()] : []
  };
}

function normalizeDob(dob) {
  const s = cleanNullable(dob);
  if (!s) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m) {
    const dd = String(m[1]).padStart(2, "0");
    const mm = String(m[2]).padStart(2, "0");
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

function normalizeTob(tob) {
  const s = cleanNullable(tob);
  if (!s) return null;
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const hh = String(Math.min(23, Math.max(0, Number(m[1])))).padStart(2, "0");
  const mm = String(Math.min(59, Math.max(0, Number(m[2])))).padStart(2, "0");
  const ss = String(Math.min(59, Math.max(0, Number(m[3] || 0)))).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function normalizeOffset(offset) {
  const s = cleanNullable(offset) || "+00:00";
  if (/^[+-]\d{2}:\d{2}$/.test(s)) return s;
  if (/^[+-]\d{1,2}$/.test(s)) return `${s[0]}${s.slice(1).padStart(2, "0")}:00`;
  return "+00:00";
}

function buildBirthDateTime({ birth_datetime, dob, tob, timezone_offset }) {
  const direct = cleanNullable(birth_datetime);
  if (direct) {
    const d = new Date(direct);
    if (!Number.isNaN(d.getTime())) return d;
  }

  const ymd = normalizeDob(dob);
  const time = normalizeTob(tob);
  const offset = normalizeOffset(timezone_offset);

  if (!ymd || !time) return null;

  const iso = `${ymd}T${time}${offset}`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getSignData(longitude) {
  const normalized = normalize360(longitude);
  const signIndex = Math.floor(normalized / 30);
  return {
    sign: SIGNS[signIndex],
    sign_index: signIndex,
    degree: round(normalized % 30, 6)
  };
}

function getNakshatraData(longitude) {
  const normalized = normalize360(longitude);
  const nakIndex = Math.floor(normalized / NAK_SIZE);
  const offsetInNak = normalized % NAK_SIZE;
  const pada = Math.floor(offsetInNak / PADA_SIZE) + 1;

  return {
    nakshatra: NAKSHATRAS[nakIndex],
    nakshatra_lord: NAK_LORDS[nakIndex],
    pada,
    nak_index: nakIndex,
    offset_in_nak: offsetInNak,
    nak_size: NAK_SIZE
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

  const longitude = result.longitude ?? result.lon ?? result.xx?.[0];
  const latitude = result.latitude ?? result.lat ?? result.xx?.[1] ?? 0;
  const speed = result.speed ?? result.speedLong ?? result.xx?.[3] ?? 0;

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
  const housesArray = result.house ?? result.houses ?? result.xx;
  if (!housesArray || !housesArray[1]) throw new Error("houses array missing");
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
    houses[String(i)] = buildPointData(signIndex * 30);
  }
  return houses;
}

function buildIsoFromOffset(baseDate, offsetSeconds) {
  return new Date(baseDate.getTime() + offsetSeconds * 1000).toISOString();
}

function getSubLord(longitude) {
  const nak = getNakshatraData(longitude);
  const startLord = nak.nakshatra_lord;
  const startIndex = DASHA_SEQUENCE.indexOf(startLord);

  if (startIndex === -1) return startLord;

  let cumulative = 0;
  for (let i = 0; i < DASHA_SEQUENCE.length; i++) {
    const lord = DASHA_SEQUENCE[(startIndex + i) % DASHA_SEQUENCE.length];
    const segmentSize = nak.nak_size * (VIMSHOTTARI_YEARS[lord] / 120);
    cumulative += segmentSize;
    if (nak.offset_in_nak <= cumulative + 1e-10) return lord;
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
    if (targetDate >= period.start && targetDate < period.end) return period;
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
    if (cursor > addDays(targetDate, YEAR_DAYS * 2)) break;
  }

  return periods;
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

function getDivisionalSign(signIndex, degreeInSign, division) {
  const partSize = 30 / division;
  const partIndex = Math.floor(degreeInSign / partSize);

  const movable = [0, 3, 6, 9];
  const fixed = [1, 4, 7, 10];
  const dual = [2, 5, 8, 11];

  let startIndex = signIndex;
  if (fixed.includes(signIndex)) startIndex = (signIndex + 8) % 12;
  if (dual.includes(signIndex)) startIndex = (signIndex + 4) % 12;
  if (movable.includes(signIndex)) startIndex = signIndex;

  return (startIndex + partIndex) % 12;
}

function buildDivisionalPlanet(longitude, division) {
  const normalized = normalize360(longitude);
  const signIndex = Math.floor(normalized / 30);
  const degreeInSign = normalized % 30;
  const divisionalSignIndex = getDivisionalSign(signIndex, degreeInSign, division);
  const divisionalDegree = (degreeInSign % (30 / division)) * division;
  const divisionalLongitude = divisionalSignIndex * 30 + divisionalDegree;
  const nak = getNakshatraData(divisionalLongitude);

  return {
    sign: SIGNS[divisionalSignIndex],
    degree: round(divisionalDegree, 6),
    longitude: round(divisionalLongitude, 6),
    nakshatra: nak.nakshatra,
    nakshatra_lord: nak.nakshatra_lord,
    pada: nak.pada
  };
}

function buildDivisionalContext(birthDateTime, lat, lon, flags) {
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

  const sun = calcPlanet(birthJd, swe.SE_SUN, flags);
  const moon = calcPlanet(birthJd, swe.SE_MOON, flags);
  const mercury = calcPlanet(birthJd, swe.SE_MERCURY, flags);
  const venus = calcPlanet(birthJd, swe.SE_VENUS, flags);
  const mars = calcPlanet(birthJd, swe.SE_MARS, flags);
  const jupiter = calcPlanet(birthJd, swe.SE_JUPITER, flags);
  const saturn = calcPlanet(birthJd, swe.SE_SATURN, flags);
  const rahu = calcPlanet(birthJd, swe.SE_TRUE_NODE, flags);
  const ketuLongitude = normalize360(rahu.longitude + 180);

  const birthHousesRaw = swe.swe_houses(birthJd, lat, lon, "P");
  const birthHousesArray = parseHouseResult(birthHousesRaw);
  const ascendantLongitude = normalize360(birthHousesArray[1]);

  const sourcePlanets = {
    ascendant: ascendantLongitude,
    sun: sun.longitude,
    moon: moon.longitude,
    mercury: mercury.longitude,
    venus: venus.longitude,
    mars: mars.longitude,
    jupiter: jupiter.longitude,
    saturn: saturn.longitude,
    rahu: rahu.longitude,
    ketu: ketuLongitude
  };

  const divisional = {
    status: "active",
    birth_datetime_utc: birthDateTime.toISOString(),
    D7: {},
    D9: {},
    D10: {},
    D12: {},
    D24: {}
  };

  for (const [key, longitude] of Object.entries(sourcePlanets)) {
    divisional.D7[key] = buildDivisionalPlanet(longitude, 7);
    divisional.D9[key] = buildDivisionalPlanet(longitude, 9);
    divisional.D10[key] = buildDivisionalPlanet(longitude, 10);
    divisional.D12[key] = buildDivisionalPlanet(longitude, 12);
    divisional.D24[key] = buildDivisionalPlanet(longitude, 24);
  }

  return divisional;
}

function buildMicroAspectTriggers(baseDate, jd, flags) {
  const triggers = [];

  for (const pair of TRIGGER_PAIRS) {
    for (const target of MICRO_ASPECT_TARGETS) {
      let best = null;

      for (let offset = -900; offset <= 900; offset += 1) {
        const jdStep = jd + offset / 86400;
        const p1 = calcPlanet(jdStep, pair.id1, flags);
        const p2 = calcPlanet(jdStep, pair.id2, flags);
        const diff = getAngularDifference(p1.longitude, p2.longitude);
        const gap = Math.abs(diff - target.angle);

        if (!best || gap < best.gap) {
          best = {
            gap,
            offset,
            exact_angle: round(diff, 6)
          };
        }
      }

      if (best && best.gap <= target.orb) {
        triggers.push({
          type: `${pair.planet1.toLowerCase()}_${pair.planet2.toLowerCase()}_${target.name}`,
          source: "aspect_scan",
          planet1: pair.planet1,
          planet2: pair.planet2,
          aspect: target.name,
          exact_angle: best.exact_angle,
          exactness_gap: round(best.gap, 6),
          exact_time_utc: buildIsoFromOffset(baseDate, best.offset),
          second_offset_from_snapshot: best.offset,
          strength_score: round(1 - best.gap / target.orb, 6)
        });
      }
    }
  }

  return triggers;
}

function buildMoonBoundaryTriggers(baseDate, jd, flags) {
  const triggers = [];

  let prevSign = null;
  let prevNak = null;
  let prevPada = null;

  for (let offset = -900; offset <= 900; offset += 1) {
    const jdStep = jd + offset / 86400;
    const moon = calcPlanet(jdStep, swe.SE_MOON, flags);
    const signData = getSignData(moon.longitude);
    const nakData = getNakshatraData(moon.longitude);

    if (prevSign !== null && prevSign !== signData.sign_index) {
      triggers.push({
        type: "moon_sign_entry",
        source: "boundary_scan",
        sign: signData.sign,
        exact_time_utc: buildIsoFromOffset(baseDate, offset),
        second_offset_from_snapshot: offset,
        strength_score: 0.92
      });
    }

    if (prevNak !== null && prevNak !== nakData.nak_index) {
      triggers.push({
        type: "moon_nakshatra_entry",
        source: "boundary_scan",
        nakshatra: nakData.nakshatra,
        exact_time_utc: buildIsoFromOffset(baseDate, offset),
        second_offset_from_snapshot: offset,
        strength_score: 0.95
      });
    }

    if (prevPada !== null && prevPada !== nakData.pada) {
      triggers.push({
        type: "moon_pada_entry",
        source: "boundary_scan",
        nakshatra: nakData.nakshatra,
        pada: nakData.pada,
        exact_time_utc: buildIsoFromOffset(baseDate, offset),
        second_offset_from_snapshot: offset,
        strength_score: 0.88
      });
    }

    const degreeGap = Math.abs(signData.degree - Math.round(signData.degree));
    if (degreeGap <= 0.03) {
      triggers.push({
        type: "moon_degree_lock",
        source: "boundary_scan",
        degree: Math.round(signData.degree),
        sign: signData.sign,
        exact_time_utc: buildIsoFromOffset(baseDate, offset),
        second_offset_from_snapshot: offset,
        strength_score: round(1 - degreeGap / 0.03, 6)
      });
    }

    prevSign = signData.sign_index;
    prevNak = nakData.nak_index;
    prevPada = nakData.pada;
  }

  return triggers;
}

function dedupeMicroTriggers(triggers) {
  const seen = new Set();
  const unique = [];

  for (const trigger of triggers) {
    const key = [
      trigger.type || "",
      trigger.degree ?? "",
      trigger.sign ?? "",
      trigger.nakshatra ?? "",
      trigger.pada ?? "",
      trigger.aspect ?? "",
      trigger.planet1 ?? "",
      trigger.planet2 ?? "",
      trigger.exact_time_utc ?? ""
    ].join("|");

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(trigger);
    }
  }

  return unique.sort((a, b) => {
    const ta = new Date(a.exact_time_utc).getTime();
    const tb = new Date(b.exact_time_utc).getTime();
    return ta - tb;
  });
}

function buildTriggerSignature(trigger) {
  return [
    trigger.type || "",
    trigger.degree ?? "",
    trigger.sign ?? "",
    trigger.nakshatra ?? "",
    trigger.pada ?? "",
    trigger.aspect ?? "",
    trigger.planet1 ?? "",
    trigger.planet2 ?? ""
  ].join("|");
}

function finalizeCluster(cluster) {
  const start = new Date(cluster.cluster_start_utc);
  const end = new Date(cluster.cluster_end_utc);
  const durationSeconds = Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));

  let peakItem = cluster.items[0];
  for (const item of cluster.items) {
    const currentScore = item.strength_score ?? 0;
    const bestScore = peakItem?.strength_score ?? 0;
    if (currentScore > bestScore) peakItem = item;
  }

  const averageStrength =
    cluster.items.reduce((sum, item) => sum + (item.strength_score ?? 0), 0) / cluster.items.length;

  return {
    type: cluster.type,
    source: cluster.source,
    sign: cluster.sign,
    degree: cluster.degree,
    nakshatra: cluster.nakshatra,
    pada: cluster.pada,
    aspect: cluster.aspect,
    planet1: cluster.planet1,
    planet2: cluster.planet2,
    cluster_start_utc: cluster.cluster_start_utc,
    cluster_end_utc: cluster.cluster_end_utc,
    peak_time_utc: peakItem?.exact_time_utc ?? cluster.cluster_start_utc,
    hit_count: cluster.items.length,
    duration_seconds: durationSeconds,
    average_strength: round(averageStrength, 6),
    peak_strength: round(peakItem?.strength_score ?? 0, 6)
  };
}

function clusterMicroTriggers(triggers) {
  if (!triggers.length) return [];
  const clusters = [];
  let currentCluster = null;

  for (const trigger of triggers) {
    const signature = buildTriggerSignature(trigger);
    const time = new Date(trigger.exact_time_utc);

    if (!currentCluster) {
      currentCluster = {
        signature,
        type: trigger.type || "unknown",
        source: trigger.source || "unknown",
        sign: trigger.sign ?? null,
        degree: trigger.degree ?? null,
        nakshatra: trigger.nakshatra ?? null,
        pada: trigger.pada ?? null,
        aspect: trigger.aspect ?? null,
        planet1: trigger.planet1 ?? null,
        planet2: trigger.planet2 ?? null,
        cluster_start_utc: trigger.exact_time_utc,
        cluster_end_utc: trigger.exact_time_utc,
        items: [trigger]
      };
      continue;
    }

    const lastTime = new Date(currentCluster.cluster_end_utc);
    const secondsGap = (time.getTime() - lastTime.getTime()) / 1000;

    if (currentCluster.signature === signature && secondsGap <= 2) {
      currentCluster.cluster_end_utc = trigger.exact_time_utc;
      currentCluster.items.push(trigger);
    } else {
      clusters.push(finalizeCluster(currentCluster));
      currentCluster = {
        signature,
        type: trigger.type || "unknown",
        source: trigger.source || "unknown",
        sign: trigger.sign ?? null,
        degree: trigger.degree ?? null,
        nakshatra: trigger.nakshatra ?? null,
        pada: trigger.pada ?? null,
        aspect: trigger.aspect ?? null,
        planet1: trigger.planet1 ?? null,
        planet2: trigger.planet2 ?? null,
        cluster_start_utc: trigger.exact_time_utc,
        cluster_end_utc: trigger.exact_time_utc,
        items: [trigger]
      };
    }
  }

  if (currentCluster) clusters.push(finalizeCluster(currentCluster));
  return clusters;
}

function getDominantCluster(clusters) {
  if (!clusters.length) return null;

  const ranked = [...clusters].sort((a, b) => {
    if (b.peak_strength !== a.peak_strength) return b.peak_strength - a.peak_strength;
    if (b.hit_count !== a.hit_count) return b.hit_count - a.hit_count;
    return b.average_strength - a.average_strength;
  });

  return ranked[0];
}

function buildSubjectMode({ name, dob, tob, birthDateTime }) {
  const hasName = Boolean(cleanNullable(name));
  const hasDob = Boolean(normalizeDob(dob));
  const hasTob = Boolean(normalizeTob(tob));
  const hasBirthDateTime = Boolean(birthDateTime);

  if (hasBirthDateTime || (hasDob && hasTob)) {
    return {
      subject_mode: "FULL_BIRTH_LIVE",
      identity_depth: "LEVEL_5_FULL_BIRTH",
      precision_mode: "FULL_BIRTH",
      is_name_only_mode: false,
      is_name_context_mode: false,
      is_dob_locked: hasDob,
      is_full_birth_locked: true,
      live_mode: "NAME_WITH_FULL_DETAILS_LIVE"
    };
  }

  if (hasDob) {
    return {
      subject_mode: "DOB_SUPPORTED_LIVE",
      identity_depth: "LEVEL_4_NAME_DOB",
      precision_mode: "DOB_ONLY_REDUCED",
      is_name_only_mode: false,
      is_name_context_mode: false,
      is_dob_locked: true,
      is_full_birth_locked: false,
      live_mode: "NAME_WITH_DOB_LIVE"
    };
  }

  if (hasName) {
    return {
      subject_mode: "NAME_ONLY_LIVE",
      identity_depth: "LEVEL_2_NAME_ONLY",
      precision_mode: "NAME_ONLY",
      is_name_only_mode: true,
      is_name_context_mode: false,
      is_dob_locked: false,
      is_full_birth_locked: false,
      live_mode: "NAME_ONLY_LIVE"
    };
  }

  return {
    subject_mode: "UNIVERSAL_LIVE",
    identity_depth: "LEVEL_1_UNIVERSAL",
    precision_mode: "LIVE_ONLY",
    is_name_only_mode: false,
    is_name_context_mode: false,
    is_dob_locked: false,
    is_full_birth_locked: false,
    live_mode: "UNIVERSAL_LIVE_ONLY"
  };
}

export default async function handler(req, res) {
  try {
    const now = new Date();

    const name = cleanNullable(req.query?.name);
    const dob = normalizeDob(req.query?.dob);
    const tob = normalizeTob(req.query?.tob);
    const pob = cleanNullable(req.query?.pob);
    const timezoneOffset = normalizeOffset(req.query?.timezone_offset || "+00:00");
    const question = cleanNullable(req.query?.question);
    const facts = cleanNullable(req.query?.facts);

    const birthDateTime = buildBirthDateTime({
      birth_datetime: req.query?.birth_datetime,
      dob,
      tob,
      timezone_offset: timezoneOffset
    });

    const lat = parseFloat(req.query?.lat ?? req.query?.latitude ?? "51.5074");
    const lon = parseFloat(req.query?.lon ?? req.query?.longitude ?? "-0.1278");

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({
        engine_status: ENGINE_STATUS,
        system_status: "INPUT_ERROR",
        error: "invalid_location_input",
        details: "lat/lon or latitude/longitude must be valid numbers"
      });
    }

    const nameProfile = buildNameProfile(name || "");
    const mode = buildSubjectMode({ name, dob, tob, birthDateTime });

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

    const result = {
      engine_status: ENGINE_STATUS,
      system_status: "OK",
      mode: "LIVE_TRANSIT",
      oracle_mode: mode.live_mode,
      subject_mode: mode.subject_mode,
      identity_depth: mode.identity_depth,
      precision_mode: mode.precision_mode,

      input_normalized: {
        name,
        dob,
        tob,
        pob,
        latitude: round(lat, 6),
        longitude: round(lon, 6),
        timezone_offset: timezoneOffset,
        birth_datetime: birthDateTime ? birthDateTime.toISOString() : null,
        question,
        facts,
        current_datetime_iso: generatedAt
      },

      subject_context: {
        question_mode: "LIVE",
        subject_mode: mode.subject_mode,
        identity_depth: mode.identity_depth,
        identity_confidence: mode.is_full_birth_locked ? "HIGH" : mode.is_name_only_mode ? "MEDIUM" : "LOW_MEDIUM",
        subject_key: birthDateTime ? `BIRTH:${birthDateTime.toISOString()}` : name ? `NAME:${name}` : "UNIVERSAL",
        is_name_only_mode: mode.is_name_only_mode,
        is_name_context_mode: mode.is_name_context_mode,
        is_dob_locked: mode.is_dob_locked,
        is_full_birth_locked: mode.is_full_birth_locked,
        alias_candidates: nameProfile.alias_candidates,
        name_profile: nameProfile
      },

      birth_context: {
        birth_datetime_iso: birthDateTime ? birthDateTime.toISOString() : null,
        birthplace: pob,
        latitude: round(lat, 6),
        longitude: round(lon, 6),
        timezone_offset: timezoneOffset,
        precision_mode: mode.precision_mode,
        exact_timing_allowed: mode.is_full_birth_locked,
        dasha_allowed: mode.is_full_birth_locked,
        divisional_allowed: mode.is_full_birth_locked
      },

      authority: {
        source: "Swiss Ephemeris",
        zodiac: "sidereal",
        ayanamsa: "lahiri",
        node_mode: "true_node"
      },
      quality: {
        q_grade: mode.is_full_birth_locked ? "Q5_FULL_BIRTH_LIVE" : mode.is_name_only_mode ? "Q2_NAME_ONLY_LIVE" : "Q3_UNIVERSAL_LIVE",
        timing_precision: mode.is_full_birth_locked ? "live_micro_plus_natal_permission" : "live_degree_level_name_overlay",
        integrity_status: "clean_single_source"
      },
      freshness: {
        generated_at: generatedAt,
        age_seconds: 0,
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

    result.identity_packet = {
      subject_name: name,
      name_profile: nameProfile,
      derived_rashi: {
        sign: nameProfile.derived_rashi_sign,
        bengali: nameProfile.derived_rashi_bengali
      },
      numerology: {
        clean_name: nameProfile.normalized_name ? nameProfile.normalized_name.toUpperCase() : null,
        values: nameProfile.values,
        total: nameProfile.compound_number,
        root: nameProfile.root_number,
        vibration_class: nameProfile.vibration_class
      }
    };

    const housesRaw = swe.swe_houses(jd, lat, lon, "P");
    const housesArray = parseHouseResult(housesRaw);
    const ascendantLongitude = normalize360(housesArray[1]);

    result.ascendant = buildPointData(ascendantLongitude);
    result.houses = calculateWholeSignHouses(ascendantLongitude);

    result.kp_cusps = {};
    for (let i = 1; i <= 12; i++) {
      const rawValue = housesArray[i];
      if (typeof rawValue !== "number" || Number.isNaN(rawValue)) continue;

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

    if (birthDateTime) {
      result.dasha = buildDashaContext(birthDateTime, now, flags);
      result.divisional = buildDivisionalContext(birthDateTime, lat, lon, flags);
    } else {
      result.dasha = {
        status: "absent_no_birth_datetime",
        required_input: "birth_datetime OR dob+tob+timezone_offset",
        natal_timing_permission: "CLOSED_FOR_NAME_ONLY"
      };
      result.divisional = {
        status: "absent_no_birth_datetime",
        required_input: "birth_datetime OR dob+tob+timezone_offset",
        supported: ["D7", "D9", "D10", "D12", "D24"],
        divisional_reinforcement_grade: "WEAK_OR_ABSENT"
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

    const rawMicroTriggers = [
      ...buildMicroAspectTriggers(now, jd, flags),
      ...buildMoonBoundaryTriggers(now, jd, flags)
    ];

    const dedupedMicroTriggers = dedupeMicroTriggers(rawMicroTriggers);
    const microClusters = clusterMicroTriggers(dedupedMicroTriggers);
    const dominantCluster = getDominantCluster(microClusters);

    result.micro_window = {
      scan_range_seconds: 900,
      step_seconds: 1,
      raw_trigger_count: rawMicroTriggers.length,
      unique_trigger_count: dedupedMicroTriggers.length,
      cluster_count: microClusters.length,
      precision_mode: dominantCluster ? "clustered_micro_scan" : "ultra_micro_scan"
    };

    result.micro_status = {
      trigger_present: microClusters.length > 0,
      precision_allowed: microClusters.length > 0 ? "minute_candidate" : "window_only",
      name_only_allowed: mode.is_name_only_mode,
      full_birth_allowed: mode.is_full_birth_locked
    };

    result.micro_convergence = {
      convergence_strength: dominantCluster ? dominantCluster.peak_strength : 0,
      cluster_density: dominantCluster ? dominantCluster.hit_count : 0,
      dominant_trigger_identity: dominantCluster ? dominantCluster.type : null
    };

    result.micro_dominant_trigger = dominantCluster
      ? {
          type: dominantCluster.type,
          peak_time_utc: dominantCluster.peak_time_utc,
          cluster_start_utc: dominantCluster.cluster_start_utc,
          cluster_end_utc: dominantCluster.cluster_end_utc,
          hit_count: dominantCluster.hit_count,
          average_strength: dominantCluster.average_strength,
          peak_strength: dominantCluster.peak_strength,
          sign: dominantCluster.sign,
          degree: dominantCluster.degree,
          nakshatra: dominantCluster.nakshatra,
          pada: dominantCluster.pada,
          aspect: dominantCluster.aspect,
          planet1: dominantCluster.planet1,
          planet2: dominantCluster.planet2
        }
      : null;

    result.micro_clusters = microClusters;
    result.micro_triggers = dedupedMicroTriggers;

    result.live_elite_packet = {
      packet_status: "COMPLETE",
      usable_by_gpt_for_remedy_selection: true,
      supports_universal_live: true,
      supports_name_only_live: true,
      supports_name_with_full_details_live: true,
      missing_for_full_birth: birthDateTime ? [] : ["birth_datetime OR dob+tob+timezone_offset"],
      strongest_available_layer:
        mode.is_full_birth_locked ? "LIVE_TRANSIT_PLUS_DASHA_PLUS_DIVISIONAL_PLUS_KP" :
        mode.is_name_only_mode ? "LIVE_TRANSIT_PLUS_NAME_PROFILE_PLUS_KP_CURRENT" :
        "UNIVERSAL_LIVE_TRANSIT_PLUS_KP_CURRENT",
      caution:
        mode.is_full_birth_locked
          ? "Full-birth live timing enabled."
          : "Name-only live can show strong field and trigger, but natal dasha/divisional permission remains closed."
    };

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      engine_status: ENGINE_STATUS,
      system_status: "FAILED",
      error: "transit_engine_failed",
      details: error && error.message ? error.message : "unknown transit error"
    });
  }
}