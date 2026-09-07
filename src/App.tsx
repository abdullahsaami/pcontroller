import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  SimulationConfig,
  VehicleState,
  TrajectoryPoint,
  StepInspectionData,
} from './types/simulation';
import { DEFAULT_CONFIG, createInitialState, stepSimulation } from './physics/vehicleModel';
import { computePerformanceStats, classifyBehavior } from './physics/classifier';
import { Header } from './components/Header';
import { SimulationCanvas } from './components/SimulationCanvas';
import { Controls } from './components/Controls';
import { TelemetryPanel } from './components/TelemetryPanel';
import { Gauges } from './components/Gauges';
import { LiveCharts } from './components/LiveCharts';
import { StepInspector } from './components/StepInspector';
import { FeedbackLoopDiagram } from './components/FeedbackLoopDiagram';
import { EducationalGuide } from './components/EducationalGuide';
import { ComparisonModal } from './components/ComparisonModal';

export const App: React.FC = () => {
  // Master Simulation Configuration
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);

  // Vehicle Dynamic State
  const [vehicleState, setVehicleState] = useState<VehicleState>(() => createInitialState(DEFAULT_CONFIG));

  // Full Trajectory History
  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([
    {
      x: 0,
      y: -DEFAULT_CONFIG.initialLateralOffset,
      headingDeg: DEFAULT_CONFIG.initialHeadingDeg,
      lateralError: DEFAULT_CONFIG.initialLateralOffset,
      steeringCommandDeg: 0,
      time: 0,
      step: 0,
    },
  ]);

  // Playback State (Paused by default as specified in Section 33)
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Step-by-Step Inspector Data
  const [inspection, setInspection] = useState<StepInspectionData | null>(null);

  // Kp Comparison Modal
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);

  // Telemetry Audio Synthesis
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // References for continuous physics loop
  const stateRef = useRef<VehicleState>(vehicleState);
  stateRef.current = vehicleState;
  const configRef = useRef<SimulationConfig>(config);
  configRef.current = config;
  const isRunningRef = useRef<boolean>(isRunning);
  isRunningRef.current = isRunning;
  const lastTimeRef = useRef<number | null>(null);
  const accumulatorRef = useRef<number>(0);

  // Web Audio initialization & modulation
  useEffect(() => {
    if (!soundEnabled) {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
          oscRef.current.disconnect();
        } catch {}
        oscRef.current = null;
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscRef.current = osc;
      gainRef.current = gain;
    } catch {
      setSoundEnabled(false);
    }

    return () => {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
          oscRef.current.disconnect();
        } catch {}
        oscRef.current = null;
      }
    };
  }, [soundEnabled]);

  // Modulate sound based on steering and vehicle motion
  useEffect(() => {
    if (!soundEnabled || !oscRef.current || !gainRef.current || !audioCtxRef.current) return;
    if (!isRunning) {
      gainRef.current.gain.setTargetAtTime(0.0, audioCtxRef.current.currentTime, 0.05);
      return;
    }

    const freq = 120 + Math.abs(vehicleState.steeringCommandDeg) * 2.5 + Math.abs(vehicleState.headingDeg) * 1.5;
    oscRef.current.frequency.setTargetAtTime(freq, audioCtxRef.current.currentTime, 0.05);
    gainRef.current.gain.setTargetAtTime(0.03, audioCtxRef.current.currentTime, 0.05);
  }, [vehicleState, isRunning, soundEnabled]);

  // Advance simulation by a single discrete step
  const executeStep = useCallback(() => {
    const current = stateRef.current;
    const currentCfg = configRef.current;

    const { nextState, inspection: stepData } = stepSimulation(current, currentCfg);
    stateRef.current = nextState;
    setVehicleState(nextState);
    setInspection(stepData);

    setTrajectory((prev) => {
      const newPt: TrajectoryPoint = {
        x: nextState.x,
        y: nextState.y,
        headingDeg: nextState.headingDeg,
        lateralError: nextState.lateralError,
        steeringCommandDeg: nextState.steeringCommandDeg,
        time: nextState.time,
        step: nextState.step,
      };
      if (prev.length > 2500) {
        return [...prev.slice(prev.length - 2000), newPt];
      }
      return [...prev, newPt];
    });
  }, []);

  // Main 60fps RequestAnimationFrame physics loop with fixed timestep integration
  useEffect(() => {
    let animId: number;

    const loop = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const frameDelta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (isRunningRef.current) {
        const safeDelta = Math.min(frameDelta, 0.1);
        accumulatorRef.current += safeDelta;

        const dt = configRef.current.dt;
        while (accumulatorRef.current >= dt) {
          executeStep();
          accumulatorRef.current -= dt;
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [executeStep]);

  // Reset simulation to initial condition (preserving current selected Kp)
  const handleReset = useCallback(() => {
    setIsRunning(false);
    const freshState = createInitialState(config);
    stateRef.current = freshState;
    setVehicleState(freshState);
    setInspection(null);
    setTrajectory([
      {
        x: 0,
        y: freshState.y,
        headingDeg: freshState.headingDeg,
        lateralError: freshState.lateralError,
        steeringCommandDeg: freshState.steeringCommandDeg,
        time: 0,
        step: 0,
      },
    ]);
    accumulatorRef.current = 0;
    lastTimeRef.current = null;
  }, [config]);

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    setIsRunning((prev) => !prev);
    lastTimeRef.current = null;
  };

  // Single step trigger
  const handleStep = () => {
    setIsRunning(false);
    executeStep();
  };

  // Export CSV of trajectory
  const handleExportCSV = () => {
    if (trajectory.length === 0) return;
    const headers = ['time_s', 'step', 'pos_x_m', 'pos_y_m', 'lateral_error_m', 'heading_deg', 'steering_deg_s', 'kp'];
    const rows = trajectory.map((pt) => [
      pt.time.toFixed(3),
      pt.step,
      pt.x.toFixed(4),
      pt.y.toFixed(4),
      pt.lateralError.toFixed(4),
      pt.headingDeg.toFixed(3),
      pt.steeringCommandDeg.toFixed(3),
      config.kp.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `p_controller_kp_${config.kp.toFixed(1)}_run.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleReset();
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        handleStep();
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        setIsCompareOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleReset, handleStep]);

  // Performance Statistics & Behavior Classification
  const performanceStats = computePerformanceStats(trajectory);
  const behaviorClassification = classifyBehavior(trajectory, performanceStats, config.kp);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation Bar */}
      <Header
        isRunning={isRunning}
        onOpenCompare={() => setIsCompareOpen(true)}
        onReset={handleReset}
        onExportCSV={handleExportCSV}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 space-y-6">
        {/* Top Section: Responsive Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column (7 of 12 cols): Simulation Canvas & Live Charts */}
          <div className="lg:col-span-7 space-y-5">
            {/* 2D Autonomous Vehicle Canvas */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Test Track &bull; Top-Down Vehicle Kinematics
                </span>
                <span className="text-[11px] font-mono text-cyan-400">
                  y_ref = 0.00m &bull; Drag / Zoom Enabled
                </span>
              </div>
              <SimulationCanvas
                vehicleState={vehicleState}
                trajectory={trajectory}
                config={config}
                isRunning={isRunning}
              />
            </div>

            {/* Closed-Loop Control Architecture Diagram */}
            <FeedbackLoopDiagram
              vehicleState={vehicleState}
              config={config}
              isRunning={isRunning}
            />

            {/* Real-time Oscilloscope Dual Charts */}
            <LiveCharts
              trajectory={trajectory}
              currentTime={vehicleState.time}
            />
          </div>

          {/* Right Column (5 of 12 cols): Controls, Telemetry & Gauges */}
          <div className="lg:col-span-5 space-y-5">
            {/* Primary Kp Slider & Playback Controls */}
            <Controls
              config={config}
              onConfigChange={(newCfg) => setConfig(newCfg)}
              isRunning={isRunning}
              onTogglePlay={handleTogglePlay}
              onReset={handleReset}
              onStep={handleStep}
              onOpenCompare={() => setIsCompareOpen(true)}
            />

            {/* Real-Time Telemetry & Live Equation Display */}
            <TelemetryPanel
              vehicleState={vehicleState}
              config={config}
            />

            {/* Visual Engineering Gauges (Error, Heading, Steering) */}
            <Gauges vehicleState={vehicleState} />

            {/* Discrete Step Inspector */}
            <StepInspector
              inspection={inspection}
              onStep={handleStep}
            />
          </div>
        </div>

        {/* Bottom Section: Comprehensive Educational Guide, Statistics & Theory */}
        <section className="pt-2">
          <EducationalGuide
            stats={performanceStats}
            classification={behaviorClassification}
            config={config}
            onSelectKp={(newKp) => {
              setConfig((prev) => ({ ...prev, kp: newKp }));
            }}
          />
        </section>

        {/* Hotkeys Bar */}
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">Space</kbd> Start/Pause</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">S</kbd> Step</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">R</kbd> Reset</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">C</kbd> Compare Kp</span>
          </div>
          <div className="text-slate-500 text-[11px]">
            Robotics & Control Systems Education Platform
          </div>
        </div>
      </main>

      {/* Kp Multi-Gain Comparison Modal */}
      <ComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        baseConfig={config}
        onSelectKp={(newKp) => {
          setConfig((prev) => ({ ...prev, kp: newKp }));
          handleReset();
        }}
      />
    </div>
  );
};

export default App;
