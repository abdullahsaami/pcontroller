import React from 'react';
import type { PerformanceStats, BehaviorClassification, SimulationConfig } from '../types/simulation';
import { BookOpen, CheckCircle2, AlertCircle, HelpCircle, Activity, Award } from 'lucide-react';

interface EducationalGuideProps {
  stats: PerformanceStats;
  classification: BehaviorClassification;
  config: SimulationConfig;
  onSelectKp: (kp: number) => void;
}

export const EducationalGuide: React.FC<EducationalGuideProps> = ({
  stats,
  classification,
  config,
  onSelectKp,
}) => {
  const kpTicks = [2.0, 3.0, 4.0, 5.0, 6.0];

  return (
    <div className="space-y-6">
      {/* 1. Live Behavior Classification & Performance Statistics (Section 15 & 25) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Real-time Behavior Classifier (Section 15) */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800/90 p-4 sm:p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200">
                  Dynamic Behavior Classification
                </h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${classification.badgeColor}`}>
                {classification.title}
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-100 mb-1">
              {classification.description}
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              {classification.explanation}
            </p>
          </div>

          <div className="mt-4 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
            <strong className="text-cyan-400">Control Principle:</strong> The optimal Kp is not a fixed universal constant; it fundamentally depends on vehicle speed ($v$), mechanical steering actuator limits, sensor latency, and sample period ($dt$).
          </div>
        </div>

        {/* Live Performance Statistics (Section 25) */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800/90 p-4 sm:p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200">
                Run Performance Statistics
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Cumulative Telemetry</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
            <div className="p-2 rounded bg-slate-950/70 border border-slate-800">
              <div className="text-[10px] text-slate-500">Max Abs Error</div>
              <div className="text-sm font-bold text-slate-200 mt-0.5">
                {stats.maxAbsoluteError.toFixed(3)} m
              </div>
            </div>

            <div className="p-2 rounded bg-slate-950/70 border border-slate-800">
              <div className="text-[10px] text-slate-500">Mean Abs Error</div>
              <div className="text-sm font-bold text-slate-200 mt-0.5">
                {stats.meanAbsoluteError.toFixed(3)} m
              </div>
            </div>

            <div className="p-2 rounded bg-slate-950/70 border border-slate-800">
              <div className="text-[10px] text-slate-500">Max Steering Rate</div>
              <div className="text-sm font-bold text-purple-300 mt-0.5">
                {stats.maxSteeringCommandDeg.toFixed(1)} °/s
              </div>
            </div>

            <div className="p-2 rounded bg-slate-950/70 border border-slate-800">
              <div className="text-[10px] text-slate-500">Zero Crossings</div>
              <div
                className={`text-sm font-bold mt-0.5 ${
                  stats.zeroCrossings >= 3
                    ? 'text-rose-400'
                    : stats.zeroCrossings >= 1
                    ? 'text-amber-400'
                    : 'text-blue-400'
                }`}
              >
                {stats.zeroCrossings}
              </div>
            </div>

            <div className="p-2 rounded bg-slate-950/70 border border-slate-800">
              <div className="text-[10px] text-slate-500">Settling Time (&le;3cm)</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                {stats.settlingTime !== null ? `${stats.settlingTime.toFixed(2)} s` : 'N/A'}
              </div>
            </div>

            <div className="p-2 rounded bg-slate-950/70 border border-slate-800">
              <div className="text-[10px] text-slate-500">Final Error</div>
              <div className="text-sm font-bold text-slate-200 mt-0.5">
                {stats.finalError >= 0 ? '+' : ''}{stats.finalError.toFixed(3)} m
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Kp Range Explorer (Section 24) */}
      <div className="bg-slate-900/90 rounded-xl border border-slate-800/90 p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200 flex items-center gap-2">
            <span>Kp Range Explorer (Gain Sensitivity Scale)</span>
          </h3>
          <span className="text-xs font-mono text-cyan-400 font-bold">Current: Kp = {config.kp.toFixed(1)}</span>
        </div>

        {/* Visual interactive scale */}
        <div className="relative pt-3 pb-1">
          <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-emerald-500 via-amber-500 to-rose-500 rounded-full" />
          
          <div className="flex justify-between mt-2.5 font-mono text-xs">
            {kpTicks.map((val) => {
              const isCurrent = Math.abs(config.kp - val) < 0.05;
              return (
                <button
                  key={val}
                  onClick={() => onSelectKp(val)}
                  className={`flex flex-col items-center group transition-all ${
                    isCurrent ? 'scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                      isCurrent
                        ? 'bg-cyan-400 border-white shadow-lg shadow-cyan-400/50'
                        : 'bg-slate-800 border-slate-600 group-hover:border-cyan-400'
                    }`}
                  />
                  <span className={`mt-1 font-bold ${isCurrent ? 'text-cyan-300' : 'text-slate-400'}`}>
                    {val.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {val === 2.0 ? 'Sluggish' : val === 4.0 ? 'Nominal' : val === 6.0 ? 'Hunting' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Core Educational Theory Sections (Section 21, 22, 23, 35) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section 21: What is Kp? */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800/90 p-4 sm:p-5 shadow-xl space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>What is Kp?</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-cyan-400">Kp (Proportional Gain)</strong> determines how strongly the controller reacts to the current lateral error:
          </p>
          <div className="p-2.5 rounded bg-slate-950 font-mono text-xs text-cyan-300 border border-slate-800">
            u(t) = Kp &times; e(t)
          </div>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4 leading-relaxed">
            <li><strong className="text-blue-400">Low Kp (e.g. 2.0):</strong> Weak steering correction. The vehicle makes slow, gentle turns and requires a long distance to return to the path.</li>
            <li><strong className="text-rose-400">High Kp (e.g. 6.0):</strong> Strong steering correction. The vehicle turns aggressively, but momentum causes it to overshoot the path.</li>
            <li><strong className="text-amber-400">Important:</strong> Higher Kp does <em>not</em> automatically mean better tracking! Excessive gain causes instability and continuous oscillation.</li>
          </ul>
        </div>

        {/* Section 22: Why does P-control oscillate? */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800/90 p-4 sm:p-5 shadow-xl space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Why Does Pure P-Control Oscillate?</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            In vehicle robotics, lateral steering is a <strong>second-order system (double integrator)</strong>:
          </p>
          <div className="p-2.5 rounded bg-slate-950 font-mono text-[11px] text-amber-300 border border-slate-800 space-y-1">
            <div>Large Error &rarr; Large Steering Rate</div>
            <div>&rarr; Vehicle Accumulates Non-Zero Heading (&theta; &ne; 0)</div>
            <div>&rarr; Vehicle Drives Across Reference Line (e = 0)</div>
            <div>&rarr; Controller Drops Output to 0, but &theta; Still Carries It Across!</div>
            <div>&rarr; Error Flips Sign &rarr; Counter-Steering Begins &rarr; <strong>Oscillation</strong></div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Because a vehicle must turn to move sideways, heading represents stored kinetic momentum. Without a damping mechanism, this creates continuous undamped hunting across the target line.
          </p>
        </div>

        {/* Section 23: What should I look for? */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800/90 p-4 sm:p-5 shadow-xl space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>What Should I Look For? (Tuning Checklist)</span>
          </h3>
          <p className="text-xs text-slate-300">
            When tuning Kp in control engineering, evaluate these key criteria:
          </p>
          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">&check;</span>
              <span><strong>Rise Time:</strong> How quickly the vehicle starts moving toward the reference line.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">&check;</span>
              <span><strong>Overshoot:</strong> How far the vehicle travels past the centerline on its first crossing.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">&check;</span>
              <span><strong>Zero Crossings:</strong> The number of times the vehicle weaves across the line.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">&check;</span>
              <span><strong>Actuator Limits:</strong> Whether steering commands stay within safe, physically realizable limits.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">&check;</span>
              <span><strong>Settling Time:</strong> How quickly residual error drops below acceptable road tolerances.</span>
            </div>
          </div>
        </div>

        {/* Section 35: The Key Idea & Why D is Needed in PID */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800/90 p-4 sm:p-5 shadow-xl space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-purple-400" />
            <span>The Key Idea: Why We Need the "D" in PID</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            A proportional controller only looks at <strong>where you are right now</strong> ($e(t)$). It has zero knowledge of <strong>how fast you are approaching the line</strong> ($de/dt$).
          </p>
          <div className="p-2.5 rounded bg-slate-950 font-mono text-xs text-purple-300 border border-slate-800">
            u<sub>PID</sub>(t) = Kp &times; e(t) + Kd &times; (de/dt)
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            When the vehicle is rapidly approaching the line, $de/dt$ is negative. The <strong>Derivative (D) term</strong> acts as an <em>anticipatory damper / brake</em>, straightening the steering wheels <em>before</em> the vehicle crosses the line, effectively stopping the oscillations you see here!
          </p>
        </div>
      </div>
    </div>
  );
};
