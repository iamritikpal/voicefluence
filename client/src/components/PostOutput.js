import React, { useState } from 'react';

function PostOutput({ data, onRegenerate, generating }) {
  const [copiedField, setCopiedField] = useState('');
  const [activeTab, setActiveTab] = useState('final');

  const handleCopy = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
    }
  };

  return (
    <div className="post-output">
      <h2 className="section-title">Your Generated LinkedIn Post</h2>

      <div className="hooks-section">
        <h3>Hook Options</h3>
        <p className="hooks-desc">Click a hook to regenerate the post using it as the opener.</p>
        <div className="hooks-grid">
          {data.hookOptions.map((hook, i) => (
            <button
              key={i}
              className="hook-card"
              onClick={() => onRegenerate(hook)}
              disabled={generating}
            >
              <span className="hook-number">Hook {i + 1}</span>
              <p className="hook-text">{hook}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="post-tabs">
        <button
          className={`tab-btn ${activeTab === 'final' ? 'active' : ''}`}
          onClick={() => setActiveTab('final')}
        >
          Final Post
        </button>
        <button
          className={`tab-btn ${activeTab === 'alternative' ? 'active' : ''}`}
          onClick={() => setActiveTab('alternative')}
        >
          Alternative Version
        </button>
      </div>

      <div className="post-card">
        <div className="post-content">
          {activeTab === 'final'
            ? data.finalPost.split('\n').map((line, i) => (
                <p key={i} className={line.trim() === '' ? 'post-spacer' : ''}>
                  {line}
                </p>
              ))
            : data.alternativeVersion.split('\n').map((line, i) => (
                <p key={i} className={line.trim() === '' ? 'post-spacer' : ''}>
                  {line}
                </p>
              ))}
        </div>
        <div className="post-actions">
          <button
            className="copy-btn"
            onClick={() =>
              handleCopy(
                activeTab === 'final' ? data.finalPost : data.alternativeVersion,
                activeTab
              )
            }
          >
            {copiedField === activeTab ? 'Copied!' : 'Copy Post'}
          </button>
          <button className="regenerate-btn" onClick={() => onRegenerate()} disabled={generating}>
            {generating ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>
      </div>

      {data.hashtags && data.hashtags.length > 0 && (
        <div className="hashtags-section">
          <h3>Suggested Hashtags</h3>
          <div className="hashtags-container">
            {data.hashtags.map((tag, i) => (
              <span
                key={i}
                className="hashtag-chip"
                onClick={() => handleCopy(`#${tag}`, `tag-${i}`)}
                title="Click to copy"
              >
                #{tag}
                {copiedField === `tag-${i}` && <span className="chip-copied">Copied!</span>}
              </span>
            ))}
          </div>
          <button
            className="copy-btn small"
            onClick={() =>
              handleCopy(data.hashtags.map((t) => `#${t}`).join(' '), 'all-tags')
            }
          >
            {copiedField === 'all-tags' ? 'Copied!' : 'Copy All Hashtags'}
          </button>
        </div>
      )}

      <div className="cta-section">
        <h3>Suggested CTA</h3>
        <div className="cta-card">
          <p>{data.suggestedCTA}</p>
          <button
            className="copy-btn small"
            onClick={() => handleCopy(data.suggestedCTA, 'cta')}
          >
            {copiedField === 'cta' ? 'Copied!' : 'Copy CTA'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PostOutput;
