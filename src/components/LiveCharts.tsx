import React, { useRef, useEffect, useState } from 'react';
import type { TrajectoryPoint } from '../types/simulation';
import { LineChart } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface LiveChartsProps {
  trajectory: TrajectoryPoint[];
  currentTime: number;
}

export const LiveCharts: React.FC<LiveChartsProps> = ({ trajectory, currentTime }) => {
  const errorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const steerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewWindow, setViewWindow] = useState<'all' | '10s'>('all');

  // Render error vs time chart
  useEffect(() => {
    const canvas = errorCanvasRef.current;
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

    // Background
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, width, height);

    // Padding for axes
    const padLeft = 45;
    const padRight = 15;
    const padTop = 15;
    const padBottom = 25;
    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;

    // Time window calculation
    let minTime = 0;
    let maxTime = Math.max(5.0, currentTime);
    if (viewWindow === '10s' && currentTime > 10) {
      minTime = currentTime - 10;
      maxTime = currentTime;
    }

    // Y bounds for error: symmetrically -1.0m to +1.0m (or dynamically scaled)
    let maxAbsErr = 0.8;
    for (const pt of trajectory) {
      if (Math.abs(pt.lateralError) > maxAbsErr) {
        maxAbsErr = Math.ceil(Math.abs(pt.lateralError) * 10) / 10;
      }
    }
    const yMin = -maxAbsErr;
    const yMax = maxAbsErr;

    const toPlotX = (t: number) => padLeft + ((t - minTime) / (maxTime - minTime || 1)) * plotWidth;
    const toPlotY = (val: number) => padTop + plotHeight - ((val - yMin) / (yMax - yMin || 1)) * plotHeight;

    // Grid lines
    ctx.strokeStyle = '#152033';
    ctx.lineWidth = 1;

    // Y ticks (-max, -0.5, 0, 0.5, max)
    const yTicks = [yMin, yMin / 2, 0, yMax / 2, yMax];
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#4a5d80';
    ctx.textAlign = 'right';

    for (const yVal of yTicks) {
      const py = toPlotY(yVal);
      ctx.beginPath();
      ctx.moveTo(padLeft, py);
      ctx.lineTo(width - padRight, py);
      ctx.stroke();

      ctx.fillText(`${yVal >= 0 ? '+' : ''}${yVal.toFixed(2)}m`, padLeft - 6, py + 3);
    }

    // Zero Reference Line (e = 0)
    const zeroY = toPlotY(0);
    ctx.save();
    ctx.strokeStyle = '#00f0ff44';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padLeft, zeroY);
    ctx.lineTo(width - padRight, zeroY);
    ctx.stroke();
    ctx.restore();

    // Time ticks
    ctx.textAlign = 'center';
    const timeStep = Math.max(1, Math.round((maxTime - minTime) / 5));
    for (let t = Math.ceil(minTime); t <= maxTime; t += timeStep) {
      const px = toPlotX(t);
      if (px >= padLeft && px <= width - padRight) {
        ctx.beginPath();
        ctx.moveTo(px, padTop);
        ctx.lineTo(px, padTop + plotHeight);
        ctx.stroke();
        ctx.fillText(`${t.toFixed(0)}s`, px, height - 8);
      }
    }

    // Draw Data Line
    if (trajectory.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();

      let started = false;
      for (const pt of trajectory) {
        if (pt.time < minTime) continue;
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

      // Current point dot
      const latest = trajectory[trajectory.length - 1];
      if (latest && latest.time >= minTime) {
        const cx = toPlotX(latest.time);
        const cy = toPlotY(latest.lateralError);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }, [trajectory, currentTime, viewWindow]);

  // Render steering command vs time chart
  useEffect(() => {
    const canvas = steerCanvasRef.current;
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

    // Background
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, width, height);

    const padLeft = 45;
    const padRight = 15;
    const padTop = 15;
    const padBottom = 25;
    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;

    let minTime = 0;
    let maxTime = Math.max(5.0, currentTime);
    if (viewWindow === '10s' && currentTime > 10) {
      minTime = currentTime - 10;
      maxTime = currentTime;
    }

    let maxAbsSteer = 60.0;
    for (const pt of trajectory) {
      if (Math.abs(pt.steeringCommandDeg) > maxAbsSteer) {
        maxAbsSteer = Math.ceil(Math.abs(pt.steeringCommandDeg) / 10) * 10;
      }
    }
    const yMin = -maxAbsSteer;
    const yMax = maxAbsSteer;

    const toPlotX = (t: number) => padLeft + ((t - minTime) / (maxTime - minTime || 1)) * plotWidth;
    const toPlotY = (val: number) => padTop + plotHeight - ((val - yMin) / (yMax - yMin || 1)) * plotHeight;

    // Grid lines
    ctx.strokeStyle = '#152033';
    ctx.lineWidth = 1;

    const yTicks = [yMin, yMin / 2, 0, yMax / 2, yMax];
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#4a5d80';
    ctx.textAlign = 'right';

    for (const yVal of yTicks) {
      const py = toPlotY(yVal);
      ctx.beginPath();
      ctx.moveTo(padLeft, py);
      ctx.lineTo(width - padRight, py);
      ctx.stroke();

      ctx.fillText(`${yVal >= 0 ? '+' : ''}${yVal.toFixed(0)}°`, padLeft - 6, py + 3);
    }

    // Zero Reference Line
    const zeroY = toPlotY(0);
    ctx.save();
    ctx.strokeStyle = '#a855f744';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padLeft, zeroY);
    ctx.lineTo(width - padRight, zeroY);
    ctx.stroke();
    ctx.restore();

    // Time ticks
    ctx.textAlign = 'center';
    const timeStep = Math.max(1, Math.round((maxTime - minTime) / 5));
    for (let t = Math.ceil(minTime); t <= maxTime; t += timeStep) {
      const px = toPlotX(t);
      if (px >= padLeft && px <= width - padRight) {
        ctx.beginPath();
        ctx.moveTo(px, padTop);
        ctx.lineTo(px, padTop + plotHeight);
        ctx.stroke();
        ctx.fillText(`${t.toFixed(0)}s`, px, height - 8);
      }
    }

    // Draw Data Line
    if (trajectory.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.beginPath();

      let started = false;
      for (const pt of trajectory) {
        if (pt.time < minTime) continue;
        const px = toPlotX(pt.time);
        const py = toPlotY(pt.steeringCommandDeg);

        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      const latest = trajectory[trajectory.length - 1];
      if (latest && latest.time >= minTime) {
        const cx = toPlotX(latest.time);
        const cy = toPlotY(latest.steeringCommandDeg);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }, [trajectory, currentTime, viewWindow]);

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800/90 p-4 sm:p-5 shadow-xl space-y-4">
      {/* Charts Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <LineChart className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200">
            Real-Time Oscilloscope & Response Curves
          </h3>
        </div>

        {/* Time Window Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-[11px] font-mono">
          <span className="text-slate-400 hidden sm:inline">Window:</span>
          <button
            onClick={() => setViewWindow('all')}
            className={`px-2 py-0.5 rounded ${
              viewWindow === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Full Run
          </button>
          <button
            onClick={() => setViewWindow('10s')}
            className={`px-2 py-0.5 rounded ${
              viewWindow === '10s' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Last 10s
          </button>
        </div>
      </div>

      {/* Side-by-Side Dual Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Lateral Error vs Time (Section 13) */}
        <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="text-xs font-mono font-semibold text-slate-200">
                Lateral Error vs Time: e(t)
              </span>
              <Tooltip
                title="Lateral Error Curve"
                content="Tracks cross-track error over time. For low Kp, the curve approaches zero slowly. For high Kp, it crosses zero repeatedly, showcasing harmonic oscillations."
              />
            </div>
            <span className="text-[10px] font-mono text-cyan-400/80">Y: meters | X: seconds</span>
          </div>
          <div className="w-full h-44 rounded bg-[#080c14] border border-slate-800/80 overflow-hidden">
            <canvas ref={errorCanvasRef} className="w-full h-full block" />
          </div>
        </div>

        {/* Chart 2: Steering Command vs Time (Section 14) */}
        <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span className="text-xs font-mono font-semibold text-slate-200">
                Steering Command vs Time: u(t)
              </span>
              <Tooltip
                title="Steering Command Response"
                content="Illustrates the proportional response law: u(t) = Kp * e(t). When error peaks, steering commands peak simultaneously."
              />
            </div>
            <span className="text-[10px] font-mono text-purple-400/80">Y: deg/s | X: seconds</span>
          </div>
          <div className="w-full h-44 rounded bg-[#080c14] border border-slate-800/80 overflow-hidden">
            <canvas ref={steerCanvasRef} className="w-full h-full block" />
          </div>
        </div>
      </div>
    </div>
  );
};
