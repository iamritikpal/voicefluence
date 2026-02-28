import React, { useState, useEffect } from 'react';
import ProfileSetup from '../components/ProfileSetup';
import VoiceRecorder from '../components/VoiceRecorder';
import PostOutput from '../components/PostOutput';
import api from '../services/api';
import '../styles/dashboard.css';

function Dashboard({ user, setUser }) {
  const [profile, setProfile] = useState(null);
  const [generatedPost, setGeneratedPost] = useState(null);
  const [transcriptData, setTranscriptData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/profile')
      .then((res) => setProfile(res.data.profile))
      .catch(() => {});
  }, []);

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile);
  };

  const handleAudioReady = async (audioBlob) => {
    setError('');
    setGenerating(true);
    setGeneratedPost(null);
    setTranscriptData(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const res = await api.post('/posts/generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setTranscriptData({
        rawTranscript: res.data.rawTranscript,
        cleanedTranscript: res.data.cleanedTranscript,
        keyIdeas: res.data.keyIdeas,
      });

      setGeneratedPost({
        hookOptions: res.data.hookOptions,
        finalPost: res.data.finalPost,
        alternativeVersion: res.data.alternativeVersion,
        suggestedCTA: res.data.suggestedCTA,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate post. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async (selectedHook) => {
    if (!transcriptData) return;

    setError('');
    setGenerating(true);

    try {
      const res = await api.post('/posts/regenerate', {
        cleanedTranscript: transcriptData.cleanedTranscript,
        keyIdeas: transcriptData.keyIdeas,
        selectedHook,
      });

      setGeneratedPost({
        hookOptions: res.data.hookOptions,
        finalPost: res.data.finalPost,
        alternativeVersion: res.data.alternativeVersion,
        suggestedCTA: res.data.suggestedCTA,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to regenerate. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>Your LinkedIn Post Studio</h1>
          <p>Record a voice note. Get an authority-driven LinkedIn post.</p>
        </header>

        <section className="dashboard-section">
          <ProfileSetup profile={profile} onUpdate={handleProfileUpdate} />
        </section>

        <section className="dashboard-section">
          <VoiceRecorder onAudioReady={handleAudioReady} generating={generating} />
        </section>

        {error && (
          <div className="dashboard-error">
            <p>{error}</p>
          </div>
        )}

        {generating && (
          <div className="generating-indicator">
            <div className="spinner" />
            <p>Transcribing your voice and crafting your LinkedIn post...</p>
          </div>
        )}

        {generatedPost && (
          <section className="dashboard-section">
            <PostOutput
              data={generatedPost}
              onRegenerate={handleRegenerate}
              generating={generating}
            />
          </section>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
