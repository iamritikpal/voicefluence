import React, { useState } from 'react';
import api from '../services/api';
import '../styles/onboarding.css';

function Onboarding({ user, onComplete }) {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [phase, setPhase] = useState('input'); // input | loading | success
  const [error, setError] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');

  const loadingSteps = [
    'Connecting to your LinkedIn profile...',
    'Reading your professional background...',
    'Analyzing your writing patterns...',
    'Building your style profile...',
    'Almost there...',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!linkedinUrl.includes('linkedin.com/in/')) {
      setError('Please enter a valid LinkedIn profile URL (e.g. https://linkedin.com/in/yourname)');
      return;
    }

    setPhase('loading');
    setLoadingMessage(loadingSteps[0]);

    let stepIndex = 0;
    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex < loadingSteps.length) {
        setLoadingMessage(loadingSteps[stepIndex]);
      }
    }, 3000);

    try {
      const res = await api.post('/profile/onboard', { linkedinUrl });
      clearInterval(interval);
      setPhase('success');

      setTimeout(() => {
        onComplete(res.data.profile);
      }, 2200);
    } catch (err) {
      clearInterval(interval);
      setPhase('input');
      setError(err.response?.data?.error || 'Failed to analyze your profile. Please try again.');
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        {phase === 'input' && (
          <>
            <div className="onboarding-header">
              <div className="onboarding-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect width="48" height="48" rx="12" fill="#EEF2FF" />
                  <path d="M16 20h-2a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2zm0 16h-2a2 2 0 0 1-2-2V24a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2zm20 0h-2a2 2 0 0 1-2-2v-6a4 4 0 0 0-4-4 4 4 0 0 0-4 4v6a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2h2a2 2 0 0 1 2 1.5A8 8 0 0 1 36 28v6a2 2 0 0 1-2 2z" fill="#4F46E5"/>
                </svg>
              </div>
              <h1>Let's set up your profile</h1>
              <p>
                Hi {user.name.split(' ')[0]}! Paste your LinkedIn URL below and we'll
                automatically analyze your writing style to personalize your posts.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="onboarding-form">
              {error && <div className="onboarding-error">{error}</div>}

              <div className="form-group">
                <label htmlFor="linkedin">Your LinkedIn Profile URL</label>
                <input
                  id="linkedin"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  required
                  autoFocus
                />
              </div>

              <button type="submit" className="onboarding-btn">
                Analyze My Profile
              </button>
            </form>
          </>
        )}

        {phase === 'loading' && (
          <div className="onboarding-loading">
            <div className="loading-orb">
              <div className="orb-ring orb-ring-1" />
              <div className="orb-ring orb-ring-2" />
              <div className="orb-ring orb-ring-3" />
              <div className="orb-core" />
            </div>
            <p className="loading-text">{loadingMessage}</p>
          </div>
        )}

        {phase === 'success' && (
          <div className="onboarding-success">
            <div className="success-check">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="32" fill="#D1FAE5" />
                <path
                  d="M20 32l8 8 16-16"
                  stroke="#059669"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2>Profile saved!</h2>
            <p>Your writing style has been analyzed. Taking you to your studio...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Onboarding;
