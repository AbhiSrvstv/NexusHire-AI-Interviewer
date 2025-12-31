
import React, { useState, useRef } from 'react';
import Layout from './components/Layout';
import InterviewRoom from './components/InterviewRoom';
import ResultsView from './components/ResultsView';
import { AppState, Feedback, ResumeData } from './types';
import { GeminiService } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.LANDING);
  const [role, setRole] = useState("Senior Full-Stack Developer");
  const [candidateName, setCandidateName] = useState("");
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isProcessingResume, setIsProcessingResume] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingResume(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const service = new GeminiService();
        const data = await service.processResume(base64, file.type);
        setResumeData(data);
        if (data.extractedName) setCandidateName(data.extractedName);
        if (data.extractedRole) setRole(data.extractedRole);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Failed to process resume", err);
    } finally {
      setIsProcessingResume(false);
    }
  };

  const handleStartInterview = (e: React.FormEvent) => {
    e.preventDefault();
    if (candidateName.trim() && role.trim()) {
      setState(AppState.INTERVIEWING);
    }
  };

  const handleEndInterview = async (transcript: string) => {
    setIsAnalyzing(true);
    setState(AppState.RESULTS);
    try {
      const service = new GeminiService();
      const result = await service.analyzeInterview(transcript, role, resumeData || undefined);
      setFeedback(result);
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderLanding = () => (
    <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
      <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
          Next-Gen <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-500">Resume Interviews</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Upload your resume and let NexusHire conduct a personalized technical screen for any role, any level.
        </p>
      </div>

      <div className="glass p-10 rounded-[3rem] shadow-2xl border border-white/5 max-w-lg mx-auto animate-in fade-in zoom-in duration-1000 delay-200">
        <div className="mb-8 p-6 border-2 border-dashed border-white/10 rounded-3xl bg-white/5 hover:bg-white/10 transition-all group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf,.doc,.docx,.ppt,.pptx"
            onChange={handleFileUpload}
          />
          <div className="flex flex-col items-center gap-3">
            {isProcessingResume ? (
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent animate-spin rounded-full"></div>
            ) : (
              <i className={`fas ${resumeData ? 'fa-file-circle-check text-emerald-400' : 'fa-cloud-arrow-up text-slate-400 group-hover:text-blue-400'} text-3xl transition-colors`}></i>
            )}
            <p className={`text-sm font-medium ${resumeData ? 'text-emerald-400' : 'text-slate-400 group-hover:text-white'}`}>
              {isProcessingResume ? 'Analyzing Resume...' : resumeData ? 'Resume Attached!' : 'Upload PDF / DOC / PPT Resume'}
            </p>
            {resumeData && (
              <p className="text-[10px] text-slate-500">Personalized context loaded</p>
            )}
          </div>
        </div>

        <form onSubmit={handleStartInterview} className="space-y-6">
          <div className="space-y-2 text-left">
            <label className="text-sm font-semibold text-slate-300 ml-1">Candidate Name</label>
            <input 
              required
              type="text" 
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
            />
          </div>
          <div className="space-y-2 text-left">
            <label className="text-sm font-semibold text-slate-300 ml-1">Target Role & Experience</label>
            <input 
              required
              type="text" 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Senior Java Engineer (8+ yrs)"
              className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98]"
          >
            Start Dynamic Interview
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 opacity-60">
        <div className="space-y-2">
            <i className="fas fa-file-invoice text-2xl text-emerald-400"></i>
            <h4 className="font-bold">Resume Context</h4>
            <p className="text-xs text-slate-500">AI extracts your experience for custom questions</p>
        </div>
        <div className="space-y-2">
            <i className="fas fa-microphone-lines text-2xl text-blue-400"></i>
            <h4 className="font-bold">Natural Voice</h4>
            <p className="text-xs text-slate-500">Talk to Nexus like a real recruiter</p>
        </div>
        <div className="space-y-2">
            <i className="fas fa-microchip text-2xl text-violet-400"></i>
            <h4 className="font-bold">Deep Assessment</h4>
            <p className="text-xs text-slate-500">Tailored to your specific tech stack</p>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      {state === AppState.LANDING && renderLanding()}
      
      {state === AppState.INTERVIEWING && (
        <InterviewRoom 
          role={role} 
          candidateName={candidateName} 
          resumeContext={resumeData || undefined}
          onEnd={handleEndInterview} 
        />
      )}

      {state === AppState.RESULTS && (
        <div className="relative">
          {isAnalyzing ? (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
               <div className="relative w-24 h-24">
                  <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
               </div>
               <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold">Nexus is Thinking</h3>
                  <p className="text-slate-400 animate-pulse">Analyzing transcript against resume data...</p>
               </div>
            </div>
          ) : (
            feedback && <ResultsView feedback={feedback} onReset={() => {
              setState(AppState.LANDING);
              setResumeData(null);
            }} />
          )}
        </div>
      )}
    </Layout>
  );
};

export default App;
