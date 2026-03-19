module.exports = async function handler(req, res) {
  try {
    const input = req.method === "POST" ? (req.body || {}) : (req.query || {});

    const now = new Date();

    const moonLongitudeRaw =
      input.moon_longitude ??
      input.moonLongitude ??
      input.natal_moon_longitude ??
      input.natalMoonLongitude;

    const birthDatetimeRaw =
      input.birth_datetime ??
      input.birthDatetime ??
      input.dob_time_iso ??
      input.birth_iso ??
      null;

    const asOfRaw =
      input.as_of ??
      input.asOf ??
      input.timestamp ??
      now.toISOString();

    if (moonLongitudeRaw === undefined || moonLongitudeRaw === null || moonLongitudeRaw === "") {
      return res.status(400).json({
        error: "dasha engine failure",
        details: "moon_longitude is required"
      });
    }

    const moonLongitude = Number(moonLongitudeRaw);
    if (!Number.isFinite(moonLongitude)) {
      return res.status(400).json({
        error: "dasha engine failure",
        details: "moon_longitude must be a valid number"
      });
    }

    const asOf = new Date(asOfRaw);
    if (Number.isNaN(asOf.getTime())) {
      return res.status(400).json({
        error: "dasha engine failure",
        details: "Invalid as_of / timestamp value"
      });
    }

    const result = computeVimshottariDasha({
      moonLongitude,
      birthDatetimeRaw,
      asOf
    });

    return res.status(200).json({
      timestamp: now.toISOString(),
      mode: result.mode,
      moon_longitude: round(normalize360(moonLongitude), 6),
      nakshatra: {
        index: result.nakshatra.index,
        name: result.nakshatra.name,
        lord: result.nakshatra.lord
      },
      birth_balance: result.birthBalance,
      current_mahadasha: result.currentMahadasha,
      current_antardasha: result.currentAntardasha,
      ends: result.ends,
      confidence: result.confidence
    });
  } catch (err) {
    return res.status(500).json({
      error: "dasha engine failure",
      details: err instanceof Error ? err.message : String(err)
    });
  }
};

/* -------------------------------------------------------------------------- */
/*                                   CONSTANTS                                */
/* -------------------------------------------------------------------------- */

const NAKSHATRA_NAMES = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati"
];

const DASHA_SEQUENCE = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury"
];

const VIMSHOTTARI_YEARS = {
  ketu: 7,
  venus: 20,
  sun: 6,
  moon: 10,
  mars: 7,
  rahu: 18,
  jupiter: 16,
  saturn: 19,
  mercury: 17
};

const LORD_ALIASES = {
  ketu: "ketu",
  venus: "venus",
  sun: "sun",
  moon: "moon",
  mars: "mars",
  rahu: "rahu",
  jupiter: "jupiter",
  saturn: "saturn",
  mercury: "mercury",
  shani: "saturn",
  guru: "jupiter",
  budh: "mercury",
  mangal: "mars",
  chandra: "moon",
  surya: "sun",
  shukra: "venus"
};

const TOTAL_VIMSHOTTARI_YEARS = 120;
const NAKSHATRA_SIZE = 360 / 27;
const YEAR_MS = 365.2425 * 24 * 60 * 60 * 1000;

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function normalize360(value) {
  let v = Number(value) % 360;
  if (v < 0) v += 360;
  return v;
}

function round(value, digits = 6) {
  return Number(Number(value).toFixed(digits));
}

function normalizeLordKey(value) {
  const raw = String(value || "").trim().toLowerCase();
  return LORD_ALIASES[raw] || raw;
}

function properLordName(value) {
  const key = normalizeLordKey(value);
  const found = DASHA_SEQUENCE.find((x) => normalizeLordKey(x) === key);
  if (!found) {
    throw new Error(Missing Vimshottari mapping for lord: ${String(value)});
  }
  return found;
}

function getLordYears(lord) {
  const key = normalizeLordKey(lord);
  const years = VIMSHOTTARI_YEARS[key];
  if (!Number.isFinite(years)) {
    throw new Error(Missing Vimshottari years mapping for lord: ${String(lord)});
  }
  return years;
}

function getNakshatraData(moonLongitude) {
  const lon = normalize360(moonLongitude);
  const index = Math.floor(lon / NAKSHATRA_SIZE);
  const name = NAKSHATRA_NAMES[index];
  const lord = DASHA_SEQUENCE[index % 9];
  const offsetInNakshatra = lon - index * NAKSHATRA_SIZE;
  const consumedFraction = offsetInNakshatra / NAKSHATRA_SIZE;
  const remainingFraction = 1 - consumedFraction;

  return {
    index,
    name,
    lord,
    consumedFraction,
    remainingFraction
  };
}

function addYears(date, years) {
  return new Date(date.getTime() + years * YEAR_MS);
}

function getBirthBalance(moonLongitude) {
  const nak = getNakshatraData(moonLongitude);
  const totalYears = getLordYears(nak.lord);
  const consumedYearsAtBirth = totalYears * nak.consumedFraction;
  const remainingYearsAtBirth = totalYears * nak.remainingFraction;

  return {
    nakshatra: {
      index: nak.index,
      name: nak.name,
      lord: nak.lord
    },
    startLord: nak.lord,
    totalYears,
    consumedYearsAtBirth: round(consumedYearsAtBirth, 6),
    remainingYearsAtBirth: round(remainingYearsAtBirth, 6)
  };
}

function getSequenceIndex(lord) {
  const proper = properLordName(lord);
  const idx = DASHA_SEQUENCE.indexOf(proper);
  if (idx < 0) {
    throw new Error(Invalid dasha lord sequence for: ${lord});
  }
  return idx;
}

