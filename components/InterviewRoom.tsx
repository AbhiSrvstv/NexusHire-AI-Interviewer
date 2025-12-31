
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { decodeBase64, encodeBase64, decodeAudioData } from "../services/geminiService";
import { ResumeData } from '../types';

interface InterviewRoomProps {
  role: string;
  candidateName: string;
  resumeContext?: ResumeData;
  onEnd: (transcript: string) => void;
}

const InterviewRoom: React.FC<InterviewRoomProps> = ({ role, candidateName, resumeContext, onEnd }) => {
  const [isLive, setIsLive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptRef = useRef<string>("");

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const startSession = useCallback(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const outputNode = audioContextRef.current.createGain();
    outputNode.connect(audioContextRef.current.destination);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    const resumePrompt = resumeContext 
      ? `The candidate's resume shows experience in: ${resumeContext.summary}. Key skills to probe: ${resumeContext.skills.join(', ')}.`
      : "";

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          setIsLive(true);
          const source = inputAudioContext.createMediaStreamSource(stream);
          const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
          
          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              int16[i] = inputData[i] * 32768;
            }
            const pcmBlob = {
              data: encodeBase64(new Uint8Array(int16.buffer)),
              mimeType: 'audio/pcm;rate=16000',
            };
            sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
          };
          
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputAudioContext.destination);
        },
        onmessage: async (message) => {
          if (message.serverContent?.outputTranscription) {
            const text = message.serverContent.outputTranscription.text;
            transcriptRef.current += text + " ";
          }

          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio && audioContextRef.current) {
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
            const audioBuffer = await decodeAudioData(
              decodeBase64(base64Audio),
              audioContextRef.current,
              24000,
              1
            );
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputNode);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            sourcesRef.current.add(source);
          }

          if (message.serverContent?.interrupted) {
            sourcesRef.current.forEach(s => {
              try { s.stop(); } catch(e) {}
            });
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }
        },
        onerror: (e) => console.error("Session Error", e),
        onclose: () => setIsLive(false)
      },
      config: {
        responseModalities: [Modality.AUDIO],
        outputAudioTranscription: {},
        systemInstruction: `You are an expert recruiter named Nexus. You are interviewing ${candidateName} for a ${role} position. ${resumePrompt} Be professional, probing, and insightful. Start by welcoming them. Do not mention that you have their resume explicitly unless it makes the conversation flow better. Ask deep technical questions based on their reported skills.`,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
        }
      }
    });
  }, [candidateName, role, resumeContext]);

  return (
    <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="relative aspect-video rounded-3xl overflow-hidden glass shadow-2xl border-2 border-white/10">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="w-full h-full object-cover scale-x-[-1]"
          />
          <div className="absolute top-6 left-6 flex gap-3">
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isLive ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-slate-500/20 text-slate-400 border border-slate-500/50'}`}>
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`}></div>
              {isLive ? 'Live Session' : 'Standby'}
            </div>
          </div>
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
             <button 
                onClick={isLive ? () => onEnd(transcriptRef.current) : startSession}
                className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold transition-all shadow-xl ${isLive ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20' : 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20'}`}
             >
                <i className={`fas ${isLive ? 'fa-phone-slash' : 'fa-play'}`}></i>
                {isLive ? 'End Interview' : 'Start Interview'}
             </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="glass p-6 rounded-3xl h-[300px] flex flex-col">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <i className="fas fa-wave-square text-blue-400"></i>
            Real-time Status
          </h3>
          <div className="flex-grow flex flex-col justify-center items-center text-center space-y-4">
            {isLive ? (
              <>
                <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
                <p className="text-slate-400 text-sm">Nexus is listening and analyzing...</p>
              </>
            ) : (
              <p className="text-slate-500 italic">Ready when you are, {candidateName}.</p>
            )}
          </div>
        </div>

        <div className="glass p-6 rounded-3xl">
          <h3 className="text-lg font-bold mb-4">Context</h3>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Target Role</label>
              <p className="text-white font-medium">{role}</p>
            </div>
            {resumeContext && (
               <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                 <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Extracted Skills</label>
                 <div className="flex flex-wrap gap-1 mt-1">
                    {resumeContext.skills.slice(0, 5).map((s, i) => (
                      <span key={i} className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md">{s}</span>
                    ))}
                    {resumeContext.skills.length > 5 && <span className="text-[10px] text-slate-500">+{resumeContext.skills.length - 5} more</span>}
                 </div>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;
