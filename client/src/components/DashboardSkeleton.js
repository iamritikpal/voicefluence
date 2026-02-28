import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import '../styles/skeleton.css';

function DashboardSkeleton() {
  return (
    <SkeletonTheme baseColor="#E5E7EB" highlightColor="#F3F4F6">
      <div className="dashboard-skeleton">
        <div className="skeleton-container">
          <section className="skeleton-agent-section">
            <div className="skeleton-visual">
              <Skeleton circle width={120} height={120} className="skeleton-orb" />
            </div>
            <div className="skeleton-message">
              <Skeleton count={2} width="90%" height={14} className="skeleton-line" />
              <Skeleton width="60%" height={14} className="skeleton-line" />
            </div>
            <div className="skeleton-controls">
              <Skeleton circle width={64} height={64} className="skeleton-mic" />
            </div>
          </section>
        </div>
      </div>
    </SkeletonTheme>
  );
}

export default DashboardSkeleton;
