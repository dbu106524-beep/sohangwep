"use client";

import { useEffect, useRef, useState } from "react";

type Spark = {
  id: number;
  x: number;
  y: number;
  size: number;
};

function seededRandom(seed: number) {
  const value = Math.sin(seed * 999.91) * 10000;
  return value - Math.floor(value);
}

export function SpaceEffects() {
  const [mounted, setMounted] = useState(false);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [stars] = useState(() =>
    Array.from({ length: 90 }, (_, index) => ({
      id: index,
      x: seededRandom(index + 1) * 100,
      y: seededRandom(index + 101) * 100,
      size: 1 + seededRandom(index + 201) * 2.4,
      delay: seededRandom(index + 301) * 4,
      duration: 2.2 + seededRandom(index + 401) * 3.8,
    })),
  );
  const [comets] = useState(() =>
    Array.from({ length: 5 }, (_, index) => ({
      id: index,
      top: 8 + seededRandom(index + 501) * 78,
      delay: index * 3.8 + seededRandom(index + 601) * 4,
      duration: 8 + seededRandom(index + 701) * 6,
    })),
  );
  const sparkId = useRef(0);
  const lastSparkAt = useRef(0);

  useEffect(() => {
    setMounted(true);

    function onPointerMove(event: PointerEvent) {
      const now = performance.now();
      if (now - lastSparkAt.current < 42) {
        return;
      }

      lastSparkAt.current = now;
      const nextSpark = {
        id: sparkId.current++,
        x: event.clientX,
        y: event.clientY,
        size: 4 + Math.random() * 5,
      };

      setSparks((current) => [...current.slice(-16), nextSpark]);
      window.setTimeout(() => {
        setSparks((current) => current.filter((spark) => spark.id !== nextSpark.id));
      }, 720);
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  if (!mounted) {
    return <div className="space-effects" aria-hidden="true" />;
  }

  return (
    <div className="space-effects" aria-hidden="true">
      <div className="random-stars">
        {stars.map((star) => (
          <span
            key={star.id}
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            }}
          />
        ))}
      </div>
      <div className="comet-field">
        {comets.map((comet) => (
          <span
            key={comet.id}
            style={{
              top: `${comet.top}%`,
              animationDelay: `${comet.delay}s`,
              animationDuration: `${comet.duration}s`,
            }}
          />
        ))}
      </div>
      <div className="cursor-sparks">
        {sparks.map((spark) => (
          <span
            key={spark.id}
            style={{
              left: spark.x,
              top: spark.y,
              width: spark.size,
              height: spark.size,
            }}
          />
        ))}
      </div>
    </div>
  );
}
