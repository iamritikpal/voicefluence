import React, { useState, useRef } from 'react';

function VoiceRecorder({ onAudioReady, generating }) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      };

      mediaRecorder.start(1000);
      setRecording(true);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access is required. Please allow microphone permissions and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleSubmit = () => {
    if (audioBlob) {
      onAudioReady(audioBlob);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="voice-recorder">
      <h2 className="section-title">Record Your Voice Note</h2>
      <p className="section-desc">
        Share your thoughts for 1-3 minutes. Talk about an insight, a lesson learned, or an opinion.
      </p>

      <div className="recorder-controls">
        {!recording && !audioUrl && (
          <button className="record-btn" onClick={startRecording} disabled={generating}>
            <span className="record-icon" />
            Start Recording
          </button>
        )}

        {recording && (
          <div className="recording-active">
            <div className="recording-pulse" />
            <span className="recording-time">{formatTime(duration)}</span>
            <button className="stop-btn" onClick={stopRecording}>
              Stop Recording
            </button>
          </div>
        )}

        {audioUrl && !recording && (
          <div className="recording-preview">
            <audio controls src={audioUrl} className="audio-player" />
            <div className="preview-actions">
              <button className="record-again-btn" onClick={startRecording} disabled={generating}>
                Record Again
              </button>
              <button className="generate-btn" onClick={handleSubmit} disabled={generating}>
                {generating ? 'Generating...' : 'Generate LinkedIn Post'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VoiceRecorder;
