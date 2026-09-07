import React from 'react';
import type { VehicleState, SimulationConfig } from '../types/simulation';
import { RefreshCw } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface FeedbackLoopDiagramProps {
  vehicleState: VehicleState;
  config: SimulationConfig;
  isRunning: boolean;
}

export const FeedbackLoopDiagram: React.FC<FeedbackLoopDiagramProps> = ({
  vehicleState,
  config,
  isRunning,
}) => {
  const { lateralError, steeringCommandDeg, headingDeg, y } = vehicleState;
  const { kp } = config;

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800/90 p-4 sm:p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 text-cyan-400 ${isRunning ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
          <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200">
            Closed-Loop Control Architecture
          </h3>
        </div>
        <span className="text-[11px] font-mono text-cyan-400/80 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
          Live Signal Feedback
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Autonomous vehicles cannot move laterally without first changing their heading. This introduces a <strong>two-stage delay</strong> (double integrator) between the steering command and the resulting lateral position:
      </p>

      {/* Visual Pipeline Diagram */}
      <div className="relative py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Node 1: Lateral Error */}
          <div className="relative p-3 rounded-lg bg-slate-950 border border-cyan-500/40 shadow-lg shadow-cyan-500/5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span className="font-bold text-cyan-400">1. ERROR SENSOR</span>
              <Tooltip
                title="Cross-Track Error"
                content="Lidar or camera senses lateral deviation: e = y_ref - y"
              />
            </div>
            <div className="my-1.5 font-mono">
              <div className="text-xs text-slate-400">e(t) = y<sub>ref</sub> &minus; y</div>
              <div className="text-base font-bold text-amber-400 mt-1">
                {lateralError >= 0 ? '+' : ''}{lateralError.toFixed(3)} m
              </div>
            </div>
            <div className="text-[10px] font-mono text-slate-500">Inputs to P-Controller</div>
          </div>

          {/* Node 2: P-Controller */}
          <div className="relative p-3 rounded-lg bg-slate-950 border border-purple-500/40 shadow-lg shadow-purple-500/5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span className="font-bold text-purple-400">2. P-CONTROLLER</span>
              <Tooltip
                title="Proportional Control Law"
                content="Multiplies error by gain Kp to produce commanded turn rate."
              />
            </div>
            <div className="my-1.5 font-mono">
              <div className="text-xs text-slate-400">u(t) = Kp &times; e(t)</div>
              <div className="text-base font-bold text-purple-300 mt-1">
                Kp = {kp.toFixed(1)}
              </div>
            </div>
            <div className="text-[10px] font-mono text-slate-500">Calculates steering rate</div>
          </div>

          {/* Node 3: Steering Actuation */}
          <div className="relative p-3 rounded-lg bg-slate-950 border border-purple-500/40 shadow-lg shadow-purple-500/5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span className="font-bold text-purple-300">3. STEERING ACTUATOR</span>
              <Tooltip
                title="Steering Velocity"
                content="Commanded rate of rotation for the vehicle body."
              />
            </div>
            <div className="my-1.5 font-mono">
              <div className="text-xs text-slate-400">Heading Rate d&theta;/dt</div>
              <div className="text-base font-bold text-purple-400 mt-1">
                {steeringCommandDeg >= 0 ? '+' : ''}{steeringCommandDeg.toFixed(1)} °/s
              </div>
            </div>
            <div className="text-[10px] font-mono text-slate-500">First Integration (Rate &rarr; Angle)</div>
          </div>

          {/* Node 4: Vehicle Heading */}
          <div className="relative p-3 rounded-lg bg-slate-950 border border-emerald-500/40 shadow-lg shadow-emerald-500/5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span className="font-bold text-emerald-400">4. VEHICLE HEADING</span>
              <Tooltip
                title="Vehicle Heading Angle"
                content="Vehicle orientation angle θ accumulated over time."
              />
            </div>
            <div className="my-1.5 font-mono">
              <div className="text-xs text-slate-400">&theta; = &int; u dt</div>
              <div className="text-base font-bold text-emerald-300 mt-1">
                &theta; = {headingDeg >= 0 ? '+' : ''}{headingDeg.toFixed(2)}°
              </div>
            </div>
            <div className="text-[10px] font-mono text-slate-500">Forward velocity projects laterally</div>
          </div>

          {/* Node 5: Lateral Motion & Feedback */}
          <div className="relative p-3 rounded-lg bg-slate-950 border border-blue-500/40 shadow-lg shadow-blue-500/5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span className="font-bold text-blue-400">5. LATERAL POSITION</span>
              <Tooltip
                title="Lateral Motion"
                content="dy/dt = v * sin(θ). Second integration producing lateral displacement."
              />
            </div>
            <div className="my-1.5 font-mono">
              <div className="text-xs text-slate-400">dy/dt = v &times; sin(&theta;)</div>
              <div className="text-base font-bold text-blue-300 mt-1">
                y = {y >= 0 ? '+' : ''}{y.toFixed(3)} m
              </div>
            </div>
            <div className="text-[10px] font-mono text-cyan-400 font-semibold flex items-center gap-1">
              <span>&larr; Loops to Node 1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Oscillation explanation callout */}
      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200/90 leading-relaxed">
        <strong className="text-amber-300">Why pure P-control overshoots:</strong> When the vehicle crosses the reference line (e = 0), the steering command drops to zero (u = 0). However, because of accumulated heading (&theta; &ne; 0) and forward speed (v), the vehicle continues traveling across the line! It must travel far into negative error before the controller can reverse the heading.
      </div>
    </div>
  );
};
