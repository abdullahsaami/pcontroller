import React from 'react';
import type { VehicleState } from '../types/simulation';
import { Navigation, SlidersHorizontal } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface GaugesProps {
  vehicleState: VehicleState;
}

export const Gauges: React.FC<GaugesProps> = ({ vehicleState }) => {
  const { lateralError, headingDeg, steeringCommandDeg } = vehicleState;

  // Error gauge normalization (-1.0m to +1.0m range mapped to 0% to 100%)
  const maxDisplayError = 1.0;
  const clampedError = Math.max(-maxDisplayError, Math.min(maxDisplayError, lateralError));
  const errorPercent = 50 + (clampedError / maxDisplayError) * 50;

  // Steering gauge normalization (-120°/s to +120°/s mapped to 0% to 100%)
  const maxDisplaySteer = 120.0;
  const clampedSteer = Math.max(-maxDisplaySteer, Math.min(maxDisplaySteer, steeringCommandDeg));
  const steerPercent = 50 + (clampedSteer / maxDisplaySteer) * 50;

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800/90 p-4 sm:p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200 flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
          <span>Real-Time Visual Engineering Gauges</span>
        </h3>
        <span className="text-[11px] font-mono text-slate-400">Zero-Centered Instruments</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Lateral Error Gauge (Section 10) */}
        <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-1">
              <span className="font-semibold text-slate-200">Lateral Error Gauge</span>
              <Tooltip
                title="Error Indicator"
                content="Displays the vehicle's signed lateral error. The center point represents zero error (vehicle precisely aligned on the path)."
              />
            </div>
            <div className="text-xs text-slate-400 font-mono mb-3">
              e = <span className="text-cyan-400 font-bold">{lateralError >= 0 ? '+' : ''}{lateralError.toFixed(3)} m</span>
            </div>
          </div>

          {/* Horizontal Bipolar Bar */}
          <div>
            <div className="relative w-full h-6 bg-slate-900 rounded-md border border-slate-800 flex items-center overflow-hidden">
              {/* Zero reference center line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-emerald-400/80 z-10" />

              {/* Dynamic filled bar from center */}
              {lateralError >= 0 ? (
                <div
                  className="absolute left-1/2 top-0 bottom-0 bg-gradient-to-r from-cyan-500/40 to-cyan-500 rounded-r transition-all duration-75"
                  style={{ width: `${Math.min(50, (clampedError / maxDisplayError) * 50)}%` }}
                />
              ) : (
                <div
                  className="absolute right-1/2 top-0 bottom-0 bg-gradient-to-l from-rose-500/40 to-rose-500 rounded-l transition-all duration-75"
                  style={{ width: `${Math.min(50, (Math.abs(clampedError) / maxDisplayError) * 50)}%` }}
                />
              )}

              {/* Moving Indicator Needle / Pill */}
              <div
                className="absolute top-1 bottom-1 w-2 -ml-1 rounded bg-white shadow-lg shadow-cyan-500/50 z-20 transition-all duration-75"
                style={{ left: `${errorPercent}%` }}
              />
            </div>

            {/* Scale Markings */}
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1.5">
              <span>-1.0m (Left)</span>
              <span className="text-emerald-400 font-bold">0.0m (Center)</span>
              <span>+1.0m (Right)</span>
            </div>
          </div>
        </div>

        {/* 2. Heading Indicator Compass (Section 11) */}
        <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col justify-between items-center text-center">
          <div className="w-full flex items-center justify-between text-xs font-mono text-slate-300 mb-1">
            <span className="font-semibold text-slate-200">Heading Compass</span>
            <Tooltip
              title="Heading Visualization"
              content="Indicates the vehicle's angular orientation relative to the straight path. 0° means perfectly aligned with forward road motion."
            />
          </div>

          {/* Rotating Compass Disc */}
          <div className="relative w-24 h-24 my-2 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-slate-700 bg-slate-900/80 flex items-center justify-center">
              <div className="absolute top-1 text-[9px] font-mono text-emerald-400 font-bold">0°</div>
              <div className="absolute bottom-1 text-[9px] font-mono text-slate-600">180°</div>
              <div className="absolute left-1.5 text-[9px] font-mono text-slate-600">-90°</div>
              <div className="absolute right-1.5 text-[9px] font-mono text-slate-600">+90°</div>
              <div className="w-16 h-16 rounded-full border border-dashed border-slate-800" />
            </div>

            <div
              className="absolute w-full h-full flex items-center justify-center transition-transform duration-75"
              style={{ transform: `rotate(${headingDeg}deg)` }}
            >
              <Navigation className="w-9 h-9 text-cyan-400 fill-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
            </div>

            <div className="w-2.5 h-2.5 rounded-full bg-white z-20 shadow-md" />
          </div>

          <div className="text-xs font-mono text-slate-300">
            Heading ={' '}
            <span className="text-cyan-400 font-bold">
              {headingDeg >= 0 ? '+' : ''}{headingDeg.toFixed(2)}°
            </span>
          </div>
        </div>

        {/* 3. Steering Command Indicator (Section 12) */}
        <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-1">
              <span className="font-semibold text-slate-200">Steering Gauge</span>
              <Tooltip
                title="Steering Command Gauge"
                content="Live angular turn rate commanded by the proportional controller. Negative steers right/downward, positive steers left/upward."
              />
            </div>
            <div className="text-xs text-slate-400 font-mono mb-3">
              u = <span className="text-purple-400 font-bold">{steeringCommandDeg >= 0 ? '+' : ''}{steeringCommandDeg.toFixed(2)} °/s</span>
            </div>
          </div>

          {/* Horizontal Bipolar Steering Bar */}
          <div>
            <div className="relative w-full h-6 bg-slate-900 rounded-md border border-slate-800 flex items-center overflow-hidden">
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-600 z-10" />

              {steeringCommandDeg >= 0 ? (
                <div
                  className="absolute left-1/2 top-0 bottom-0 bg-gradient-to-r from-purple-600/40 to-purple-500 rounded-r transition-all duration-75"
                  style={{ width: `${Math.min(50, (clampedSteer / maxDisplaySteer) * 50)}%` }}
                />
              ) : (
                <div
                  className="absolute right-1/2 top-0 bottom-0 bg-gradient-to-l from-indigo-600/40 to-indigo-500 rounded-l transition-all duration-75"
                  style={{ width: `${Math.min(50, (Math.abs(clampedSteer) / maxDisplaySteer) * 50)}%` }}
                />
              )}

              <div
                className="absolute top-1 bottom-1 w-2 -ml-1 rounded bg-purple-200 shadow-lg shadow-purple-500/50 z-20 transition-all duration-75"
                style={{ left: `${steerPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1.5">
              <span>-120°/s (Turn CW)</span>
              <span className="text-slate-400 font-bold">0°/s</span>
              <span>+120°/s (Turn CCW)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
