"use client";

import { useEffect, useState } from "react";

export function ImageLightbox({
  images,
  alt = "",
  className = "article-image-gallery",
}: {
  images: string[];
  alt?: string;
  className?: string;
}) {
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    if (!activeImage) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveImage(null);
      }
    }

    document.body.classList.add("lightbox-open");
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.classList.remove("lightbox-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeImage]);

  return (
    <>
      <div className={className}>
        {images.map((url, index) => (
          <button
            key={url}
            type="button"
            className="lightbox-trigger"
            onClick={() => setActiveImage(url)}
            aria-label={`${alt || "이미지"} ${index + 1} 크게 보기`}
          >
            <img src={url} alt={alt} />
          </button>
        ))}
      </div>

      {activeImage ? (
        <div className="image-lightbox" role="dialog" aria-modal="true" onClick={() => setActiveImage(null)}>
          <button type="button" className="image-lightbox-close" onClick={() => setActiveImage(null)} aria-label="닫기">
            닫기
          </button>
          <img src={activeImage} alt={alt} onClick={(event) => event.stopPropagation()} />
        </div>
      ) : null}
    </>
  );
}
