import React from 'react';
import './Skeleton.scss';

export const Skeleton = ({ width, height, circle, className }) => {
  return (
    <div
      className={`skeleton-pulse ${circle ? 'skeleton-circle' : ''} ${className || ''}`}
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius: circle ? '50%' : '4px'
      }}
    />
  );
};

export const SkeletonText = ({ lines = 1, width }) => {
  return (
    <>
      {[...Array(lines)].map((_, i) => (
        <Skeleton
          key={i}
          width={typeof width === 'object' ? width[i] : width}
          className="skeleton-text"
        />
      ))}
    </>
  );
};

export const SkeletonProfile = () => {
  return (
    <div className="skeleton-profile">
      <div className="skeleton-header">
        <Skeleton circle width="120px" height="120px" />
        <div className="skeleton-info">
          <SkeletonText width="200px" />
          <SkeletonText width="150px" />
          <SkeletonText width="100px" />
        </div>
      </div>
      <div className="skeleton-content">
        <SkeletonText lines={3} width={['90%', '85%', '80%']} />
      </div>
    </div>
  );
};

export const SkeletonPackage = () => {
  return (
    <div className="skeleton-package">
      <Skeleton width="100%" height="160px" />
      <div className="skeleton-package-content">
        <SkeletonText width="70%" />
        <SkeletonText width="90%" lines={2} />
        <div className="skeleton-package-footer">
          <SkeletonText width="40%" />
          <Skeleton width="60px" height="24px" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonPackageGrid = ({ count = 6 }) => {
  return (
    <div className="skeleton-package-grid">
      {[...Array(count)].map((_, i) => (
        <SkeletonPackage key={i} />
      ))}
    </div>
  );
};