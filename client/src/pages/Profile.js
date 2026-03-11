import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/profile.css';

const GENDER_OPTIONS = ['man', 'woman', 'non-binary'];
const AGE_OPTIONS = ['18-20', '21-24', '25-29', '30-40', '41-50', '51-65', '65+'];
const INDUSTRY_OPTIONS = ['Tech / SaaS', 'Marketing', 'Finance', 'Healthcare', 'Education', 'E-commerce', 'Real Estate', 'Consulting', 'Other'];
const GOAL_OPTIONS = ['Build personal brand', 'Generate leads', 'Share knowledge', 'Grow network', 'Recruit talent', 'Thought leadership'];

function Profile({ user, setUser }) {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [gender, setGender] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [industry, setIndustry] = useState('');
  const [contentGoal, setContentGoal] = useState('');
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    api
      .get('/profile')
      .then((res) => {
        const p = res.data.profile;
        setProfile(p);
        setName(p.name || '');
        setLinkedinUrl(p.linkedinUrl || '');
        setGender(p.gender || '');
        setAgeRange(p.ageRange || '');
        setIndustry(p.industry || '');
        setContentGoal(p.contentGoal || '');
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load profile.' }));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setSaving(true);
    try {
      const res = await api.put('/profile', {
        name: name.trim(),
        linkedinUrl: linkedinUrl.trim(),
        gender,
        ageRange,
        industry,
        contentGoal,
      });
      setProfile(res.data.profile);
      setUser(res.data.profile);
      setMessage({ type: 'success', text: 'Profile saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save.' });
    } finally {
      setSaving(false);
    }
  };

  const handleFetchProfile = async () => {
    const urlToUse = linkedinUrl.trim();
    if (!urlToUse) {
      setMessage({ type: 'error', text: 'Enter and save a LinkedIn URL first.' });
      return;
    }
    setMessage({ type: '', text: '' });
    setFetching(true);
    try {
      const res = await api.post('/profile/fetch', { linkedinUrl: urlToUse });
      setProfile(res.data.profile);
      setLinkedinUrl(res.data.profile.linkedinUrl || urlToUse);
      setUser(res.data.profile);
      setMessage({ type: 'success', text: 'LinkedIn profile fetched and style updated.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to fetch profile.' });
    } finally {
      setFetching(false);
    }
  };

  const styleProfile = profile?.writingStyleProfile;
  const hasStyle = styleProfile && styleProfile.tone;

  return (
    <div className="profile-page">
      <div className="profile-page-container">
        <header className="profile-page-header">
          <h1>Profile</h1>
          <p>Manage your account and LinkedIn writing style.</p>
        </header>

        <section className="profile-card">
          <h2 className="profile-card-title">Your details</h2>

          {message.text && (
            <div className={`profile-message profile-message-${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave} className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="input-disabled"
                />
                <span className="field-hint">Email cannot be changed</span>
              </div>
            </div>

            

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">Select...</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="ageRange">Age range</label>
                <select id="ageRange" value={ageRange} onChange={(e) => setAgeRange(e.target.value)}>
                  <option value="">Select...</option>
                  {AGE_OPTIONS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="industry">Industry</label>
                <select id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                  <option value="">Select...</option>
                  {INDUSTRY_OPTIONS.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="contentGoal">Content goal</label>
                <select id="contentGoal" value={contentGoal} onChange={(e) => setContentGoal(e.target.value)}>
                  <option value="">Select...</option>
                  {GOAL_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="linkedin">LinkedIn profile URL</label>
              <input
                id="linkedin"
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <div className="profile-form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleFetchProfile}
                disabled={fetching || !linkedinUrl.trim()}
                title={!linkedinUrl.trim() ? 'Save a LinkedIn URL first' : 'Fetch and analyze your LinkedIn profile'}
              >
                {fetching ? (
                  <>
                    <span className="btn-spinner" />
                    Fetching profile...
                  </>
                ) : (
                  'Fetch profile'
                )}
              </button>
            </div>
          </form>
        </section>

        {(profile?.headline || profile?.about) && (
          <section className="profile-card">
            <h2 className="profile-card-title">From your LinkedIn</h2>
            {profile.headline && (
              <div className="profile-info-block">
                <span className="profile-info-label">Headline</span>
                <p className="profile-info-value">{profile.headline}</p>
              </div>
            )}
            {profile.about && (
              <div className="profile-info-block">
                <span className="profile-info-label">About</span>
                <p className="profile-info-value">{profile.about}</p>
              </div>
            )}
          </section>
        )}

        <section className="profile-card">
          <h2 className="profile-card-title">Writing style analysis</h2>
          {hasStyle ? (
            <div className="style-analysis">
              <div className="style-grid">
                <div className="style-item">
                  <span className="style-label">Tone</span>
                  <span className="style-value">{styleProfile.tone}</span>
                </div>
                <div className="style-item">
                  <span className="style-label">Hook style</span>
                  <span className="style-value">{styleProfile.hookStyle}</span>
                </div>
                <div className="style-item">
                  <span className="style-label">Formatting</span>
                  <span className="style-value">{styleProfile.formattingStyle}</span>
                </div>
                <div className="style-item">
                  <span className="style-label">CTA style</span>
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
                <div className="authority-block">
                  <span className="style-label">Authority markers</span>
                  <div className="authority-tags">
                    {styleProfile.authorityMarkers.map((marker, i) => (
                      <span key={i} className="authority-tag">{marker}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="style-empty">
              <p>No style analysis yet.</p>
              <p>Save your LinkedIn URL and click <strong>Fetch profile</strong> to analyze your writing style.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Profile;
