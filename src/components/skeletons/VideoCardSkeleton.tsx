import React from 'react';

const VideoCardSkeleton = () => {
  return (
    <div className="video-card bg-creamey rounded-lg overflow-hidden animate-pulse">
      {/* Thumbnail skeleton */}
      <div className="relative aspect-video w-full bg-gray-200" />
      <div className="p-4">
        {/* Badges skeleton */}
        <div className="flex items-center justify-between mb-2">
          <div className="w-20 h-5 bg-gray-200 rounded" />
          <div className="w-14 h-5 bg-gray-200 rounded" />
        </div>
        {/* Title skeleton */}
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
        {/* Description skeleton */}
        <div className="h-4 bg-gray-200 rounded w-full mb-1" />
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-3" />
        {/* Video count skeleton */}
        <div className="h-4 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  );
};

export default VideoCardSkeleton; 