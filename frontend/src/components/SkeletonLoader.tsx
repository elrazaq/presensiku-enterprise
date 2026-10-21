"use client";

import React from "react";

export function SkeletonLoader() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 1. Header & Title Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-2">
          <div className="h-6 w-56 rounded-xl skeleton-shimmer"></div>
          <div className="h-3.5 w-72 rounded-lg skeleton-shimmer"></div>
        </div>
        <div className="h-9 w-32 rounded-xl skeleton-shimmer"></div>
      </div>

      {/* 2. Top Metrics Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 rounded skeleton-shimmer"></div>
              <div className="w-8 h-8 rounded-lg skeleton-shimmer"></div>
            </div>
            <div className="h-8 w-20 rounded-lg skeleton-shimmer"></div>
            <div className="h-2.5 w-36 rounded skeleton-shimmer"></div>
          </div>
        ))}
      </div>

      {/* 3. Main Content Skeleton (Card Besar) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-5 w-44 rounded-lg skeleton-shimmer"></div>
          <div className="h-8 w-60 rounded-xl skeleton-shimmer"></div>
        </div>

        {/* Table Rows Skeleton */}
        <div className="space-y-3 pt-2">
          <div className="h-10 w-full rounded-xl skeleton-shimmer opacity-70"></div>
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="h-12 w-full rounded-xl skeleton-shimmer opacity-40"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
