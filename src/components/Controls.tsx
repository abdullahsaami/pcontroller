import React, { useState } from 'react';
import { Play, Pause, RotateCcw, StepForward, Sliders, ChevronDown, ChevronUp, Sparkles, Layers } from 'lucide-react';
import type { SimulationConfig } from '../types/simulation';
import { Tooltip } from './Tooltip';

interface ControlsProps {
  config: SimulationConfig;
  onConfigChange: (newConfig: SimulationConfig) => void;
  isRunning: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onStep: () => void;
  onOpenCompare: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  config,
  onConfigChange,
  isRunning,
  onTogglePlay,
  onReset,
  onStep,
  onOpenCompare,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Handle Kp slider change
  const handleKpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKp = parseFloat(e.target.value);
    onConfigChange({ ...config, kp: newKp });
  };

  // Scenario Presets
  const applyPreset = (preset: { offset: number; heading: number; speed: number; kp: number }) => {
    onConfigChange({
      ...config,
      initialLateralOffset: preset.offset,
      initialHeadingDeg: preset.heading,
      speed: preset.speed,
      kp: preset.kp,
    });
    onReset();
  };

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800/90 p-4 sm:p-5 shadow-xl space-y-4">
      {/* Primary Kp Slider Section */}
      <div className="bg-slate-950/60 rounded-xl p-4 border border-cyan-500/20 shadow-inner">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
              Proportional Gain
            </span>
            <Tooltip
              title="Proportional Gain (Kp)"
              content="Kp determines how strongly the controller reacts to the current lateral error. Higher Kp commands more aggressive steering rate per meter of error, which can increase speed of response but may trigger severe overshoot and oscillation."
            />
          </div>

          <div className="flex items-baseline gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            <span className="text-xs font-mono text-cyan-400/80">Kp =</span>
            <span className="text-2xl font-mono font-extrabold text-cyan-300">
              {config.kp.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Kp Slider Input */}
        <div className="relative pt-2 pb-1">
          <input
            type="range"
            min="2.0"
            max="6.0"
            step="0.1"
            value={config.kp}
            onChange={handleKpChange}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />

          {/* Scale Labels */}
          <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 mt-2">
            <div className="flex flex-col items-start">
              <span className="font-semibold text-slate-300">2.0</span>
              <span className="text-[10px] text-blue-400">Low (Gentle)</span>
            </div>
            <span className="text-slate-500">3.0</span>
            <div className="flex flex-col items-center">
              <span className="font-semibold text-cyan-400">4.0</span>
              <span className="text-[10px] text-cyan-400/70">Default</span>
            </div>
            <span className="text-slate-500">5.0</span>
            <div className="flex flex-col items-end">
              <span className="font-semibold text-rose-400">6.0</span>
              <span className="text-[10px] text-rose-400">High (Aggressive)</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
          <span className="text-cyan-400 font-medium">Dynamic Gain:</span> Dragging this slider immediately updates the control law in real-time. Notice how gain controls the ratio between error and steering rate.
        </p>
      </div>

      {/* Main Playback Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Play / Pause Toggle */}
        <button
          onClick={onTogglePlay}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all shadow-md ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold shadow-cyan-500/25'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Start Sim</span>
            </>
          )}
        </button>

        {/* Step Button */}
        <button
          onClick={onStep}
          title="Advance by single timestep (dt = 0.02s)"
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700/70 text-slate-200 text-sm font-medium transition-all hover:border-cyan-500/40"
        >
          <StepForward className="w-4 h-4 text-cyan-400" />
          <span>Step (1 dt)</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={onReset}
          title="Reset vehicle position, heading, and trajectory"
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-rose-500/20 border border-slate-700/70 hover:border-rose-500/40 text-slate-200 hover:text-rose-300 text-sm font-medium transition-all"
        >
          <RotateCcw className="w-4 h-4 text-slate-400 group-hover:text-rose-400" />
          <span>Reset</span>
        </button>

        {/* Compare Kp Button */}
        <button
          onClick={onOpenCompare}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-400 text-purple-300 hover:text-white text-sm font-medium transition-all shadow-sm shadow-purple-500/10"
        >
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Compare Kp</span>
        </button>
      </div>

      {/* Preset Scenarios Quick Picker */}
      <div className="pt-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick Scenario Presets:</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <button
            onClick={() => applyPreset({ offset: 0.50, heading: 0, speed: 1.0, kp: 4.0 })}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 hover:border-cyan-500/40 text-slate-300 text-left transition-all"
          >
            <div className="font-semibold text-white">Default Offset</div>
            <div className="text-[10px] text-slate-400">+0.50m &bull; Kp=4.0</div>
          </button>
          <button
            onClick={() => applyPreset({ offset: -0.80, heading: 0, speed: 1.0, kp: 3.5 })}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 hover:border-cyan-500/40 text-slate-300 text-left transition-all"
          >
            <div className="font-semibold text-white">Opposite Offset</div>
            <div className="text-[10px] text-slate-400">-0.80m &bull; Kp=3.5</div>
          </button>
          <button
            onClick={() => applyPreset({ offset: 0.40, heading: 25, speed: 1.0, kp: 4.5 })}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 hover:border-cyan-500/40 text-slate-300 text-left transition-all"
          >
            <div className="font-semibold text-white">Angle Misalign</div>
            <div className="text-[10px] text-slate-400">+25° &bull; Kp=4.5</div>
          </button>
          <button
            onClick={() => applyPreset({ offset: 0.60, heading: 0, speed: 2.0, kp: 5.5 })}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 hover:border-cyan-500/40 text-slate-300 text-left transition-all"
          >
            <div className="font-semibold text-white">High Speed</div>
            <div className="text-[10px] text-slate-400">2.0m/s &bull; Kp=5.5</div>
          </button>
        </div>
      </div>

      {/* Collapsible Advanced Parameters Panel */}
      <div className="border-t border-slate-800 pt-3">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors py-1"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulation Initial Conditions & Dynamics</span>
          </div>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <div className="mt-3 p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-3.5 animate-in fade-in duration-150">
            {/* Initial Lateral Offset */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span className="flex items-center">
                  Initial Lateral Offset (e₀)
                  <Tooltip content="Initial perpendicular distance from the vehicle to the reference line." />
                </span>
                <span className="text-cyan-400 font-semibold">
                  {config.initialLateralOffset >= 0 ? '+' : ''}
                  {config.initialLateralOffset.toFixed(2)} m
                </span>
              </div>
              <input
                type="range"
                min="-1.2"
                max="1.2"
                step="0.05"
                value={config.initialLateralOffset}
                onChange={(e) => {
                  onConfigChange({ ...config, initialLateralOffset: parseFloat(e.target.value) });
                  onReset();
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Initial Heading */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span className="flex items-center">
                  Initial Heading Angle (θ₀)
                  <Tooltip content="Initial orientation angle of the vehicle relative to the reference road axis." />
                </span>
                <span className="text-cyan-400 font-semibold">
                  {config.initialHeadingDeg >= 0 ? '+' : ''}
                  {config.initialHeadingDeg.toFixed(1)}°
                </span>
              </div>
              <input
                type="range"
                min="-45"
                max="45"
                step="5"
                value={config.initialHeadingDeg}
                onChange={(e) => {
                  onConfigChange({ ...config, initialHeadingDeg: parseFloat(e.target.value) });
                  onReset();
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Vehicle Forward Speed */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span className="flex items-center">
                  Vehicle Speed (v)
                  <Tooltip content="Constant forward driving speed. Higher speed amplifies the lateral response (dy/dt = v*sin(θ)), magnifying oscillation tendencies." />
                </span>
                <span className="text-cyan-400 font-semibold">{config.speed.toFixed(2)} m/s</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="2.5"
                step="0.1"
                value={config.speed}
                onChange={(e) => {
                  onConfigChange({ ...config, speed: parseFloat(e.target.value) });
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Timestep and Clamping info */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono text-slate-400">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500">Timestep (dt):</span> 0.02s (50 Hz)
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500">Max Heading Clamp:</span> &plusmn;{config.maxHeadingDeg}&deg;
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
