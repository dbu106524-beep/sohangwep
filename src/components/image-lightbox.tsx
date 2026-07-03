"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function ImageLightbox({
  images,
  alt = "",
  className = "article-image-gallery",
  mode = "gallery",
}: {
  images: string[];
  alt?: string;
  className?: string;
  mode?: "gallery" | "slider";
}) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeImage = activeIndex === null ? null : images[activeIndex];
  const hasManyImages = images.length > 1;
  const lightbox = renderLightbox();
  const lightboxPortal = typeof document === "undefined" || !lightbox ? null : createPortal(lightbox, document.body);

  function moveSlide(direction: -1 | 1) {
    setSlideIndex((current) => (current + direction + images.length) % images.length);
  }

  function moveActive(direction: -1 | 1) {
    setActiveIndex((current) => {
      const index = current ?? slideIndex;
      return (index + direction + images.length) % images.length;
    });
  }

  useEffect(() => {
    if (!activeImage) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveIndex(null);
      }
      if (event.key === "ArrowLeft" && hasManyImages) {
        moveActive(-1);
      }
      if (event.key === "ArrowRight" && hasManyImages) {
        moveActive(1);
      }
    }

    document.body.classList.add("lightbox-open");
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("lightbox-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeImage, hasManyImages]);

  if (mode === "slider") {
    const currentImage = images[slideIndex] ?? images[0];

    return (
      <>
        <div className={`${className} image-slider`}>
          <button
            type="button"
            className="lightbox-trigger image-slider-main"
            onClick={() => setActiveIndex(slideIndex)}
            aria-label={`${alt || "이미지"} 크게 보기`}
          >
            <img src={currentImage} alt={alt} />
          </button>
          {hasManyImages ? (
            <>
              <button type="button" className="image-slider-button previous" onClick={() => moveSlide(-1)} aria-label="이전 이미지">
                ‹
              </button>
              <button type="button" className="image-slider-button next" onClick={() => moveSlide(1)} aria-label="다음 이미지">
                ›
              </button>
              <div className="image-slider-counter">
                {slideIndex + 1} / {images.length}
              </div>
              <div className="image-slider-dots" aria-label="이미지 선택">
                {images.map((url, index) => (
                  <button
                    key={url}
                    type="button"
                    className={index === slideIndex ? "active" : ""}
                    onClick={() => setSlideIndex(index)}
                    aria-label={`${index + 1}번째 이미지 보기`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
        {lightboxPortal}
      </>
    );
  }

  return (
    <>
      <div className={className}>
        {images.map((url, index) => (
          <button
            key={url}
            type="button"
            className="lightbox-trigger"
            onClick={() => setActiveIndex(index)}
            aria-label={`${alt || "이미지"} ${index + 1} 크게 보기`}
          >
            <img src={url} alt={alt} />
          </button>
        ))}
      </div>
      {lightboxPortal}
    </>
  );

  function renderLightbox() {
    if (!activeImage) {
      return null;
    }

    return (
      <div className="image-lightbox" role="dialog" aria-modal="true" onClick={() => setActiveIndex(null)}>
        <div className="image-lightbox-frame" onClick={(event) => event.stopPropagation()}>
          <button type="button" className="image-lightbox-close" onClick={() => setActiveIndex(null)} aria-label="닫기">
            닫기
          </button>
          {hasManyImages ? (
            <button type="button" className="image-lightbox-nav previous" onClick={() => moveActive(-1)} aria-label="이전 이미지">
              ‹
            </button>
          ) : null}
          <img src={activeImage} alt={alt} />
          {hasManyImages ? (
            <button type="button" className="image-lightbox-nav next" onClick={() => moveActive(1)} aria-label="다음 이미지">
              ›
            </button>
          ) : null}
        </div>
      </div>
    );
  }
}
