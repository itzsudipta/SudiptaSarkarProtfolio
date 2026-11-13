import React, { useId, useState } from "react";

export function ImageGallery({ images = [], name, id }) {
  const [expanded, setExpanded] = useState(false);
  const generatedId = useId();
  const galleryId = id || `image-gallery-${generatedId}`;
  const previewLimit = 3;

  if (images.length === 0) return null;

  const hiddenCount = Math.max(0, images.length - previewLimit);
  const visibleImages = expanded ? images : images.slice(0, previewLimit);

  return (
    <div className="image-gallery" role="group" aria-label={`${name} pictures`}>
      <div id={galleryId} className="image-gallery-items">
        {visibleImages.map((image, index) => (
          <img
            key={image.src}
            src={image.src}
            alt={image.alt || `${name} image ${index + 1}`}
            loading="lazy"
            decoding="async"
          />
        ))}
      </div>

      {hiddenCount > 0 && (
        <button
          type="button"
          className="image-gallery-toggle"
          aria-controls={galleryId}
          aria-expanded={expanded}
          aria-label={
            expanded
              ? `Show fewer pictures for ${name}`
              : `Show ${hiddenCount} more pictures for ${name}`
          }
          onClick={() => setExpanded((previous) => !previous)}
        >
          {expanded ? "Show less" : `+${hiddenCount} more`}
        </button>
      )}
    </div>
  );
}
