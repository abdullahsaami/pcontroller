import React from 'react';
import type { VehicleState, SimulationConfig } from '../types/simulation';
import { Gauge, ArrowRight, CornerDownRight } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface TelemetryPanelProps {
  vehicleState: VehicleState;
  config: SimulationConfig;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ vehicleState, config }) => {
  const { kp } = config;
  const { lateralError, headingDeg, steeringCommand, steeringCommandDeg, v, time } = vehicleState;

  // Sign formatting helpers
  const formatSigned3 = (val: number) => (val >= 0 ? '+' : '') + val.toFixed(3);
  const formatSigned2 = (val: number) => (val >= 0 ? '+' : '') + val.toFixed(2);

  // Dynamic Equation calculation
  const rawProduct = kp * lateralError;

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800/90 p-4 sm:p-5 shadow-xl space-y-4">
      {/* Telemetry Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200">
            Real-Time Vehicle Telemetry
          </h2>
        </div>
        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
          50 Hz Synchronized
        </span>
      </div>

      {/* 6 Key Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {/* Kp */}
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span>Proportional Gain</span>
            <Tooltip
              title="Kp Gain"
              content="Ratio between commanded steering velocity and measured lateral error."
            />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-cyan-300">
            {kp.toFixed(2)}
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-0.5">unitless gain</div>
        </div>

        {/* Lateral Error */}
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span>Lateral Error (e)</span>
            <Tooltip
              title="Cross-Track Lateral Error"
              content="Signed distance between vehicle and reference path (y_target - y_actual). Zero means centered."
            />
          </div>
          <div
            className={`text-xl sm:text-2xl font-mono font-bold ${
              Math.abs(lateralError) < 0.05
                ? 'text-emerald-400'
                : Math.abs(lateralError) < 0.2
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {formatSigned3(lateralError)}
            <span className="text-sm font-normal text-slate-400 ml-1">m</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
            {lateralError >= 0 ? 'Below Centerline' : 'Above Centerline'}
          </div>
        </div>

        {/* Vehicle Heading */}
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span>Heading (θ)</span>
            <Tooltip
              title="Vehicle Heading Angle"
              content="Current orientation of the vehicle body relative to the straight track."
            />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-cyan-300">
            {formatSigned2(headingDeg)}
            <span className="text-sm font-normal text-slate-400 ml-0.5">°</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
            {Math.abs(headingDeg) < 1.0 ? 'Aligned with Road' : headingDeg > 0 ? 'Steering Upward' : 'Steering Downward'}
          </div>
        </div>

        {/* Steering Command */}
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span>Steering Rate (u)</span>
            <Tooltip
              title="Steering Command"
              content="Calculated angular velocity commanded to rotate the vehicle heading toward the target line."
            />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-purple-300">
            {formatSigned2(steeringCommandDeg)}
            <span className="text-sm font-normal text-slate-400 ml-1">°/s</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
            {formatSigned2(steeringCommand)} rad/s
          </div>
        </div>

        {/* Vehicle Speed */}
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span>Forward Speed (v)</span>
            <Tooltip
              title="Forward Velocity"
              content="Forward translation speed. Lateral displacement velocity equals v * sin(θ)."
            />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-slate-200">
            {v.toFixed(2)}
            <span className="text-sm font-normal text-slate-400 ml-1">m/s</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-0.5">{(v * 3.6).toFixed(1)} km/h</div>
        </div>

        {/* Simulation Time */}
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span>Elapsed Time (t)</span>
            <Tooltip
              title="Simulation Time"
              content="Discrete time accumulated in the physics integration loop."
            />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-400">
            {time.toFixed(2)}
            <span className="text-sm font-normal text-slate-400 ml-1">s</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-0.5">step #{vehicleState.step}</div>
        </div>
      </div>

      {/* Live Dynamic Equation Display (Section 9) */}
      <div className="p-3.5 rounded-lg bg-gradient-to-br from-slate-950 to-slate-900 border border-cyan-500/30 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-semibold text-cyan-400 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>LIVE CONTROL LAW EVALUATION</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            u(t) = Kp &times; e(t)
          </span>
        </div>

        <div className="space-y-1.5 font-mono text-xs sm:text-sm">
          {/* Direct Calculation */}
          <div className="flex items-center flex-wrap gap-2 text-slate-300">
            <span className="text-purple-400 font-bold">u</span>
            <span>=</span>
            <span className="text-cyan-400 font-semibold">{kp.toFixed(2)}</span>
            <span>&times;</span>
            <span className="text-amber-400 font-semibold">({formatSigned3(lateralError)} m)</span>
            <span>=</span>
            <span className="text-purple-300 font-bold">{formatSigned3(rawProduct)} rad/s</span>
          </div>

          {/* Degrees/Second Conversion */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-400 pt-1 border-t border-slate-800/80">
            <CornerDownRight className="w-3.5 h-3.5 text-cyan-400" />
            <span>Angular Rate Conversion:</span>
            <span className="text-slate-300">
              {formatSigned3(rawProduct)} rad/s &times; (180 / &pi;)
            </span>
            <span>=</span>
            <span className="text-purple-400 font-bold">{formatSigned2(steeringCommandDeg)} °/s</span>
          </div>

          {/* Heading Rate Impact */}
          <div className="flex items-center flex-wrap gap-1.5 text-[11px] text-slate-500 pt-0.5">
            <ArrowRight className="w-3 h-3 text-emerald-400" />
            <span>Kinematic Propagation:</span>
            <span>&Delta;&theta; = u &times; dt</span>
            <span>&rarr;</span>
            <span className="text-slate-400">
              &Delta;&theta; = {formatSigned2(steeringCommandDeg * config.dt)}° per {config.dt}s step
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
