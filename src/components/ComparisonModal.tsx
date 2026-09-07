import React, { useMemo, useRef, useEffect, useState } from 'react';
import type { SimulationConfig, ComparisonRun } from '../types/simulation';
import { runSimulationBatch } from '../physics/vehicleModel';
import { computePerformanceStats, classifyBehavior } from '../physics/classifier';
import { X, Layers, TrendingUp } from 'lucide-react';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseConfig: SimulationConfig;
  onSelectKp: (kp: number) => void;
}

const KP_COLORS = [
  { kp: 2.0, hex: '#3b82f6', label: 'Kp = 2.0 (Low)' },
  { kp: 3.0, hex: '#06b6d4', label: 'Kp = 3.0 (Mild)' },
  { kp: 4.0, hex: '#10b981', label: 'Kp = 4.0 (Default)' },
  { kp: 5.0, hex: '#f59e0b', label: 'Kp = 5.0 (High)' },
  { kp: 6.0, hex: '#ef4444', label: 'Kp = 6.0 (Aggressive)' },
];

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  baseConfig,
  onSelectKp,
}) => {
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedKps, setSelectedKps] = useState<number[]>([2.0, 3.0, 4.0, 5.0, 6.0]);

  // Compute simulations for all 5 Kp values under identical initial conditions
  const comparisonRuns: ComparisonRun[] = useMemo(() => {
    if (!isOpen) return [];

    const duration = 8.0; // 8 seconds test run
    return KP_COLORS.map(({ kp, hex }) => {
      const configForRun: SimulationConfig = {
        ...baseConfig,
        kp,
      };
      const points = runSimulationBatch(configForRun, duration);
      const stats = computePerformanceStats(points);
      const classification = classifyBehavior(points, stats, kp);

      return {
        kp,
        color: hex,
        points,
        stats,
        classification,
      };
    });
  }, [isOpen, baseConfig]);

  // Render multi-line overlaid trajectory comparison chart
  useEffect(() => {
    if (!isOpen) return;
    const canvas = chartCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Dark canvas background
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, width, height);

    const padLeft = 45;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 30;
    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;

    const maxTime = 8.0;
    const yMin = -0.7;
    const yMax = 0.7;

    const toPlotX = (t: number) => padLeft + (t / maxTime) * plotWidth;
    const toPlotY = (val: number) => padTop + plotHeight - ((val - yMin) / (yMax - yMin)) * plotHeight;

    // Grid lines
    ctx.strokeStyle = '#152033';
    ctx.lineWidth = 1;
    const yTicks = [-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6];
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#4a5d80';
    ctx.textAlign = 'right';

    for (const yVal of yTicks) {
      const py = toPlotY(yVal);
      ctx.beginPath();
      ctx.moveTo(padLeft, py);
      ctx.lineTo(width - padRight, py);
      ctx.stroke();
      ctx.fillText(`${yVal >= 0 ? '+' : ''}${yVal.toFixed(1)}m`, padLeft - 6, py + 3);
    }

    // Zero Reference Line
    const zeroY = toPlotY(0);
    ctx.strokeStyle = '#00f0ff40';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padLeft, zeroY);
    ctx.lineTo(width - padRight, zeroY);
    ctx.stroke();

    // Time Ticks
    ctx.textAlign = 'center';
    for (let t = 0; t <= maxTime; t += 1) {
      const px = toPlotX(t);
      ctx.beginPath();
      ctx.moveTo(px, padTop);
      ctx.lineTo(px, padTop + plotHeight);
      ctx.stroke();
      ctx.fillText(`${t}s`, px, height - 10);
    }

    // Draw lines for each run
    comparisonRuns.forEach((run) => {
      if (!selectedKps.includes(run.kp)) return;
      ctx.save();
      ctx.strokeStyle = run.color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();

      let started = false;
      for (const pt of run.points) {
        const px = toPlotX(pt.time);
        const py = toPlotY(pt.lateralError);
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      ctx.restore();
    });

    ctx.restore();
  }, [isOpen, comparisonRuns, selectedKps]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Proportional Gain Benchmark Matrix</span>
                <span className="text-xs font-mono font-normal text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded border border-purple-500/30">
                  Kp = 2.0 &bull; 3.0 &bull; 4.0 &bull; 5.0 &bull; 6.0
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Fair comparison: identical initial conditions (e₀ = {baseConfig.initialLateralOffset >= 0 ? '+' : ''}{baseConfig.initialLateralOffset.toFixed(2)}m, θ₀ = {baseConfig.initialHeadingDeg}°, v = {baseConfig.speed.toFixed(1)}m/s)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Overlaid Trajectory Comparison Chart */}
          <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase text-slate-200 tracking-wider">
                  Comparative Error Trajectories: e(t) over 8.0 Seconds
                </h3>
                <span className="text-[11px] text-slate-400">
                  Notice how increasing Kp sharpens initial slope but amplifies overshoot and oscillations.
                </span>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-2">
                {KP_COLORS.map(({ kp, hex, label }) => {
                  const isChecked = selectedKps.includes(kp);
                  return (
                    <button
                      key={kp}
                      onClick={() => {
                        setSelectedKps((prev) =>
                          isChecked ? prev.filter((k) => k !== kp) : [...prev, kp]
                        );
                      }}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 font-mono ${
                        isChecked
                          ? 'border-slate-500 bg-slate-800 text-white shadow-sm'
                          : 'border-slate-800 bg-slate-900/50 text-slate-500 opacity-60'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hex }} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-full h-56 rounded bg-[#080c14] border border-slate-800/80 overflow-hidden">
              <canvas ref={chartCanvasRef} className="w-full h-full block" />
            </div>
          </div>

          {/* Performance Scorecard Table (Section 16 & 25) */}
          <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 overflow-x-auto">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-200 tracking-wider mb-3">
              Experimental Performance Comparison Scorecard
            </h3>

            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="py-2 px-3">Controller Gain</th>
                  <th className="py-2 px-3">Behavior Type</th>
                  <th className="py-2 px-3">Max Error</th>
                  <th className="py-2 px-3">Mean Abs Error</th>
                  <th className="py-2 px-3">Zero Crossings</th>
                  <th className="py-2 px-3">Settling Time</th>
                  <th className="py-2 px-3">Max Steering</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {comparisonRuns.map((run) => {
                  return (
                    <tr key={run.kp} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: run.color }}
                          />
                          <span className="font-bold text-white text-sm">
                            Kp = {run.kp.toFixed(1)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${run.classification.badgeColor}`}
                        >
                          {run.classification.title}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-300">
                        {run.stats.maxAbsoluteError.toFixed(3)} m
                      </td>

                      <td className="py-3 px-3 text-slate-300">
                        {run.stats.meanAbsoluteError.toFixed(3)} m
                      </td>

                      <td className="py-3 px-3 font-semibold">
                        <span
                          className={
                            run.stats.zeroCrossings >= 3
                              ? 'text-rose-400'
                              : run.stats.zeroCrossings >= 1
                              ? 'text-amber-400'
                              : 'text-blue-400'
                          }
                        >
                          {run.stats.zeroCrossings}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-300">
                        {run.stats.settlingTime !== null ? (
                          <span className="text-emerald-400 font-medium">
                            {run.stats.settlingTime.toFixed(2)} s
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Did not settle</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-purple-300">
                        {run.stats.maxSteeringCommandDeg.toFixed(1)} °/s
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            onSelectKp(run.kp);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 font-semibold text-xs transition-colors"
                        >
                          Apply Kp
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Educational Insights Summary */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs text-slate-300 leading-relaxed">
            <h4 className="font-bold text-white flex items-center gap-1.5 font-mono">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Key Observation for Control Engineers</span>
            </h4>
            <p>
              &bull; <strong>Low Gain (Kp = 2.0):</strong> Sluggish response. The vehicle heads gradually toward the centerline with virtually no zero crossings, but takes the longest time to eliminate error.
            </p>
            <p>
              &bull; <strong>Balanced Gain (Kp = 3.0 &ndash; 4.0):</strong> Rapid response time with mild overshoot. The vehicle converges toward the target line within a reasonable distance.
            </p>
            <p>
              &bull; <strong>Aggressive Gain (Kp = 5.0 &ndash; 6.0):</strong> High steering commands cause violent directional changes. Momentum carries the vehicle past the centerline, resulting in sustained sinusoidal oscillation.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Close Benchmark
          </button>
        </div>
      </div>
    </div>
  );
};
