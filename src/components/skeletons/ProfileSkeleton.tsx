import React from "react";
import DefaultLayout from "../Layouts/DefaultLayout";

const ProfileSkeleton = () => (
  <DefaultLayout>
    <div className="animate-pulse space-y-6">
      {/* Profile Header Skeleton */}
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-24 w-24 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-6 w-32 rounded bg-gray-200" />
            <div className="h-4 w-48 rounded bg-gray-200" />
            <div className="h-4 w-40 rounded bg-gray-200" />
          </div>
        </div>
        <div className="h-6 w-20 rounded bg-gray-200" />
      </div>
      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6"
          >
            <div className="absolute rounded-md bg-gray-200 p-3" />
            <div className="mb-2 ml-16 h-4 w-24 rounded bg-gray-200" />
            <div className="ml-16 h-8 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>
      {/* Recent Activity Skeleton */}
      <div>
        <div className="mb-4 h-6 w-40 rounded bg-gray-200" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b pb-4"
            >
              <div>
                <div className="mb-2 h-4 w-32 rounded bg-gray-200" />
                <div className="h-4 w-40 rounded bg-gray-200" />
              </div>
              <div className="h-6 w-20 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </DefaultLayout>
);

export default ProfileSkeleton;
