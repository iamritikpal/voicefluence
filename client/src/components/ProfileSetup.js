import React, { useState } from 'react';
import api from '../services/api';

function ProfileSetup({ profile, onUpdate }) {
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedinUrl || '');
  const [pastPosts, setPastPosts] = useState(profile?.pastPosts?.join('\n---\n') || '');
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState('');
  const [expanded, setExpanded] = useState(!profile?.writingStyleProfile?.tone);

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage('');
    try {
      const posts = pastPosts
        .split('---')
        .map((p) => p.trim())
        .filter(Boolean);

      const res = await api.put('/profile', { linkedinUrl, pastPosts: posts });
      onUpdate(res.data.profile);
      setMessage('Profile saved.');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyzeStyle = async () => {
    setAnalyzing(true);
    setMessage('');
    try {
      const posts = pastPosts
        .split('---')
        .map((p) => p.trim())
        .filter(Boolean);

      if (posts.length < 2) {
        setMessage('Please paste at least 2-3 past LinkedIn posts separated by ---');
        setAnalyzing(false);
        return;
      }

      const res = await api.post('/profile/analyze-style', { pastPosts: posts });
      onUpdate({ ...profile, writingStyleProfile: res.data.writingStyleProfile });
      setMessage('Writing style analyzed successfully!');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to analyze writing style.');
    } finally {
      setAnalyzing(false);
    }
  };

  const styleProfile = profile?.writingStyleProfile;
  const hasStyle = styleProfile && styleProfile.tone;

  return (
    <div className="profile-setup">
      <div className="section-header" onClick={() => setExpanded(!expanded)}>
        <h2 className="section-title">
          Your LinkedIn Profile
          {hasStyle && <span className="badge-success">Style Configured</span>}
        </h2>
        <button className="toggle-btn">{expanded ? 'Collapse' : 'Expand'}</button>
      </div>

      {expanded && (
        <div className="profile-content">
          <div className="form-group">
            <label htmlFor="linkedin-url">LinkedIn Profile URL (optional)</label>
            <input
              id="linkedin-url"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          <div className="form-group">
            <label htmlFor="past-posts">
              Paste 3-5 Past LinkedIn Posts (separate each post with ---)
            </label>
            <textarea
              id="past-posts"
              value={pastPosts}
              onChange={(e) => setPastPosts(e.target.value)}
              placeholder={`Paste your first LinkedIn post here...\n---\nPaste your second post here...\n---\nPaste your third post here...`}
              rows={8}
            />
          </div>

          <div className="profile-actions">
            <button className="save-btn" onClick={handleSaveProfile} disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            <button
              className="analyze-btn"
              onClick={handleAnalyzeStyle}
              disabled={analyzing}
            >
              {analyzing ? 'Analyzing Style...' : 'Analyze My Writing Style'}
            </button>
          </div>

          {message && <p className="profile-message">{message}</p>}

          {hasStyle && (
            <div className="style-summary">
              <h3>Your Writing Style Profile</h3>
              <div className="style-grid">
                <div className="style-item">
                  <span className="style-label">Tone</span>
                  <span className="style-value">{styleProfile.tone}</span>
                </div>
                <div className="style-item">
                  <span className="style-label">Hook Style</span>
                  <span className="style-value">{styleProfile.hookStyle}</span>
                </div>
                <div className="style-item">
                  <span className="style-label">Formatting</span>
                  <span className="style-value">{styleProfile.formattingStyle}</span>
                </div>
                <div className="style-item">
                  <span className="style-label">CTA Style</span>
                  <span className="style-value">{styleProfile.ctaStyle}</span>
                </div>
                <div className="style-item">
                  <span className="style-label">Niche</span>
                  <span className="style-value">{styleProfile.niche}</span>
                </div>
                <div className="style-item">
                  <span className="style-label">Vocabulary</span>
                  <span className="style-value">{styleProfile.vocabularyLevel}</span>
                </div>
              </div>
              {styleProfile.authorityMarkers && styleProfile.authorityMarkers.length > 0 && (
                <div className="authority-markers">
                  <span className="style-label">Authority Markers</span>
                  <div className="markers-list">
                    {styleProfile.authorityMarkers.map((marker, i) => (
                      <span key={i} className="marker-tag">{marker}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProfileSetup;
