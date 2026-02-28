import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import VoiceAgent from '../components/VoiceAgent';
import PostOutput from '../components/PostOutput';
import DashboardSkeleton from '../components/DashboardSkeleton';
import api from '../services/api';
import '../styles/dashboard.css';

function Dashboard({ user, setUser, onLogout, sidebarOpen, setSidebarOpen }) {
  const [profile, setProfile] = useState(null);
  const [postsList, setPostsList] = useState([]);
  const [currentPostId, setCurrentPostId] = useState(null);
  const [generatedPost, setGeneratedPost] = useState(null);
  const [transcriptData, setTranscriptData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [error, setError] = useState('');

  const fetchPosts = useCallback(() => {
    api.get('/posts').then((res) => setPostsList(res.data.posts || [])).catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/profile').then((res) => setProfile(res.data.profile)).catch(() => {});
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const delay = 500 + Math.random() * 1000;
    const t = setTimeout(() => setShowSkeleton(false), delay);
    return () => clearTimeout(t);
  }, []);

  const handleAudioReady = async (audioBlob) => {
    setError('');
    setGenerating(true);
    setGeneratedPost(null);
    setTranscriptData(null);
    setCurrentPostId(null);

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

      if (res.data.postId) {
        setCurrentPostId(res.data.postId);
        fetchPosts();
      }
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
        postId: currentPostId,
      });

      setGeneratedPost({
        hookOptions: res.data.hookOptions,
        finalPost: res.data.finalPost,
        alternativeVersion: res.data.alternativeVersion,
        suggestedCTA: res.data.suggestedCTA,
      });
      fetchPosts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to regenerate. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleNewPost = () => {
    setGeneratedPost(null);
    setTranscriptData(null);
    setCurrentPostId(null);
    setError('');
  };

  const handleSelectPost = (id) => {
    if (id === currentPostId) return;
    setGenerating(true);
    setError('');
    api
      .get(`/posts/${id}`)
      .then((res) => {
        const p = res.data.post;
        setCurrentPostId(p.id);
        setGeneratedPost({
          hookOptions: p.hookOptions,
          finalPost: p.finalPost,
          alternativeVersion: p.alternativeVersion,
          suggestedCTA: p.suggestedCTA,
        });
        setTranscriptData({
          cleanedTranscript: p.cleanedTranscript,
          keyIdeas: p.keyIdeas || [],
        });
      })
      .catch(() => setError('Failed to load post.'))
      .finally(() => setGenerating(false));
  };

  return (
    <div className="dashboard">
      <div className="dashboard-layout">
        <Sidebar
          user={user}
          onLogout={onLogout}
          posts={postsList}
          currentPostId={currentPostId}
          onNewPost={handleNewPost}
          onSelectPost={handleSelectPost}
          loading={generating}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          mobileOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />
        <div className="dashboard-main">
          <div className="dashboard-container">
            {!generatedPost && (
              <section className="agent-section">
                {showSkeleton ? (
                  <DashboardSkeleton />
                ) : (
                  <VoiceAgent
                    onAudioReady={handleAudioReady}
                    generating={generating}
                    userName={user.name}
                  />
                )}
              </section>
            )}

            {error && (
              <div className="dashboard-error">
                <p>{error}</p>
              </div>
            )}

            {generatedPost && (
              <section className="dashboard-section fade-in">
                <PostOutput
                  data={generatedPost}
                  onRegenerate={handleRegenerate}
                  generating={generating}
                />
                <div className="new-post-cta">
                  <button type="button" className="new-post-btn" onClick={handleNewPost}>
                    Create Another Post
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
