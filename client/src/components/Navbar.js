import React from 'react';

function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">Voicefluence</div>
        <div className="navbar-right">
          <span className="navbar-user">Hi, {user.name.split(' ')[0]}</span>
          <button className="navbar-logout" onClick={onLogout}>
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
