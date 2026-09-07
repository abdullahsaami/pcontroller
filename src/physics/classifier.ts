import type { TrajectoryPoint, PerformanceStats, BehaviorClassification } from '../types/simulation';

/**
 * Calculates real-time performance statistics from actual simulation trajectory data.
 */
export function computePerformanceStats(
  points: TrajectoryPoint[],
  settlingThreshold: number = 0.03 // within 3cm of reference line
): PerformanceStats {
  if (points.length === 0) {
    return {
      maxAbsoluteError: 0,
      meanAbsoluteError: 0,
      maxSteeringCommandDeg: 0,
      zeroCrossings: 0,
      settlingTime: null,
      finalError: 0,
    };
  }

  let maxAbsError = 0;
  let sumAbsError = 0;
  let maxSteering = 0;
  let zeroCrossings = 0;

  let prevSign: number | null = null;
  const deadband = 0.005; // 5mm deadband to prevent false jitter crossings

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const absErr = Math.abs(pt.lateralError);
    if (absErr > maxAbsError) maxAbsError = absErr;
    sumAbsError += absErr;

    const absSteer = Math.abs(pt.steeringCommandDeg);
    if (absSteer > maxSteering) maxSteering = absSteer;

    // Zero-crossing detection
    if (Math.abs(pt.lateralError) > deadband) {
      const currentSign = pt.lateralError > 0 ? 1 : -1;
      if (prevSign !== null && currentSign !== prevSign) {
        zeroCrossings++;
      }
      prevSign = currentSign;
    }
  }

  const meanAbsError = sumAbsError / points.length;
  const finalError = points[points.length - 1].lateralError;

  // Settling time calculation: time after which all subsequent points stay within threshold
  let settlingTime: number | null = null;
  // Look backward from the end
  let allSettledFromIdx = -1;
  for (let i = points.length - 1; i >= 0; i--) {
    if (Math.abs(points[i].lateralError) > settlingThreshold) {
      allSettledFromIdx = i + 1;
      break;
    }
  }

  // If even the latest points are outside threshold, it has not settled
  if (allSettledFromIdx >= points.length) {
    settlingTime = null;
  } else if (allSettledFromIdx > 0 && allSettledFromIdx < points.length) {
    // Only report settling time if there is at least 0.4s of settled data
    const settledDuration = points[points.length - 1].time - points[allSettledFromIdx].time;
    if (settledDuration >= 0.4) {
      settlingTime = points[allSettledFromIdx].time;
    } else {
      settlingTime = null;
    }
  }

  return {
    maxAbsoluteError: maxAbsError,
    meanAbsoluteError: meanAbsError,
    maxSteeringCommandDeg: maxSteering,
    zeroCrossings,
    settlingTime,
    finalError,
  };
}

/**
 * Dynamically classifies controller behavior based on physical simulation results
 * rather than hardcoded Kp thresholds.
 */
export function classifyBehavior(
  points: TrajectoryPoint[],
  stats: PerformanceStats,
  currentKp: number
): BehaviorClassification {
  if (points.length < 15) {
    return {
      category: 'BALANCED',
      title: 'Initializing...',
      badgeColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
      badgeBg: 'bg-cyan-500',
      description: 'Vehicle started moving. Analyzing steering response dynamics.',
      explanation: 'Telemetry and trajectory metrics are being gathered.',
    };
  }

  const { zeroCrossings, maxSteeringCommandDeg } = stats;
  const latestError = points[points.length - 1].lateralError;
  const initialError = points[0].lateralError;
  const elapsed = points[points.length - 1].time;

  // Check overshoot magnitude
  let maxOvershoot = 0;
  if (initialError > 0) {
    for (const pt of points) {
      if (pt.lateralError < 0 && Math.abs(pt.lateralError) > maxOvershoot) {
        maxOvershoot = Math.abs(pt.lateralError);
      }
    }
  } else {
    for (const pt of points) {
      if (pt.lateralError > 0 && pt.lateralError > maxOvershoot) {
        maxOvershoot = pt.lateralError;
      }
    }
  }

  // Behavior rules based on physical dynamics
  if (zeroCrossings >= 3 || (zeroCrossings >= 2 && maxOvershoot > 0.15)) {
    return {
      category: 'OSCILLATORY',
      title: 'Oscillatory',
      badgeColor: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
      badgeBg: 'bg-rose-500',
      description: 'The vehicle is repeatedly crossing the reference line with large steering corrections.',
      explanation: `Observed ${zeroCrossings} zero-crossings. The strong proportional gain (${currentKp.toFixed(1)}) induces a phase lag between heading and lateral motion, creating sustained limit-cycle oscillation.`,
    };
  }

  if (zeroCrossings === 2 || (zeroCrossings === 1 && maxOvershoot > 0.08) || maxSteeringCommandDeg > 110) {
    return {
      category: 'AGGRESSIVE',
      title: 'Aggressive',
      badgeColor: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
      badgeBg: 'bg-amber-500',
      description: 'The vehicle is responding strongly with rapid heading corrections and noticeable overshoot.',
      explanation: `Max steering rate reached ${maxSteeringCommandDeg.toFixed(1)}°/s with ${maxOvershoot.toFixed(3)}m overshoot. Fast rise time, but momentum carries the vehicle past the centerline.`,
    };
  }

  if (zeroCrossings === 0 && elapsed > 2.0 && Math.abs(latestError) > 0.20 && Math.abs(latestError) > Math.abs(initialError) * 0.4) {
    return {
      category: 'LOW_RESPONSE',
      title: 'Low Response',
      badgeColor: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
      badgeBg: 'bg-blue-500',
      description: 'The vehicle is correcting slowly with gentle steering changes.',
      explanation: `Sluggish steering authority. With Kp = ${currentKp.toFixed(1)}, heading builds up gradually, requiring significant distance along the track to eliminate error.`,
    };
  }

  return {
    category: 'BALANCED',
    title: 'Balanced',
    badgeColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    badgeBg: 'bg-emerald-500',
    description: 'The vehicle is correcting effectively with relatively low oscillation.',
    explanation: `Prompt rise towards the reference line with manageable overshoot (${maxOvershoot.toFixed(3)}m). Appropriate compromise between speed of convergence and tracking stability.`,
  };
}
