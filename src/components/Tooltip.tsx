import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  title?: string;
  children?: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, title, children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      {children}
      <button
        type="button"
        className="ml-1.5 text-slate-400 hover:text-cyan-400 focus:outline-none transition-colors duration-150 inline-flex items-center"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(!visible)}
        aria-label="Info"
      >
        <HelpCircle className="w-3.5 h-3.5 opacity-70 hover:opacity-100" />
      </button>

      {visible && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-slate-900/95 backdrop-blur-md text-xs text-slate-200 rounded-lg border border-cyan-500/30 shadow-xl shadow-black/50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          {title && <div className="font-semibold text-cyan-400 mb-1 border-b border-slate-700/60 pb-1">{title}</div>}
          <div className="leading-relaxed">{content}</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95" />
        </div>
      )}
    </div>
  );
};
