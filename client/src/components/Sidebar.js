import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/sidebar.css';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function Sidebar({
  user,
  onLogout,
  posts,
  currentPostId,
  onNewPost,
  onSelectPost,
  loading,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) {
  const firstName = user && user.name ? user.name.split(' ')[0] : 'User';

  return (
    <>
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={onCloseMobile} aria-hidden="true" />
      )}
      <aside
        className={
          'dashboard-sidebar' +
          (collapsed ? ' sidebar-collapsed' : '') +
          (mobileOpen ? ' sidebar-mobile-open' : '')
        }
      >
        <div className="sidebar-header">
          <button
            type="button"
            className="sidebar-close-mobile"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <button
            type="button"
            className="sidebar-toggle-desktop"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }}
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        <div className="sidebar-user-section">
          <span className="sidebar-greeting">Hi, {firstName}</span>
          <Link to="/profile" className="sidebar-profile-link" onClick={onCloseMobile}>
            Profile
          </Link>
          <button type="button" className="sidebar-logout" onClick={onLogout}>
            Log out
          </button>
        </div>

        <div className="sidebar-divider" />

        <button type="button" className="sidebar-new-btn" onClick={() => { onNewPost(); onCloseMobile(); }} disabled={loading}>
          <span className="sidebar-new-btn-icon">+</span>
          <span className="sidebar-new-btn-text">New post</span>
        </button>

        <div className="sidebar-list-label">Your posts</div>
        <ul className="sidebar-posts">
          {posts.length === 0 && (
            <li className="sidebar-empty">No posts yet. Create one with the voice agent.</li>
          )}
          {posts.map((post) => (
            <li key={post.id}>
              <button
                type="button"
                className={'sidebar-post-item' + (currentPostId === post.id ? ' active' : '')}
                onClick={() => { onSelectPost(post.id); onCloseMobile(); }}
              >
                <span className="sidebar-post-title">{post.title}</span>
                <span className="sidebar-post-date">{formatDate(post.createdAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}

export default Sidebar;
