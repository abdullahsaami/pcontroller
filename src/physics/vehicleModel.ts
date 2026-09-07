import type { SimulationConfig, VehicleState, StepInspectionData, TrajectoryPoint } from '../types/simulation';

export const DEFAULT_CONFIG: SimulationConfig = {
  kp: 4.0,
  initialLateralOffset: 0.50, // Starts with +0.50m error (vehicle is at y = -0.50m)
  initialHeadingDeg: 0.0,
  speed: 1.0,
  dt: 0.02, // 50 Hz physics loop
  maxHeadingDeg: 60.0,
  maxSteeringRateDeg: 150.0,
  targetY: 0.0,
};

/**
 * Creates the initial vehicle state based on configuration.
 * When initialLateralOffset is +0.50m, vehicle lateral position y is -0.50m,
 * producing an initial error e = targetY - y = 0 - (-0.50) = +0.50m.
 */
export function createInitialState(config: SimulationConfig): VehicleState {
  const initialY = config.targetY - config.initialLateralOffset;
  const initialHeadingRad = (config.initialHeadingDeg * Math.PI) / 180;
  const initialError = config.targetY - initialY;
  
  // Initial control output at t=0
  const maxSteeringRad = (config.maxSteeringRateDeg * Math.PI) / 180;
  const rawSteering = config.kp * initialError;
  const clampedSteering = Math.max(-maxSteeringRad, Math.min(maxSteeringRad, rawSteering));

  return {
    x: 0,
    y: initialY,
    heading: initialHeadingRad,
    headingDeg: config.initialHeadingDeg,
    v: config.speed,
    steeringCommand: clampedSteering,
    steeringCommandDeg: (clampedSteering * 180) / Math.PI,
    lateralError: initialError,
    time: 0,
    step: 0,
  };
}

/**
 * Executes a single discrete-time simulation step:
 * 1. Read position & calculate error e(t) = targetY - y
 * 2. Calculate P-controller command: u(t) = Kp * e(t)
 * 3. Update heading: θ(t+dt) = θ(t) + u(t) * dt
 * 4. Update position: x(t+dt) = x(t) + v * cos(θ) * dt, y(t+dt) = y(t) + v * sin(θ) * dt
 */
export function stepSimulation(
  currentState: VehicleState,
  config: SimulationConfig
): { nextState: VehicleState; inspection: StepInspectionData } {
  const dt = config.dt;
  const currentY = currentState.y;
  
  // 1. Calculate Error
  const lateralError = config.targetY - currentY;

  // 2. Calculate P Control Command: u = Kp * e
  const rawSteering = config.kp * lateralError;
  const maxSteeringRad = (config.maxSteeringRateDeg * Math.PI) / 180;
  const steeringCommand = Math.max(-maxSteeringRad, Math.min(maxSteeringRad, rawSteering));
  const steeringCommandDeg = (steeringCommand * 180) / Math.PI;

  // 3. Update Heading: θ(t+dt) = θ(t) + u(t) * dt
  const prevHeadingDeg = currentState.headingDeg;
  let newHeading = currentState.heading + steeringCommand * dt;
  
  // Clamp heading to maximum allowed steering angle
  const maxHeadingRad = (config.maxHeadingDeg * Math.PI) / 180;
  newHeading = Math.max(-maxHeadingRad, Math.min(maxHeadingRad, newHeading));
  const newHeadingDeg = (newHeading * 180) / Math.PI;
  const deltaHeadingDeg = newHeadingDeg - prevHeadingDeg;

  // 4. Update Position: Forward motion with current heading
  const deltaX = config.speed * Math.cos(newHeading) * dt;
  const deltaY = config.speed * Math.sin(newHeading) * dt;
  const newX = currentState.x + deltaX;
  const newY = currentY + deltaY;

  // Next step time and error for the updated state
  const nextTime = currentState.time + dt;
  const nextStep = currentState.step + 1;
  const nextLateralError = config.targetY - newY;

  const nextState: VehicleState = {
    x: newX,
    y: newY,
    heading: newHeading,
    headingDeg: newHeadingDeg,
    v: config.speed,
    steeringCommand,
    steeringCommandDeg,
    lateralError: nextLateralError,
    time: nextTime,
    step: nextStep,
  };

  const inspection: StepInspectionData = {
    stepNumber: nextStep,
    time: nextTime,
    currentY,
    lateralError,
    kp: config.kp,
    steeringCommandRad: steeringCommand,
    steeringCommandDeg,
    prevHeadingDeg,
    deltaHeadingDeg,
    newHeadingDeg,
    deltaX,
    deltaY,
    newX,
    newY,
  };

  return { nextState, inspection };
}

/**
 * Runs a deterministic simulation for a specific duration or step count.
 * Used for Kp comparison mode and offline benchmarking.
 */
export function runSimulationBatch(
  config: SimulationConfig,
  durationSeconds: number = 8.0
): TrajectoryPoint[] {
  let state = createInitialState(config);
  const points: TrajectoryPoint[] = [
    {
      x: state.x,
      y: state.y,
      headingDeg: state.headingDeg,
      lateralError: state.lateralError,
      steeringCommandDeg: state.steeringCommandDeg,
      time: state.time,
      step: state.step,
    },
  ];

  const totalSteps = Math.floor(durationSeconds / config.dt);
  for (let i = 0; i < totalSteps; i++) {
    const { nextState } = stepSimulation(state, config);
    state = nextState;
    points.push({
      x: state.x,
      y: state.y,
      headingDeg: state.headingDeg,
      lateralError: state.lateralError,
      steeringCommandDeg: state.steeringCommandDeg,
      time: state.time,
      step: state.step,
    });
  }

  return points;
}