function computeAntardasha(mahaLord, mahaElapsedYears) {
  const mahaYears = getLordYears(mahaLord);
  const sequence = DASHA_SEQUENCE.slice();
  const startIndex = getSequenceIndex(mahaLord);

  let elapsed = mahaElapsedYears;
  for (let i = 0; i < sequence.length; i++) {
    const subLord = sequence[(startIndex + i) % sequence.length];
    const subYears = (mahaYears * getLordYears(subLord)) / TOTAL_VIMSHOTTARI_YEARS;

    if (elapsed <= subYears + 1e-12) {
      return {
        planet: subLord,
        total_years: round(subYears, 6),
        elapsed_years: round(Math.max(0, elapsed), 6),
        remaining_years: round(Math.max(0, subYears - elapsed), 6)
      };
    }

    elapsed -= subYears;
  }

  const fallbackLord = sequence[startIndex];
  return {
    planet: fallbackLord,
    total_years: round((mahaYears * getLordYears(fallbackLord)) / TOTAL_VIMSHOTTARI_YEARS, 6),
    elapsed_years: 0,
    remaining_years: 0
  };
}

/* -------------------------------------------------------------------------- */
/*                             MAIN DASHA CALCULATION                         */
/* -------------------------------------------------------------------------- */

function computeVimshottariDasha({ moonLongitude, birthDatetimeRaw, asOf }) {
  const birthBalance = getBirthBalance(moonLongitude);

  if (!birthDatetimeRaw) {
    const fallbackEnds = addYears(asOf, birthBalance.remainingYearsAtBirth);
    return {
      mode: "balance_only_fallback",
      nakshatra: birthBalance.nakshatra,
      birthBalance: {
        planet: birthBalance.startLord,
        total_years: birthBalance.totalYears,
        consumed_years_at_birth: birthBalance.consumedYearsAtBirth,
        remaining_years_at_birth: birthBalance.remainingYearsAtBirth
      },
      currentMahadasha: {
        planet: birthBalance.startLord,
        total_years: birthBalance.totalYears,
        elapsed_years: 0,
        remaining_years: birthBalance.remainingYearsAtBirth,
        note: "birth_datetime not supplied; returning safe balance-only fallback"
      },
      currentAntardasha: computeAntardasha(birthBalance.startLord, 0),
      ends: fallbackEnds.toISOString(),
      confidence: {
        level: "limited",
        reason: "birth_datetime_missing_fallback_used"
      }
    };
  }

  const birthDatetime = new Date(birthDatetimeRaw);
  if (Number.isNaN(birthDatetime.getTime())) {
    throw new Error("Invalid birth_datetime value");
  }

  if (asOf.getTime() < birthDatetime.getTime()) {
    throw new Error("as_of cannot be earlier than birth_datetime");
  }

  const elapsedYearsSinceBirth = (asOf.getTime() - birthDatetime.getTime()) / YEAR_MS;

  let currentLord = birthBalance.startLord;
  let currentLordYears = getLordYears(currentLord);
  let remainingInCurrent = birthBalance.remainingYearsAtBirth;
  let elapsedInsideCurrent = currentLordYears - remainingInCurrent;

  const sequence = DASHA_SEQUENCE.slice();
  let seqIndex = getSequenceIndex(currentLord);
  let remainingElapsed = elapsedYearsSinceBirth;

  if (remainingElapsed <= remainingInCurrent + 1e-12) {
    const antardasha = computeAntardasha(currentLord, elapsedInsideCurrent + remainingElapsed);
    return {
      mode: "full_natal",
      nakshatra: birthBalance.nakshatra,
      birthBalance: {
        planet: birthBalance.startLord,
        total_years: birthBalance.totalYears,
        consumed_years_at_birth: birthBalance.consumedYearsAtBirth,
        remaining_years_at_birth: birthBalance.remainingYearsAtBirth
      },
      currentMahadasha: {
        planet: currentLord,
        total_years: round(currentLordYears, 6),
        elapsed_years: round(elapsedInsideCurrent + remainingElapsed, 6),
        remaining_years: round(remainingInCurrent - remainingElapsed, 6)
      },
      currentAntardasha: antardasha,
      ends: addYears(asOf, remainingInCurrent - remainingElapsed).toISOString(),
      confidence: {
        level: "high",
        reason: "birth_datetime_and_natal_moon_used"
      }
    };
  }

  remainingElapsed -= remainingInCurrent;

  while (true) {
    seqIndex = (seqIndex + 1) % sequence.length;
    currentLord = sequence[seqIndex];
    currentLordYears = getLordYears(currentLord);

    if (remainingElapsed <= currentLordYears + 1e-12) {
      const currentRemainingYears = currentLordYears - remainingElapsed;
      const antardasha = computeAntardasha(currentLord, remainingElapsed);

      return {
        mode: "full_natal",
        nakshatra: birthBalance.nakshatra,
        birthBalance: {
          planet: birthBalance.startLord,
          total_years: birthBalance.totalYears,
          consumed_years_at_birth: birthBalance.consumedYearsAtBirth,
          remaining_years_at_birth: birthBalance.remainingYearsAtBirth
        },
        currentMahadasha: {
          planet: currentLord,
          total_years: round(currentLordYears, 6),
          elapsed_years: round(remainingElapsed, 6),
          remaining_years: round(currentRemainingYears, 6)
        },
        currentAntardasha: antardasha,
        ends: addYears(asOf, currentRemainingYears).toISOString(),
        confidence: {
          level: "high",
          reason: "birth_datetime_and_natal_moon_used"
        }
      };
    }

    remainingElapsed -= currentLordYears;
  }
}
