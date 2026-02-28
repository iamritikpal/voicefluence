import React from 'react';
import { Link } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-brand">Voicefluence</Link>
        <div className="navbar-right">
          <Link to="/profile" className="navbar-link">Profile</Link>
          <span className="navbar-user">Hi, {user.name ? user.name.split(' ')[0] : 'User'}</span>
          <button className="navbar-logout" onClick={onLogout}>
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
