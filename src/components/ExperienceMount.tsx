"use client";

import { useEffect, useRef } from "react";
import { createExperience } from "../experience";

export function ExperienceMount() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const experience = createExperience({
      canvas: canvasRef.current,
      container: containerRef.current,
    });

    return () => {
      experience.destroy();
    };
  }, []);

  return (
    <div className="gl" ref={containerRef}>
      <canvas ref={canvasRef} />
    </div>
  );
}
