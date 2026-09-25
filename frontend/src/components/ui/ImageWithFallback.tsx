import { useState } from "react";

/**
 * An image that degrades into readable text instead of a broken icon.
 *
 * Two failure modes are handled, and they are different:
 *   1. There was never a url (the provider had no photo)
 *   2. There was a url and it failed to load (hotlink blocked, 404, offline)
 *
 * Both land on the same fallback: the subject's NAME in spaced caps. Per the
 * design rules that beats a placeholder icon, because it still tells you which
 * event or artist you are looking at — information an icon cannot carry.
 */
export function ImageWithFallback({
  src,
  alt,
  fallbackText,
  className = "",
  imageClassName = "",
}: {
  src: string | null | undefined;
  alt: string;
  fallbackText: string;
  className?: string;
  imageClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  return (
    <div className={`overflow-hidden bg-surface ${className}`}>
      {showFallback ? (
        <div className="flex h-full w-full items-center justify-center px-4">
          <span className="line-clamp-3 text-center text-sm font-medium uppercase tracking-widest text-fg-subtle">
            {fallbackText}
          </span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover ${imageClassName}`}
        />
      )}
    </div>
  );
}
