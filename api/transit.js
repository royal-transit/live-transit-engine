const swisseph = require('swisseph-v2');

const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

const NAKSHATRA_SIZE = 360 / 27;
const PADA_SIZE = NAKSHATRA_SIZE / 4;

// Approx Lahiri offset placeholder.
// Honest note: this is an approximation for now, not final precision Lahiri.
const AYANAMSA_APPROX = 24.2;

function normalize360(value) {
  let x = value % 360;
  if (x < 0) x += 360;
  return x;
}

function tropicalToSidereal(longitude) {
  return normalize360(longitude - AYANAMSA_APPROX);
}

function getSign(longitude) {
  return SIGNS[Math.floor(longitude / 30)];
}

function getDegreeInSign(longitude) {
  return +(longitude % 30).toFixed(4);
}

function getNakshatraPada(longitude) {
  const nakIndex = Math.floor(longitude / NAKSHATRA_SIZE);
  const remainder = longitude % NAKSHATRA_SIZE;
  const pada = Math.floor(remainder / PADA_SIZE) + 1;

  return {
    nakshatra: NAKSHATRAS[nakIndex],
    pada
  };
}

function buildGrahaFromLongitude(longitude, speed) {
  const siderealLon = tropicalToSidereal(longitude);
  const { nakshatra, pada } = getNakshatraPada(siderealLon);

  return {
    sign: getSign(siderealLon),
    degree: getDegreeInSign(siderealLon),
    longitude: +siderealLon.toFixed(6),
    nakshatra,
    pada,
    speed: +(speed || 0).toFixed(6),
    retrograde: (speed || 0) < 0
  };
}

function calcPlanet(jdUt, planetId) {
  return new Promise((resolve, reject) => {
    const flags = swisseph.SEFLG_SPEED | swisseph.SEFLG_MOSEPH;

    swisseph.swe_calc_ut(jdUt, planetId, flags, (body) => {
      if (!body || body.error) {
        reject(body && body.error ? body.error : 'Unknown calculation error');
        return;
      }

      resolve(body);
    });
  });
}

function calcJulianDay(now) {
  return new Promise((resolve, reject) => {
    swisseph.swe_utc_to_jd(
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
      swisseph.SE_GREG_CAL,
      (result) => {
        if (!result || result.error) {
          reject(result && result.error ? result.error : 'Julian day error');
          return;
        }

        resolve(result.julianDayUT);
      }
    );
  });
}

module.exports = async function handler(req, res) {
  try {
    const now = new Date();
    const jdUt = await calcJulianDay(now);

    const [
      sun,
      moon,
      mercury,
      venus,
      mars,
      jupiter,
      saturn,
      rahu
    ] = await Promise.all([
      calcPlanet(jdUt, swisseph.SE_SUN),
      calcPlanet(jdUt, swisseph.SE_MOON),
      calcPlanet(jdUt, swisseph.SE_MERCURY),
      calcPlanet(jdUt, swisseph.SE_VENUS),
      calcPlanet(jdUt, swisseph.SE_MARS),
      calcPlanet(jdUt, swisseph.SE_JUPITER),
      calcPlanet(jdUt, swisseph.SE_SATURN),
      calcPlanet(jdUt, swisseph.SE_MEAN_NODE)
    ]);

    const rahuData = buildGrahaFromLongitude(rahu.longitude, rahu.longitudeSpeed);
    const ketuLonTropical = normalize360(rahu.longitude + 180);
    const ketuSpeed = -(rahu.longitudeSpeed || 0);
    const ketuData = buildGrahaFromLongitude(ketuLonTropical, ketuSpeed);

    const output = {
      datetime_utc: now.toISOString(),
      timezone: 'Europe/London',
      zodiac: 'Sidereal',
      ayanamsa: 'Approx Lahiri',
      source: 'live-calculated',
      sun: buildGrahaFromLongitude(sun.longitude, sun.longitudeSpeed),
      moon: buildGrahaFromLongitude(moon.longitude, moon.longitudeSpeed),
      mercury: buildGrahaFromLongitude(mercury.longitude, mercury.longitudeSpeed),
      venus: buildGrahaFromLongitude(venus.longitude, venus.longitudeSpeed),
      mars: buildGrahaFromLongitude(mars.longitude, mars.longitudeSpeed),
      jupiter: buildGrahaFromLongitude(jupiter.longitude, jupiter.longitudeSpeed),
      saturn: buildGrahaFromLongitude(saturn.longitude, saturn.longitudeSpeed),
      rahu: rahuData,
      ketu: ketuData
    };

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(output);
  } catch (error) {
    res.status(500).json({
      error: 'Transit calculation failed',
      details: String(error)
    });
  }
};
