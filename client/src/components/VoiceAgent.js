import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const [successPulse, setSuccessPulse] = useState(false);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const typewriterRef = useRef(null);
  const ttsAudioRef = useRef(null);
  const ttsResolveRef = useRef(null);
  const sessionRef = useRef(0);
  const abortRef = useRef(null);
  const audioUnlockedRef = useRef(false);
  const orbRef = useRef(null);
  const blinkTimerRef = useRef(null);
  const [blinking, setBlinking] = useState(false);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const animFrameRef = useRef(null);
  const [waveformBars, setWaveformBars] = useState(new Array(24).fill(4));

  const firstName = userName ? userName.split(' ')[0] : 'there';

  const startBlinkLoop = useCallback(() => {
    const doBlink = () => {
      if (recording) return;
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
      blinkTimerRef.current = setTimeout(doBlink, 2000 + Math.random() * 3000);
    };
    blinkTimerRef.current = setTimeout(doBlink, 2000 + Math.random() * 3000);
  }, [recording]);

  useEffect(() => {
    if (!recording) {
      startBlinkLoop();
    } else {
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
      setBlinking(false);
    }
    return () => { if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current); };
  }, [recording, startBlinkLoop]);

  useEffect(() => {
    const handleMouse = (e) => {
      if (!orbRef.current) return;
      const rect = orbRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxOffset = 10;
      const factor = Math.min(dist / 300, 1);
      setEyeOffset({
        x: (dx / (dist || 1)) * maxOffset * factor,
        y: (dy / (dist || 1)) * maxOffset * factor,
      });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  function stopCurrentTts() {
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current.currentTime = 0; ttsAudioRef.current = null; }
    if (ttsResolveRef.current) { ttsResolveRef.current(); ttsResolveRef.current = null; }
    setSpeaking(false);
  }

  function stopTypewriter() {
    if (typewriterRef.current) { clearTimeout(typewriterRef.current); typewriterRef.current = null; }
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    mutedRef.current = next;
    if (next) {
      stopCurrentTts();
    } else {
      const greeting = `Hi ${firstName}!`;
      speakLine(greeting);
    }
  }

  async function speakText(text, session) {
    stopCurrentTts();
    if (sessionRef.current !== session) return;
    if (mutedRef.current) return;
    setSpeaking(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await api.post('/tts/speak', { text }, { responseType: 'blob', signal: controller.signal });
      if (sessionRef.current !== session) { setSpeaking(false); return; }
      if (mutedRef.current) { setSpeaking(false); return; }
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
        audio.onended = () => { audioUnlockedRef.current = true; setClickToHear(false); done(); };
        audio.onerror = done;
        audio.play().then(() => {}).catch(() => { if (!audioUnlockedRef.current) setClickToHear(true); done(); });
      });
    } catch (err) {
      if (err && err.name !== 'CanceledError') {}
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
    if (sessionRef.current === session) { stopTypewriter(); setDisplayedText(text); }
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
      if (i < lines.length - 1) await new Promise((r) => setTimeout(r, 500));
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
    runGreeting(session);
    return () => { sessionRef.current = -1; stopTypewriter(); stopCurrentTts(); };
  }, []);

  const startWaveformAnalysis = useCallback((stream) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const update = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const bars = [];
        const barCount = 24;
        const step = Math.floor(data.length / barCount);
        for (let i = 0; i < barCount; i++) {
          const val = data[i * step] || 0;
          bars.push(Math.max(4, (val / 255) * 48));
        }
        setWaveformBars(bars);
        animFrameRef.current = requestAnimationFrame(update);
      };
      update();
    } catch (e) {}
  }, []);

  const stopWaveformAnalysis = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    analyserRef.current = null;
    if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null; }
    setWaveformBars(new Array(24).fill(4));
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
      if (sessionRef.current !== session) { stream.getTracks().forEach((t) => t.stop()); return; }
      startWaveformAnalysis(stream);
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setDuration(0);
      setAudioUrl(null);
      setAudioBlob(null);
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
        clearInterval(timerRef.current);
        stopWaveformAnalysis();
        setSuccessPulse(true);
        setTimeout(() => setSuccessPulse(false), 600);
        setPhase('recorded');
        speakLine("Great! I've got your recording. Hit Generate when you're ready.");
      };
      mediaRecorder.start(1000);
      setRecording(true);
      setDisplayedText("I'm listening... take your time.");
      timerRef.current = setInterval(() => setDuration((prev) => prev + 1), 1000);
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
    'orb-wrap',
    recording && 'orb-wrap--listening',
    generating && 'orb-wrap--processing',
    speaking && !recording && 'orb-wrap--speaking',
    successPulse && 'orb-wrap--success',
  ].filter(Boolean).join(' ');

  const thinkingOffset = generating ? { x: 8, y: 0 } : null;
  const eyeTransform = thinkingOffset
    ? `translate(${thinkingOffset.x}px, ${thinkingOffset.y}px)`
    : `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`;

  return (
    <div
      className="voice-agent"
      onClick={clickToHear ? handleUnlockAndPlay : undefined}
      role={clickToHear ? 'button' : undefined}
      tabIndex={clickToHear ? 0 : undefined}
      onKeyDown={clickToHear ? (e) => e.key === 'Enter' && handleUnlockAndPlay() : undefined}
    >
      <button
        className={`mute-toggle ${muted ? 'mute-toggle--active' : ''}`}
        onClick={(e) => { e.stopPropagation(); toggleMute(); }}
        title={muted ? 'Unmute agent' : 'Mute agent'}
      >
        {muted ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>

      {clickToHear && (
        <div className="click-to-hear-banner" onClick={(e) => { e.stopPropagation(); handleUnlockAndPlay(); }}>
          Click here to hear greeting
        </div>
      )}

      <div className="agent-visual">
        <div
          className={orbClass}
          ref={orbRef}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          <div className="orb-halo" />
          <div className="orb-body">
            <div className="orb-gradient-layer" />
            <div className="orb-noise" />
            <div className="orb-specular" />
            <div className="orb-glass" />

            {recording && <div className="orb-ring-spinner" />}

            <div
              className={`orb-eyes ${blinking ? 'orb-eyes--blink' : ''} ${hovering ? 'orb-eyes--hover' : ''} ${recording ? 'orb-eyes--wide' : ''}`}
              style={{ transform: eyeTransform }}
            >
              <div className="orb-eye orb-eye--left" />
              <div className="orb-eye orb-eye--right" />
            </div>
          </div>
        </div>

        {recording && (
          <div className="waveform-bars">
            {waveformBars.map((h, i) => (
              <div key={i} className="waveform-bar" style={{ height: `${h}px` }} />
            ))}
          </div>
        )}
      </div>

      <div className="agent-message">
        <p>{displayedText}<span className="cursor-blink">|</span></p>
      </div>

      <div className="agent-controls">
        {(phase === 'idle' || phase === 'greeting') && (
          <button
            className="mic-btn"
            onClick={(e) => { e.stopPropagation(); if (clickToHear) handleUnlockAndPlay(); else startRecording(); }}
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
              <button className="agent-secondary-btn" onClick={handleRecordAgain}>Record Again</button>
              <button className="agent-primary-btn" onClick={handleGenerate}>Generate Post</button>
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
