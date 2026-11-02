"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, AlertTriangle, Sparkles } from "lucide-react";
import { emitCaptureState } from "@/lib/captureState";

type SpeechRecognitionResult = {
  readonly isFinal: boolean;
  readonly [index: number]: { transcript: string };
};

type SpeechRecognitionResultList = {
  readonly length: number;
  readonly [index: number]: SpeechRecognitionResult;
};

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

function getSpeechRecognition(): ISpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  lang?: string;
}

const WAVE_BARS = [14, 26, 18, 34, 22, 30, 16];

export function VoiceRecorderButton({ onTranscript, disabled, lang = "en-US" }: VoiceRecorderProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    emitCaptureState({ mode: "speak", isListening });
  }, [isListening]);

  const startListening = useCallback(() => {
    setError(null);

    const SpeechRecognitionAPI = getSpeechRecognition();
    if (!SpeechRecognitionAPI) {
      setError("Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang || "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      onTranscript((finalTranscript + interim).trimStart());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "aborted") {
        setError(`Speech error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript) {
        onTranscript(finalTranscript.trim());
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch {
      setError("Could not access your microphone.");
      setIsListening(false);
    }
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return (
    <div
      className="flex flex-col items-center gap-5"
      style={{ fontFamily: "'Quicksand', ui-rounded, 'Nunito', sans-serif" }}
    >
      <style>{`
        @keyframes rippleRing {
          0% { transform: scale(0.94); opacity: 0.85; }
          50% { transform: scale(1.22); opacity: 0.18; }
          100% { transform: scale(0.94); opacity: 0.85; }
        }
        @keyframes rippleOuterRing {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.42); opacity: 0; }
          100% { transform: scale(1); opacity: 0.5; }
        }
        @keyframes waveBounce {
          0%, 100% { transform: scaleY(0.35); }
          50% { transform: scaleY(1.2); }
        }
      `}</style>

      {/* Button with animated ripple */}
      <div className="relative flex items-center justify-center">
        {isListening && (
          <>
            <span
              className="pointer-events-none absolute h-32 w-32 rounded-full border-4 border-[#ff859d]"
              style={{ animation: "rippleRing 1.6s ease-in-out infinite" }}
              aria-hidden="true"
            />
            <span
              className="pointer-events-none absolute h-32 w-32 rounded-full border-2 border-[#ffb3c6]"
              style={{ animation: "rippleOuterRing 1.6s ease-in-out infinite", animationDelay: "0.2s" }}
              aria-hidden="true"
            />
          </>
        )}

        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          disabled={disabled}
          aria-label={isListening ? "Stop recording dream" : "Start voice recording"}
          className={`relative z-10 flex h-24 w-24 items-center justify-center rounded-3xl transition-all duration-200 hover:scale-105 active:scale-95 active:translate-y-1 ${
            isListening ? "bg-[#ff859d] shadow-[0_0_24px_rgba(255,133,157,0.5)]" : "bg-[#5bb8ff] hover:bg-[#78c8ff] hover:shadow-[0_0_24px_rgba(91,184,255,0.4)]"
          }`}
          style={{
            border: "3px solid #081326",
            boxShadow: "0 6px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.4)",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {isListening ? (
            <Square size={30} className="text-[#081326]" strokeWidth={2.8} />
          ) : (
            <Mic size={34} className="text-[#081326]" strokeWidth={2.6} />
          )}
        </button>
      </div>

      {/* Status Sticker & Equalizer */}
      <div className="flex flex-col items-center gap-2 text-center">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border-2 border-[#081326] px-4 py-1 text-xs font-extrabold shadow-[0_2px_0_0_#081326] ${
            isListening
              ? "bg-[#ff859d] text-[#081326]"
              : "bg-[#0e2040] text-[#cfe3fc]"
          }`}
        >
          {isListening ? (
            <>
              <span className="h-2 w-2 rounded-full bg-[#081326] animate-ping" />
              Listening… tap to stop
            </>
          ) : (
            <>
              <Sparkles size={13} className="text-[#ffe082]" />
              Tap mic to speak your dream
            </>
          )}
        </span>

        {isListening && (
          <div className="flex h-8 items-center justify-center gap-1 pt-1" aria-hidden="true">
            {WAVE_BARS.map((height, i) => (
              <span
                key={i}
                className="w-1.5 rounded-full bg-[#64dfd0] border border-[#081326]"
                style={{
                  height: `${height}px`,
                  animation: `waveBounce ${0.5 + (i % 3) * 0.15}s ease-in-out infinite alternate`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cartoon Error Speech Bubble */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-2xl border-2 border-[#081326] bg-[#3a2340] px-4 py-2.5 text-xs font-bold text-[#ffd2db] shadow-[0_3px_0_0_#081326]"
        >
          <AlertTriangle size={15} className="shrink-0 text-[#ff859d]" strokeWidth={2.5} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}