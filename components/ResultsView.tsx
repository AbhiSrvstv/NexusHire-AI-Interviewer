
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Feedback } from '../types';

interface ResultsViewProps {
  feedback: Feedback;
  onReset: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ feedback, onReset }) => {
  const chartData = [
    { subject: 'Clarity', A: feedback.stats.clarity, fullMark: 100 },
    { subject: 'Confidence', A: feedback.stats.confidence, fullMark: 100 },
    { subject: 'Technical', A: feedback.stats.technical, fullMark: 100 },
    { subject: 'Soft Skills', A: feedback.stats.softSkills, fullMark: 100 },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
          <i className="fas fa-check-circle"></i> Interview Complete
        </div>
        <h2 className="text-4xl font-bold">Analysis Results</h2>
        <p className="text-slate-400 max-w-xl mx-auto">
          Our AI recruiter Nexus has processed your performance. Here is your detailed breakdown.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-[2rem] flex flex-col items-center justify-center space-y-6">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96" cy="96" r="80"
                fill="transparent"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="12"
              />
              <circle
                cx="96" cy="96" r="80"
                fill="transparent"
                stroke="url(#grad1)"
                strokeWidth="12"
                strokeDasharray={2 * Math.PI * 80}
                strokeDashoffset={2 * Math.PI * 80 * (1 - feedback.overallScore / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#3b82f6' }} />
                  <stop offset="100%" style={{ stopColor: '#8b5cf6' }} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-5xl font-bold">{feedback.overallScore}</span>
              <span className="text-slate-500 text-sm font-medium">Overall Score</span>
            </div>
          </div>
          
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Radar
                  name="Score"
                  dataKey="A"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass p-6 rounded-3xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-quote-left text-violet-400"></i>
              Executive Summary
            </h3>
            <p className="text-slate-300 leading-relaxed text-sm">
              {feedback.summary}
            </p>
          </div>

          <div className="glass p-6 rounded-3xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-plus-circle text-emerald-400"></i>
              Key Strengths
            </h3>
            <ul className="space-y-3">
              {feedback.strengths.map((s, i) => (
                <li key={i} className="flex gap-3 items-start text-sm text-slate-400">
                  <i className="fas fa-check text-emerald-500 mt-1"></i>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass p-6 rounded-3xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-arrow-up text-amber-400"></i>
              Growth Areas
            </h3>
            <ul className="space-y-3">
              {feedback.weaknesses.map((w, i) => (
                <li key={i} className="flex gap-3 items-start text-sm text-slate-400">
                  <i className="fas fa-lightbulb text-amber-500 mt-1"></i>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button 
          onClick={onReset}
          className="bg-white text-slate-900 px-10 py-4 rounded-full font-bold hover:bg-slate-200 transition-all shadow-xl"
        >
          Conduct New Interview
        </button>
      </div>
    </div>
  );
};

export default ResultsView;
