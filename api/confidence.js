export function calculateConfidence(packet, multiSnapshot) {
  let score = 50;
  let reasons = [];

  // Planetary strength
  if (packet.strength) {
    const values = Object.values(packet.strength);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    if (avg > 0.6) {
      score += 10;
      reasons.push("strong planetary strength");
    } else {
      reasons.push("moderate planetary strength");
    }
  }

  // Dasha support
  if (packet.dasha && packet.dasha.status === "active") {
    score += 15;
    reasons.push("dasha support active");
  } else {
    reasons.push("no dasha support");
  }

  // Micro trigger
  if (packet.micro_status?.trigger_present) {
    score += 10;
    reasons.push("micro trigger present");
  } else {
    reasons.push("no micro trigger");
  }

  // Multi-snapshot convergence
  if (multiSnapshot) {
    if (multiSnapshot.convergence_strength === "high") {
      score += 15;
      reasons.push("high convergence across snapshots");
    } else if (multiSnapshot.convergence_strength === "medium") {
      score += 8;
      reasons.push("moderate convergence");
    } else {
      reasons.push("no convergence");
    }
  }

  // Cap score
  if (score > 100) score = 100;

  let level = "LOW";
  if (score >= 75) level = "HIGH";
  else if (score >= 60) level = "MEDIUM";

  return {
    confidence_score: score,
    confidence_level: level,
    confidence_reasons: reasons
  };
}