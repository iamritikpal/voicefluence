import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import '../styles/voiceagent.css';

let sessionCounter = 0;

function VoiceAgent({ onAudioReady, generating, userName }) {
  const [phase, setPhase] = useState('greeting');
  const [displayedText, setDisplayedText] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [clickToHear, setClickToHear] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const typewriterRef = useRef(null);
  const ttsAudioRef = useRef(null);
  const ttsResolveRef = useRef(null);
  const sessionRef = useRef(0);
  const abortRef = useRef(null);
  const audioUnlockedRef = useRef(false);

  const firstName = userName ? userName.split(' ')[0] : 'there';

  function stopCurrentTts() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current.currentTime = 0;
      ttsAudioRef.current = null;
    }
    if (ttsResolveRef.current) {
      ttsResolveRef.current();
      ttsResolveRef.current = null;
    }
    setSpeaking(false);
  }

  function stopTypewriter() {
    if (typewriterRef.current) {
      clearTimeout(typewriterRef.current);
      typewriterRef.current = null;
    }
  }

  async function speakText(text, session) {
    stopCurrentTts();
    if (sessionRef.current !== session) return;

    setSpeaking(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await api.post('/tts/speak', { text }, {
        responseType: 'blob',
        signal: controller.signal,
      });

      if (sessionRef.current !== session) {
        setSpeaking(false);
        return;
      }

      const blob = new Blob([res.data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      ttsAudioRef.current = audio;
      abortRef.current = null;

      await new Promise((resolve) => {
        ttsResolveRef.current = resolve;
        const done = () => {
          if (ttsAudioRef.current === audio) ttsAudioRef.current = null;
          if (ttsResolveRef.current === resolve) ttsResolveRef.current = null;
          URL.revokeObjectURL(url);
          setSpeaking(false);
          resolve();
        };
        audio.onended = () => {
          audioUnlockedRef.current = true;
          setClickToHear(false);
          done();
        };
        audio.onerror = done;
        audio.play().then(() => {}).catch(() => {
          if (!audioUnlockedRef.current) setClickToHear(true);
          done();
        });
      });
    } catch (err) {
      if (err && err.name === 'CanceledError') {
        // expected when session changes
      }
      setSpeaking(false);
    }
  }

  function typewriterAnimate(text, session) {
    stopTypewriter();
    if (sessionRef.current !== session) return;
    setDisplayedText('');
    let i = 0;
    const step = () => {
      if (sessionRef.current !== session) return;
      if (i <= text.length) {
        setDisplayedText(text.slice(0, i));
        i++;
        typewriterRef.current = setTimeout(step, 28);
      }
    };
    step();
  }

  async function speakAndType(text, session) {
    if (sessionRef.current !== session) return;
    typewriterAnimate(text, session);
    await speakText(text, session);
    if (sessionRef.current === session) {
      stopTypewriter();
      setDisplayedText(text);
    }
  }

  async function speakLine(text) {
    const session = sessionRef.current;
    setDisplayedText(text);
    await speakText(text, session);
  }

  function unlockAudio() {
    const silentWav = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    const a = new Audio(silentWav);
    a.play().catch(() => {});
    audioUnlockedRef.current = true;
    setClickToHear(false);
  }

  async function runGreeting(session) {
    const lines = [
      `Hi ${firstName}! I'm ready to turn your thoughts into a powerful LinkedIn post.`,
      "What's on your mind today? Share an insight, a story, or an opinion.",
      "Tap the mic when you're ready. I'll handle the rest.",
    ];
    for (let i = 0; i < lines.length; i++) {
      if (sessionRef.current !== session) return;
      await speakAndType(lines[i], session);
      if (sessionRef.current !== session) return;
      if (i < lines.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    if (sessionRef.current === session) setPhase('idle');
  }

  function handleUnlockAndPlay() {
    if (!clickToHear && audioUnlockedRef.current) return;
    unlockAudio();
    setClickToHear(false);
    sessionCounter++;
    const session = sessionCounter;
    sessionRef.current = session;
    setPhase('greeting');
    setDisplayedText('');
    stopTypewriter();
    stopCurrentTts();
    runGreeting(session);
  }

  useEffect(() => {
    sessionCounter++;
    const session = sessionCounter;
    sessionRef.current = session;
    const lines = [
      `Hi ${firstName}! I'm ready to turn your thoughts into a powerful LinkedIn post.`,
      "What's on your mind today? Share an insight, a story, or an opinion.",
      "Tap the mic when you're ready. I'll handle the rest.",
    ];
    (async () => {
      for (let i = 0; i < lines.length; i++) {
        if (sessionRef.current !== session) return;
        await speakAndType(lines[i], session);
        if (sessionRef.current !== session) return;
        if (i < lines.length - 1) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
      if (sessionRef.current === session) setPhase('idle');
    })();
    return () => {
      sessionRef.current = -1;
      stopTypewriter();
      stopCurrentTts();
    };
  }, []);

  const startRecording = async () => {
    sessionCounter++;
    sessionRef.current = sessionCounter;
    stopCurrentTts();
    stopTypewriter();
    setPhase('recording');

    const session = sessionRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (sessionRef.current !== session) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setDuration(0);
      setAudioUrl(null);
      setAudioBlob(null);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
        clearInterval(timerRef.current);
        setPhase('recorded');
        speakLine("Great! I've got your recording. Hit Generate when you're ready.");
      };

      mediaRecorder.start(1000);
      setRecording(true);
      setDisplayedText("I'm listening... take your time.");

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      setPhase('idle');
      setDisplayedText('I need microphone access to record. Please allow permissions and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleGenerate = () => {
    if (audioBlob) {
      speakLine('Working on your LinkedIn post...');
      onAudioReady(audioBlob);
    }
  };

  const handleRecordAgain = () => {
    setAudioUrl(null);
    setAudioBlob(null);
    setPhase('idle');
    speakLine("Tap the mic when you're ready. I'll handle the rest.");
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const orbClass = [
    'agent-orb',
    phase === 'greeting' && 'orb-greeting',
    phase === 'idle' && 'orb-idle',
    phase === 'recording' && 'orb-recording',
    phase === 'recorded' && 'orb-ready',
    generating && 'orb-generating',
    speaking && 'orb-speaking',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="voice-agent" onClick={clickToHear ? handleUnlockAndPlay : undefined} role={clickToHear ? 'button' : undefined} tabIndex={clickToHear ? 0 : undefined} onKeyDown={clickToHear ? (e) => e.key === 'Enter' && handleUnlockAndPlay() : undefined}>
      {clickToHear && (
        <div className="click-to-hear-banner" onClick={(e) => { e.stopPropagation(); handleUnlockAndPlay(); }}>
          Click here to hear greeting
        </div>
      )}
      <div className="agent-visual">
        <div className={orbClass}>
          <div className="orb-glow" />
          <div className="orb-sphere">
            <div className="orb-gradient" />
          </div>
          {phase === 'recording' && (
            <div className="orb-waves">
              <span /><span /><span /><span />
            </div>
          )}
          {speaking && phase !== 'recording' && (
            <div className="orb-speak-waves">
              <span /><span /><span />
            </div>
          )}
        </div>
      </div>

      <div className="agent-message">
        <p>{displayedText}<span className="cursor-blink">|</span></p>
      </div>

      <div className="agent-controls">
        {(phase === 'idle' || phase === 'greeting') && (
          <button
            className="mic-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (clickToHear) handleUnlockAndPlay();
              else startRecording();
            }}
            disabled={generating}
            title={clickToHear ? 'Click to hear greeting' : 'Start recording'}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        )}

        {phase === 'recording' && (
          <div className="recording-controls">
            <span className="rec-timer">{formatTime(duration)}</span>
            <button className="stop-mic-btn" onClick={stopRecording} title="Stop recording">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <rect x="3" y="3" width="14" height="14" rx="2" />
              </svg>
            </button>
          </div>
        )}

        {phase === 'recorded' && !generating && (
          <div className="recorded-controls">
            <audio controls src={audioUrl} className="agent-audio" />
            <div className="recorded-actions">
              <button className="agent-secondary-btn" onClick={handleRecordAgain}>
                Record Again
              </button>
              <button className="agent-primary-btn" onClick={handleGenerate}>
                Generate Post
              </button>
            </div>
          </div>
        )}

        {generating && (
          <div className="generating-state">
            <div className="spinner" />
            <span>Crafting your post...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default VoiceAgent;
