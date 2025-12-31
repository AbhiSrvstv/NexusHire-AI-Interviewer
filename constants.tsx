
import React from 'react';

export const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  accent: '#10b981',
  danger: '#ef4444',
  background: '#0f172a',
  surface: '#1e293b'
};

export const LOGO = (
  <div className="flex items-center gap-2">
    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
      <i className="fas fa-brain text-white text-xl"></i>
    </div>
    <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
      NexusHire
    </span>
  </div>
);
