import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api/client';
import { ADS } from '@/lib/api/endpoints';
import type { Advertisement, AdPosition } from '@/types';

interface AdBannerProps {
  position: AdPosition;
  page?: string;
  className?: string;
  /** Max number of ads to show in this slot */
  limit?: number;
}

export function AdBanner({ position, page, className = '', limit = 1 }: AdBannerProps) {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const tracked = useRef<Set<string>>(new Set());

  useEffect(() => {
    api
      .get(ADS.ACTIVE, { params: { position, page } })
      .then((res) => {
        const data = res.data.data;
        const list = Array.isArray(data) ? data.slice(0, limit) : [];
        setAds(list);

        // Track impressions
        for (const ad of list) {
          if (!tracked.current.has(ad._id)) {
            tracked.current.add(ad._id);
            api.post(ADS.IMPRESSION(ad._id)).catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, [position, page, limit]);

  if (ads.length === 0) return null;

  return (
    <div className={`ad-banner ${className}`}>
      {ads.map((ad) => (
        <AdUnit key={ad._id} ad={ad} />
      ))}
    </div>
  );
}

function AdUnit({ ad }: { ad: Advertisement }) {
  const handleClick = () => {
    api.post(ADS.CLICK(ad._id)).catch(() => {});
  };

  if (ad.type === 'image') {
    const content = (
      <img
        src={ad.image_url}
        alt={ad.alt_text || ad.title}
        className="w-full h-auto rounded-lg"
      />
    );

    if (ad.link_url) {
      return (
        <a
          href={ad.link_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={handleClick}
          className="block"
        >
          {content}
        </a>
      );
    }

    return content;
  }

  if (ad.type === 'html' && ad.html_content) {
    return (
      <div
        className="ad-html"
        dangerouslySetInnerHTML={{ __html: ad.html_content }}
        onClick={handleClick}
      />
    );
  }

  if (ad.type === 'script' && ad.script_content) {
    return <ScriptAd script={ad.script_content} />;
  }

  return null;
}

function ScriptAd({ script }: { script: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !script) return;
    const range = document.createRange();
    range.selectNode(containerRef.current);
    const fragment = range.createContextualFragment(script);
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(fragment);
  }, [script]);

  return <div ref={containerRef} className="ad-script" />;
}
