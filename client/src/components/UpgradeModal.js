import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/upgrademodal.css';

function UpgradeModal({ credits, onClose }) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="modal-icon">⚡</div>
        <h2 className="modal-title">You're out of credits</h2>
        <p className="modal-body">
          {credits === 0
            ? "You've used all your credits. Upgrade to keep generating authority LinkedIn content."
            : `You need at least 5 credits to generate a post. You have ${credits} credit${credits !== 1 ? 's' : ''} remaining.`}
        </p>

        <div className="modal-actions">
          <button
            className="modal-btn modal-btn--primary"
            onClick={() => { onClose(); navigate('/pricing'); }}
          >
            View Plans
          </button>
          <button
            className="modal-btn modal-btn--secondary"
            onClick={() => { onClose(); navigate('/pricing#topup'); }}
          >
            Top-Up Credits
          </button>
        </div>

        <p className="modal-note">Free tier: 20 credits (4 posts). Each generation = 5 credits.</p>
      </div>
    </div>
  );
}

export default UpgradeModal;
