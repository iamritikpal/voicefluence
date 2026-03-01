import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import VoiceAgent from '../components/VoiceAgent';
import PostOutput from '../components/PostOutput';
import DashboardSkeleton from '../components/DashboardSkeleton';
import UpgradeModal from '../components/UpgradeModal';
import ConfirmModal from '../components/ConfirmModal';
import api from '../services/api';
import '../styles/dashboard.css';

function Dashboard({ user, setUser, onLogout, sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [postsList, setPostsList] = useState([]);
  const [currentPostId, setCurrentPostId] = useState(null);
  const [generatedPost, setGeneratedPost] = useState(null);
  const [transcriptData, setTranscriptData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [error, setError] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [deleteConfirmPost, setDeleteConfirmPost] = useState(null);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const credits = user?.credits ?? 0;
  const plan = user?.subscriptionPlan || 'free';
  const creditPct = Math.min(100, Math.round((credits / 20) * 100));

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

      if (res.data.creditsRemaining !== undefined && setUser) {
        setUser((prev) => ({ ...prev, credits: res.data.creditsRemaining }));
      }

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
      if (err.response?.status === 403) {
        setShowUpgradeModal(true);
      } else {
        setError(err.response?.data?.error || 'Failed to generate post. Please try again.');
      }
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

  const handleRenamePost = async (postId, title) => {
    try {
      await api.patch(`/posts/${postId}`, { title });
      fetchPosts();
      if (currentPostId === postId) {
        setGeneratedPost((p) => (p ? { ...p } : null));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to rename.');
    }
  };

  const handlePinPost = async (postId, pinned) => {
    try {
      await api.patch(`/posts/${postId}`, { pinned });
      fetchPosts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to pin.');
    }
  };

  const handleDeletePostRequest = (post) => {
    setDeleteConfirmPost(post);
  };

  const handleDeletePostConfirm = async () => {
    if (!deleteConfirmPost) return;
    try {
      await api.delete(`/posts/${deleteConfirmPost.id}`);
      if (currentPostId === deleteConfirmPost.id) {
        handleNewPost();
      }
      fetchPosts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete.');
    } finally {
      setDeleteConfirmPost(null);
    }
  };

  const handleLogoutClick = () => setLogoutConfirm(true);

  const handleLogoutConfirm = () => {
    onLogout();
    setLogoutConfirm(false);
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
      {showUpgradeModal && (
        <UpgradeModal credits={credits} onClose={() => setShowUpgradeModal(false)} />
      )}

      {deleteConfirmPost && (
        <ConfirmModal
          title="Delete post?"
          message="This post will be permanently deleted. This cannot be undone."
          confirmLabel="Yes"
          cancelLabel="No"
          confirmVariant="danger"
          onConfirm={handleDeletePostConfirm}
          onCancel={() => setDeleteConfirmPost(null)}
        />
      )}

      {logoutConfirm && (
        <ConfirmModal
          title="Log out?"
          message="Are you sure you want to log out?"
          confirmLabel="Yes"
          cancelLabel="Cancel"
          confirmVariant="danger"
          onConfirm={handleLogoutConfirm}
          onCancel={() => setLogoutConfirm(false)}
        />
      )}

      <div className="dashboard-layout">
        <Sidebar
          user={user}
          onLogout={handleLogoutClick}
          posts={postsList}
          currentPostId={currentPostId}
          onNewPost={handleNewPost}
          onSelectPost={handleSelectPost}
          onRenamePost={handleRenamePost}
          onPinPost={handlePinPost}
          onDeletePost={handleDeletePostRequest}
          loading={generating}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          mobileOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />
        <div className="dashboard-main">
          {/* Credit status bar */}
          <div className="credit-bar">
            <div className="credit-bar-left">
              <span className="credit-bar-label">
                <span className="credit-bar-icon">⚡</span>
                {credits} credits
              </span>
              <span className={`credit-bar-plan credit-bar-plan--${plan}`}>
                {plan.toUpperCase()}
              </span>
              {credits < 10 && credits > 0 && (
                <span className="credit-bar-warning">Running low!</span>
              )}
              {credits === 0 && (
                <span className="credit-bar-empty">No credits left</span>
              )}
            </div>
            <div className="credit-bar-right">
              <div className="credit-progress-track">
                <div
                  className="credit-progress-fill"
                  style={{ width: `${creditPct}%` }}
                />
              </div>
              <button
                className="credit-upgrade-btn"
                onClick={() => navigate('/pricing')}
              >
                Upgrade
              </button>
            </div>
          </div>

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
