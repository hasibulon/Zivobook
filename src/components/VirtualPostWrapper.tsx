import React, { useState, useRef, useEffect } from 'react';

interface VirtualPostWrapperProps {
  children: React.ReactNode;
  postId: string;
  estimatedHeight?: number;
  theme?: 'dark' | 'light'; // থিম প্রপ ঐচ্ছিক করা হলো
  key?: any;
}

export default function VirtualPostWrapper({
  children,
  postId,
  estimatedHeight = 350,
  theme = 'dark'
}: VirtualPostWrapperProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => { setIsVisible(entry.isIntersecting); },
      { rootMargin: '500px 0px 500px 0px', threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isVisible) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
        if (height > 0) setMeasuredHeight(height);
      }
    });

    resizeObserver.observe(el);
    return () => resizeObserver.unobserve(el);
  }, [isVisible]);

  const displayHeight = measuredHeight || estimatedHeight;

  return (
    <div
      ref={containerRef}
      style={{ minHeight: isVisible ? undefined : `${displayHeight}px` }}
      className="transition-all duration-150"
      id={`virtual-post-wrapper-${postId}`}
    >
      {isVisible ? (
        children
      ) : (
        <div
          style={{ height: `${displayHeight}px` }}
          className={`w-full rounded-2xl flex flex-col justify-between p-4 px-5 select-none animate-pulse ${
            isDark 
              ? 'bg-zinc-900/40 border border-zinc-800' 
              : 'bg-gray-100 border border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`} />
            <div className="space-y-1.5 flex-1">
              <div className={`h-3 w-1/4 rounded ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`} />
              <div className={`h-2 w-1/6 rounded ${isDark ? 'bg-zinc-700' : 'bg-gray-200'}`} />
            </div>
          </div>
          <div className="space-y-2 py-4">
            <div className={`h-2.5 w-11/12 rounded ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`} />
            <div className={`h-2.5 w-full rounded ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`} />
          </div>
          <div className={`border-t pt-3.5 flex justify-around gap-2 mt-auto ${isDark ? 'border-zinc-800' : 'border-gray-200'}`}>
            <div className={`h-4 w-12 rounded ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`} />
            <div className={`h-4 w-12 rounded ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`} />
            <div className={`h-4 w-12 rounded ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`} />
          </div>
        </div>
      )}
    </div>
  );
}