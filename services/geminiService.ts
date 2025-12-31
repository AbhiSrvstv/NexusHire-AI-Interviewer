
import { GoogleGenAI, Type } from "@google/genai";
import { Feedback, ResumeData } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async processResume(base64Data: string, mimeType: string): Promise<ResumeData> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            {
              text: "Extract the following information from this resume: candidate name, target/recent role, a brief professional summary, and a list of key technical skills. Respond in JSON format."
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedName: { type: Type.STRING },
            extractedRole: { type: Type.STRING },
            summary: { type: Type.STRING },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "skills"]
        }
      }
    });

    return JSON.parse(response.text || '{}') as ResumeData;
  }

  async analyzeInterview(transcript: string, role: string, resumeContext?: ResumeData): Promise<Feedback> {
    const contextStr = resumeContext 
      ? `Resume Context: ${resumeContext.summary}. Skills to verify: ${resumeContext.skills.join(', ')}.`
      : "";

    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Analyze this interview transcript for a ${role} position.
        ${contextStr}
        Transcript: ${transcript}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            stats: {
              type: Type.OBJECT,
              properties: {
                clarity: { type: Type.NUMBER },
                confidence: { type: Type.NUMBER },
                technical: { type: Type.NUMBER },
                softSkills: { type: Type.NUMBER }
              },
              required: ["clarity", "confidence", "technical", "softSkills"]
            }
          },
          required: ["overallScore", "summary", "strengths", "weaknesses", "stats"]
        }
      }
    });

    return JSON.parse(response.text || '{}') as Feedback;
  }
}

// Utility functions for audio processing used in Live API
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
