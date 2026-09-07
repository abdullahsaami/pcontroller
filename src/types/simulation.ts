export interface VehicleState {
  x: number; // forward distance (meters)
  y: number; // lateral displacement (meters)
  heading: number; // orientation angle θ (radians)
  headingDeg: number; // orientation angle θ (degrees)
  v: number; // forward velocity (m/s)
  steeringCommand: number; // control output u (rad/s)
  steeringCommandDeg: number; // control output u (°/s)
  lateralError: number; // e(t) = targetY - y (meters)
  time: number; // elapsed simulation time (seconds)
  step: number; // step count
}

export interface SimulationConfig {
  kp: number; // proportional gain (2.0 to 6.0)
  initialLateralOffset: number; // default +0.50 m
  initialHeadingDeg: number; // default 0.00°
  speed: number; // default 1.00 m/s
  dt: number; // timestep (seconds), default 0.02s
  maxHeadingDeg: number; // max heading clamp, default 60°
  maxSteeringRateDeg: number; // max steering rate clamp, default 150°/s
  targetY: number; // target reference line (0.0 m)
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  headingDeg: number;
  lateralError: number;
  steeringCommandDeg: number;
  time: number;
  step: number;
}

export interface PerformanceStats {
  maxAbsoluteError: number;
  meanAbsoluteError: number;
  maxSteeringCommandDeg: number;
  zeroCrossings: number;
  settlingTime: number | null; // null if not settled within threshold
  finalError: number;
}

export type ClassificationCategory = 'LOW_RESPONSE' | 'BALANCED' | 'AGGRESSIVE' | 'OSCILLATORY';

export interface BehaviorClassification {
  category: ClassificationCategory;
  title: string;
  badgeColor: string;
  badgeBg: string;
  description: string;
  explanation: string;
}

export interface StepInspectionData {
  stepNumber: number;
  time: number;
  currentY: number;
  lateralError: number;
  kp: number;
  steeringCommandRad: number;
  steeringCommandDeg: number;
  prevHeadingDeg: number;
  deltaHeadingDeg: number;
  newHeadingDeg: number;
  deltaX: number;
  deltaY: number;
  newX: number;
  newY: number;
}

export interface ComparisonRun {
  kp: number;
  color: string;
  points: TrajectoryPoint[];
  stats: PerformanceStats;
  classification: BehaviorClassification;
}
