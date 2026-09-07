import React from 'react';
import { Activity, RotateCcw, Volume2, VolumeX, Download, Layers } from 'lucide-react';

interface HeaderProps {
  isRunning: boolean;
  onOpenCompare: () => void;
  onReset: () => void;
  onExportCSV: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isRunning,
  onOpenCompare,
  onReset,
  onExportCSV,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Title & Brand */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <span>P-Controller Vehicle Simulator</span>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 hidden sm:inline-block">
                    CONTROL LAB v2.0
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Interactive Cross-Track Error & Steering Feedback Dynamics (Kp = 2.0 → 6.0)
              </p>
            </div>
          </div>

          {/* Status Indicator (Mobile) */}
          <div className="flex md:hidden items-center gap-1.5">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                isRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
              }`}
            />
            <span className="text-xs font-mono font-medium text-slate-300">
              {isRunning ? 'RUNNING' : 'PAUSED'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-end overflow-x-auto pb-1 md:pb-0">
          {/* Status Indicator (Desktop) */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <span
              className={`w-2 h-2 rounded-full ${
                isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-xs font-mono font-medium text-slate-300">
              {isRunning ? 'ACTIVE SIMULATION' : 'SIMULATION PAUSED'}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Disable telemetry audio' : 'Enable telemetry audio'}
            className={`p-2 rounded-lg border transition-all text-xs font-medium flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-sm shadow-cyan-500/10'
                : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden lg:inline">{soundEnabled ? 'Audio On' : 'Muted'}</span>
          </button>

          {/* Compare Kp Button */}
          <button
            onClick={onOpenCompare}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 border border-purple-500/30 hover:border-cyan-500/40 text-purple-200 hover:text-white transition-all text-xs font-medium flex items-center gap-1.5 shadow-sm shadow-purple-500/10"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Compare Kp</span>
          </button>

          {/* Export CSV Data */}
          <button
            onClick={onExportCSV}
            title="Export trajectory and telemetry data to CSV"
            className="px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 hover:border-slate-600 text-slate-300 hover:text-white transition-all text-xs font-medium flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Quick Reset */}
          <button
            onClick={onReset}
            title="Reset vehicle position, trajectory, and graphs"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800/60 hover:bg-rose-500/20 border border-slate-700/50 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 transition-all text-xs font-medium flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
