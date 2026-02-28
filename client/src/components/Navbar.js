import React from 'react';
import { Link } from 'react-router-dom';

function Navbar({ user, onLogout, onMenuClick, showMenuButton }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {showMenuButton && (
          <button type="button" className="navbar-menu-btn" onClick={onMenuClick} aria-label="Open menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        <Link to="/dashboard" className="navbar-brand">Voicefluence</Link>
      </div>
    </nav>
  );
}

export default Navbar;
