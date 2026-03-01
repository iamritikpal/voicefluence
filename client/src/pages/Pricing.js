import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/pricing.css';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '₹499',
    period: '/month',
    credits: 100,
    support: 'Basic support',
    features: ['100 credits/month', '20 LinkedIn posts', 'Voice-to-post engine', 'Basic support'],
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹999',
    period: '/month',
    credits: 300,
    support: 'Priority support',
    features: ['300 credits/month', '60 LinkedIn posts', 'Voice-to-post engine', 'Style analysis', 'Priority support'],
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    id: 'ultra',
    name: 'Ultra',
    price: '₹1,999',
    period: '/month',
    credits: 1000,
    support: 'Premium support',
    features: ['1000 credits/month', '200 LinkedIn posts', 'Voice-to-post engine', 'Advanced style analysis', 'Premium 24/7 support'],
    highlighted: false,
  },
];

const TOPUPS = [
  { id: 'small', label: '50 Credits', price: '₹199', credits: 50 },
  { id: 'medium', label: '150 Credits', price: '₹499', credits: 150 },
];

function Pricing({ user, setUser }) {
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [loadingTopup, setLoadingTopup] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isLoggedIn = !!localStorage.getItem('token');

  const handleUpgrade = async (planId) => {
    if (!isLoggedIn) {
      navigate('/signup');
      return;
    }
    setLoadingPlan(planId);
    setMessage('');
    setError('');
    try {
      const res = await api.post('/subscription/upgrade', { plan: planId });
      if (setUser) {
        setUser((prev) => ({
          ...prev,
          credits: res.data.credits,
          subscriptionPlan: res.data.subscriptionPlan,
        }));
      }
      setMessage(`Successfully upgraded to ${planId.charAt(0).toUpperCase() + planId.slice(1)}! ${res.data.credits} credits available.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Upgrade failed. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleTopup = async (pkg) => {
    if (!isLoggedIn) {
      navigate('/signup');
      return;
    }
    setLoadingTopup(pkg);
    setMessage('');
    setError('');
    try {
      const res = await api.post('/subscription/topup', { package: pkg });
      if (setUser) {
        setUser((prev) => ({ ...prev, credits: res.data.credits }));
      }
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Top-up failed. Please try again.');
    } finally {
      setLoadingTopup(null);
    }
  };

  return (
    <div className="pricing-page">
      <div className="pricing-hero">
        <h1 className="pricing-title">Simple, Transparent Pricing</h1>
        <p className="pricing-subtitle">
          Turn your voice into authority LinkedIn content. Pay only for what you use.
        </p>
        {user && (
          <div className="pricing-current-plan">
            <span className="credit-badge">
              {user.credits ?? 0} credits remaining
            </span>
            <span className="plan-badge plan-badge--{user.subscriptionPlan || 'free'}">
              {(user.subscriptionPlan || 'free').toUpperCase()} plan
            </span>
          </div>
        )}
      </div>

      {message && <div className="pricing-alert pricing-alert--success">{message}</div>}
      {error && <div className="pricing-alert pricing-alert--error">{error}</div>}

      <div className="pricing-grid">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`pricing-card${plan.highlighted ? ' pricing-card--highlighted' : ''}`}
          >
            {plan.badge && <div className="pricing-badge">{plan.badge}</div>}
            <div className="pricing-card-header">
              <h2 className="pricing-plan-name">{plan.name}</h2>
              <div className="pricing-price">
                <span className="pricing-amount">{plan.price}</span>
                <span className="pricing-period">{plan.period}</span>
              </div>
              <p className="pricing-credits-label">{plan.credits} credits / month</p>
            </div>
            <ul className="pricing-features">
              {plan.features.map((f) => (
                <li key={f} className="pricing-feature-item">
                  <span className="pricing-check">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              className={`pricing-btn${plan.highlighted ? ' pricing-btn--primary' : ' pricing-btn--outline'}`}
              onClick={() => handleUpgrade(plan.id)}
              disabled={loadingPlan === plan.id}
            >
              {loadingPlan === plan.id
                ? 'Processing...'
                : user?.subscriptionPlan === plan.id
                ? 'Current Plan'
                : 'Get Started'}
            </button>
          </div>
        ))}
      </div>

      <div className="topup-section">
        <h2 className="topup-title">Need more credits? Top-Up anytime.</h2>
        <p className="topup-subtitle">No subscription required. Credits never expire.</p>
        <div className="topup-grid">
          {TOPUPS.map((t) => (
            <div key={t.id} className="topup-card">
              <div className="topup-credits">{t.credits} Credits</div>
              <div className="topup-price">{t.price}</div>
              <button
                className="pricing-btn pricing-btn--outline topup-btn"
                onClick={() => handleTopup(t.id)}
                disabled={loadingTopup === t.id}
              >
                {loadingTopup === t.id ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="pricing-faq">
        <h2 className="faq-title">How credits work</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>Free tier</h3>
            <p>Every new account starts with 20 free credits — enough for 4 LinkedIn posts.</p>
          </div>
          <div className="faq-item">
            <h3>1 post = 5 credits</h3>
            <p>Each voice recording you convert into a LinkedIn post costs 5 credits.</p>
          </div>
          <div className="faq-item">
            <h3>Regeneration</h3>
            <p>Regenerating the same post does not cost extra credits.</p>
          </div>
          <div className="faq-item">
            <h3>No expiry on top-ups</h3>
            <p>Top-up credits stay in your account indefinitely until used.</p>
          </div>
        </div>
      </div>

      {isLoggedIn && (
        <div className="pricing-back">
          <button className="pricing-btn pricing-btn--ghost" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}

export default Pricing;
