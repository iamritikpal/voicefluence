import React, { useState, useRef, useEffect } from 'react';
import '../styles/postoptions.css';

function PostOptionsMenu({ post, onStartRename, onPin, onDelete }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open]);

  const handleRenameClick = () => {
    onStartRename(post);
    setOpen(false);
  };

  const handlePinClick = () => {
    onPin(post.id, !post.pinned);
    setOpen(false);
  };

  const handleDeleteClick = () => {
    onDelete(post);
    setOpen(false);
  };

  return (
    <div className="post-options-wrapper" ref={menuRef}>
      <button
        type="button"
        className="post-options-trigger"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        aria-label="Post options"
        aria-expanded={open}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="post-options-menu">
          <button
            type="button"
            className="post-options-item"
            onClick={handleRenameClick}
          >
            <svg className="post-options-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Rename
          </button>
          <button
            type="button"
            className="post-options-item"
            onClick={handlePinClick}
          >
            <svg className="post-options-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 17v5" />
              <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78 0.9A2 2 0 0 0 5 14.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1.76a2 2 0 0 0-1.11-1.79l-1.78-0.9a2 2 0 0 1-1.11-1.79V7" />
            </svg>
            {post.pinned ? 'Unpin' : 'Pin chat'}
          </button>
          <button
            type="button"
            className="post-options-item post-options-item--delete"
            onClick={handleDeleteClick}
          >
            <svg className="post-options-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default PostOptionsMenu;
