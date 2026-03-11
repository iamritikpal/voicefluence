import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import '../styles/auth.css';

function OtpVerify({ email, onVerified }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const inputsRef = useRef([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  useEffect(() => {
    if (inputsRef.current[0]) inputsRef.current[0].focus();
  }, []);

  const handleChange = (idx, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[idx] = value.slice(-1);
    setDigits(next);

    if (value && idx < 5 && inputsRef.current[idx + 1]) {
      inputsRef.current[idx + 1].focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputsRef.current[idx - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || '';
    setDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    if (inputsRef.current[focusIdx]) inputsRef.current[focusIdx].focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-email', { email, otp });
      onVerified(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMsg('');
    setError('');
    try {
      await api.post('/auth/resend-otp', { email });
      setResendMsg('New code sent!');
      setResendTimer(60);
      setDigits(['', '', '', '', '', '']);
      if (inputsRef.current[0]) inputsRef.current[0].focus();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend code.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-logo">PostFlux</h1>
          <p className="auth-subtitle">Turn your voice into authority</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Verify your email</h2>
          <p className="otp-desc">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>

          {error && <div className="auth-error">{error}</div>}
          {resendMsg && <div className="otp-success">{resendMsg}</div>}

          <div className="otp-inputs" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputsRef.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="otp-input"
                autoComplete="one-time-code"
              />
            ))}
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="otp-resend">
          {resendTimer > 0 ? (
            <p className="otp-timer">Resend code in {resendTimer}s</p>
          ) : (
            <button
              type="button"
              className="otp-resend-btn"
              onClick={handleResend}
              disabled={resendLoading}
            >
              {resendLoading ? 'Sending...' : 'Resend Code'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OtpVerify;
