import React, { useState } from 'react';
import api from '../services/api';
import '../styles/onboarding.css';

const STEPS = [
  {
    key: 'gender',
    number: 1,
    title: "What's your gender?",
    subtitle: 'This helps us tailor the tone and voice of your posts.',
    type: 'select',
    options: [
      { value: 'man', label: 'Man', icon: '\u2642' },
      { value: 'woman', label: 'Woman', icon: '\u2640' },
      { value: 'non-binary', label: 'Non Binary', icon: '\u26A7' },
    ],
  },
  {
    key: 'ageRange',
    number: 2,
    title: 'How old are you?',
    subtitle: 'Helps us match language style to your audience.',
    type: 'grid',
    options: [
      { value: '18-20' }, { value: '21-24' }, { value: '25-29' },
      { value: '30-40' }, { value: '41-50' }, { value: '51-65' },
      { value: '65+' },
    ],
  },
  {
    key: 'industry',
    number: 3,
    title: "What's your industry?",
    subtitle: 'So we can use the right context and terminology.',
    type: 'grid',
    options: [
      { value: 'Tech / SaaS' }, { value: 'Marketing' }, { value: 'Finance' },
      { value: 'Healthcare' }, { value: 'Education' }, { value: 'E-commerce' },
      { value: 'Real Estate' }, { value: 'Consulting' }, { value: 'Other' },
    ],
  },
  {
    key: 'contentGoal',
    number: 4,
    title: "What's your content goal?",
    subtitle: 'We\'ll shape your posts to match your objective.',
    type: 'grid',
    options: [
      { value: 'Build personal brand' }, { value: 'Generate leads' },
      { value: 'Share knowledge' }, { value: 'Grow network' },
      { value: 'Recruit talent' }, { value: 'Thought leadership' },
    ],
  },
];

const TOTAL_STEPS = STEPS.length + 1;

function Onboarding({ user, onComplete, onLogout }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ gender: '', ageRange: '', industry: '', contentGoal: '' });
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [phase, setPhase] = useState('questions');
  const [error, setError] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');

  const loadingSteps = [
    'Connecting to your LinkedIn profile...',
    'Reading your professional background...',
    'Analyzing your writing patterns...',
    'Building your style profile...',
    'Almost there...',
  ];

  const currentStep = STEPS[step];
  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  const handleSelect = (value) => {
    setAnswers((prev) => ({ ...prev, [currentStep.key]: value }));
  };

  const handleContinue = () => {
    if (!answers[currentStep.key]) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setPhase('linkedin');
    }
  };

  const handleBack = () => {
    if (phase === 'linkedin') {
      setPhase('questions');
    } else if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    setPhase('linkedin');
  };

  const handleSubmitLinkedin = async (e) => {
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
      const res = await api.post('/profile/onboard', {
        linkedinUrl,
        gender: answers.gender,
        ageRange: answers.ageRange,
        industry: answers.industry,
        contentGoal: answers.contentGoal,
      });
      clearInterval(interval);
      setPhase('success');

      setTimeout(() => {
        onComplete(res.data.profile);
      }, 2200);
    } catch (err) {
      clearInterval(interval);
      setPhase('linkedin');
      setError(err.response?.data?.error || 'Failed to analyze your profile. Please try again.');
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card onboarding-card--wide">
        {(phase === 'questions' || phase === 'linkedin') && (
          <div className="onboarding-topbar">
            {(step > 0 || phase === 'linkedin') && (
              <button type="button" className="onboarding-back-btn" onClick={handleBack}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
              </button>
            )}
            <div className="onboarding-progress-bar">
              <div className="onboarding-progress-fill" style={{ width: phase === 'linkedin' ? '100%' : `${progress}%` }} />
            </div>
            <button type="button" className="onboarding-logout-btn" onClick={onLogout} title="Log out">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}

        {phase === 'questions' && currentStep && (
          <div className="onboarding-step" key={currentStep.key}>
            <div className="step-badge">{currentStep.number}</div>
            <h1 className="step-title">{currentStep.title}</h1>
            <p className="step-subtitle">{currentStep.subtitle}</p>

            <div className={`step-options ${currentStep.type === 'select' ? 'step-options--row' : 'step-options--grid'}`}>
              {currentStep.options.map((opt) => {
                const val = opt.value;
                const selected = answers[currentStep.key] === val;
                return (
                  <button
                    key={val}
                    type="button"
                    className={`step-option ${selected ? 'step-option--selected' : ''}`}
                    onClick={() => handleSelect(val)}
                  >
                    {opt.icon && <span className="option-icon">{opt.icon}</span>}
                    <span className="option-label">{opt.label || val}</span>
                    <span className={`option-radio ${selected ? 'option-radio--checked' : ''}`} />
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="onboarding-btn"
              disabled={!answers[currentStep.key]}
              onClick={handleContinue}
            >
              Continue
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            <button type="button" className="onboarding-skip-link" onClick={handleSkip}>
              Skip, I'll set this up later
            </button>
          </div>
        )}

        {phase === 'linkedin' && (
          <div className="onboarding-step">
            <div className="onboarding-icon">
              <img src="/logo.png" alt="PostFlux" width="48" height="48" style={{ borderRadius: '12px' }} />
            </div>
            <h1 className="step-title">Let's set up your profile</h1>
            <p className="step-subtitle">
              Hi {user.name.split(' ')[0]}! Paste your LinkedIn URL below and we'll
              automatically analyze your writing style to personalize your posts.
            </p>

            <form onSubmit={handleSubmitLinkedin} className="onboarding-form">
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
          </div>
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
                <path d="M20 32l8 8 16-16" stroke="#059669" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
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
