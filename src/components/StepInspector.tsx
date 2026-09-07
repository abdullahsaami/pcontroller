import React from 'react';
import type { StepInspectionData } from '../types/simulation';
import { Footprints } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface StepInspectorProps {
  inspection: StepInspectionData | null;
  onStep: () => void;
}

export const StepInspector: React.FC<StepInspectorProps> = ({ inspection, onStep }) => {
  if (!inspection) {
    return (
      <div className="bg-slate-900/90 rounded-xl border border-slate-800/90 p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
          <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200 flex items-center gap-2">
            <Footprints className="w-3.5 h-3.5 text-cyan-400" />
            <span>Discrete-Time Step Execution Inspector</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-500">Awaiting single-step execution</span>
        </div>
        <p className="text-xs text-slate-400">
          Click the <strong className="text-cyan-400">Step (1 dt)</strong> button above to advance the simulation by exactly one timestep (dt = 0.02s) and examine the exact numerical flow from error to steering command to vehicle displacement.
        </p>
      </div>
    );
  }

  const {
    stepNumber,
    time,
    currentY,
    lateralError,
    kp,
    steeringCommandRad,
    steeringCommandDeg,
    deltaHeadingDeg,
    newHeadingDeg,
    deltaX,
    deltaY,
    newY,
  } = inspection;

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800/90 p-4 sm:p-5 shadow-xl space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Footprints className="w-3.5 h-3.5 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200">
            Discrete-Time Step Execution Inspector
          </h3>
          <Tooltip
            title="Step-by-Step Mathematical Pipeline"
            content="Displays the exact discrete sequence executed on every simulation timestep (dt = 0.02s). Notice how the P-controller command acts directly on heading rate, and forward speed v acts on heading to displace the vehicle laterally."
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold">
            Step #{stepNumber} (t = {time.toFixed(2)}s)
          </span>
          <button
            onClick={onStep}
            className="text-xs px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors font-mono"
          >
            +1 Step
          </button>
        </div>
      </div>

      {/* Sequential Pipeline Flow Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 font-mono text-xs">
        {/* Step 1: Error */}
        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
              1. Compute Lateral Error
            </div>
            <div className="text-slate-400 text-[11px]">
              e = y<sub>target</sub> &minus; y<sub>actual</sub>
            </div>
          </div>
          <div className="mt-2 text-sm font-bold text-amber-400">
            e = {lateralError >= 0 ? '+' : ''}{lateralError.toFixed(3)} m
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            y<sub>current</sub> = {currentY.toFixed(3)} m
          </div>
        </div>

        {/* Step 2: P Control Law */}
        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
              2. P-Controller Output
            </div>
            <div className="text-slate-400 text-[11px]">
              u = Kp &times; e = {kp.toFixed(1)} &times; {lateralError.toFixed(3)}
            </div>
          </div>
          <div className="mt-2 text-sm font-bold text-purple-400">
            u = {steeringCommandRad >= 0 ? '+' : ''}{steeringCommandRad.toFixed(3)} rad/s
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            = {steeringCommandDeg >= 0 ? '+' : ''}{steeringCommandDeg.toFixed(2)} °/s
          </div>
        </div>

        {/* Step 3: Heading Update */}
        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
              3. Update Vehicle Heading
            </div>
            <div className="text-slate-400 text-[11px]">
              &theta;<sub>new</sub> = &theta; + u &times; dt
            </div>
          </div>
          <div className="mt-2 text-sm font-bold text-cyan-300">
            &theta; = {newHeadingDeg >= 0 ? '+' : ''}{newHeadingDeg.toFixed(2)}°
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            &Delta;&theta; = {deltaHeadingDeg >= 0 ? '+' : ''}{deltaHeadingDeg.toFixed(2)}°
          </div>
        </div>

        {/* Step 4: Position Update */}
        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
              4. Propagate Vehicle Motion
            </div>
            <div className="text-slate-400 text-[11px]">
              &Delta;y = v &times; sin(&theta;) &times; dt
            </div>
          </div>
          <div className="mt-2 text-sm font-bold text-emerald-400">
            y<sub>new</sub> = {newY >= 0 ? '+' : ''}{newY.toFixed(3)} m
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            &Delta;x = +{deltaX.toFixed(3)}m, &Delta;y = {deltaY >= 0 ? '+' : ''}{deltaY.toFixed(3)}m
          </div>
        </div>
      </div>
    </div>
  );
};
