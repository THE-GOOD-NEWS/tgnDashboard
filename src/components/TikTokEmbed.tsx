"use client";
import React, { useEffect, useRef, useState } from "react";

interface TikTokEmbedProps {
  url: string;
}

const TikTokEmbed: React.FC<TikTokEmbedProps> = ({ url }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!url || !containerRef.current) return;

    const createEmbed = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        // Call our local API proxy to get the embed HTML
        const response = await fetch(`/api/tiktok-embed?url=${encodeURIComponent(url)}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.html && containerRef.current) {
          // Set the HTML content
          containerRef.current.innerHTML = data.html;
          
          // Load TikTok's embed script if it's not already loaded
          if (!document.querySelector('script[src*="embed.tiktok.com"]')) {
            const script = document.createElement('script');
            script.src = 'https://www.tiktok.com/embed.js';
            script.async = true;
            document.head.appendChild(script);
          } else {
            // If script is already loaded, trigger the embed rendering
            if (window.tiktokEmbed) {
              window.tiktokEmbed.lib.render(containerRef.current);
            }
          }
          
          setIsLoading(false);
        } else {
          throw new Error('No embed HTML received');
        }
      } catch (error) {
        console.error('Error creating TikTok embed:', error);
        setHasError(true);
        setIsLoading(false);
        
        // Create fallback link
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg">
              <p class="text-gray-600 mb-4">Unable to load TikTok video</p>
              <a href="${url}" target="_blank" rel="noopener noreferrer" 
                 class="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                View on TikTok
              </a>
            </div>
          `;
        }
      }
    };

    createEmbed();
  }, [url]);

  return (
    <div className="w-full max-w-md mx-auto">
      {isLoading && !hasError && (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
          <p className="text-gray-600">Loading TikTok video...</p>
        </div>
      )}
      <div ref={containerRef} className="tiktok-embed-container" />
    </div>
  );
};

// Extend the Window interface to include tiktokEmbed
declare global {
  interface Window {
    tiktokEmbed?: {
      lib: {
        render: (element: HTMLElement) => void;
      };
    };
  }
}

export default TikTokEmbed;