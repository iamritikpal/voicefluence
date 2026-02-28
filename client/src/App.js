import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import api from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api
        .get('/auth/me')
        .then((res) => setUser(res.data.user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const handleOnboardingComplete = (profileData) => {
    setUser(profileData);
  };

  const needsOnboarding = user && !user.onboardingComplete;
  const defaultRoute = !user ? '/login' : needsOnboarding ? '/onboarding' : '/dashboard';
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading Voicefluence...</p>
      </div>
    );
  }

  return (
    <>
      {user && !needsOnboarding && (
        <Navbar
          showMenuButton={isDashboard}
          onMenuClick={() => setSidebarOpen(true)}
        />
      )}
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to={defaultRoute} /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to={defaultRoute} /> : <Signup onLogin={handleLogin} />}
        />
        <Route
          path="/onboarding"
          element={
            !user ? (
              <Navigate to="/login" />
            ) : needsOnboarding ? (
              <Onboarding user={user} onComplete={handleOnboardingComplete} />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            !user ? (
              <Navigate to="/login" />
            ) : needsOnboarding ? (
              <Navigate to="/onboarding" />
            ) : (
              <Dashboard user={user} setUser={setUser} onLogout={handleLogout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            )
          }
        />
        <Route
          path="/profile"
          element={
            !user ? (
              <Navigate to="/login" />
            ) : needsOnboarding ? (
              <Navigate to="/onboarding" />
            ) : (
              <Profile user={user} setUser={setUser} />
            )
          }
        />
        <Route path="*" element={<Navigate to={defaultRoute} />} />
      </Routes>
    </>
  );
}

export default App;
