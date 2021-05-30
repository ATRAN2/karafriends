import React, { useEffect, useRef } from "react";
import "./AdhocLyrics.css";

export default function AdhocLyrics(props: {
  lyrics: string[];
  videoRef: React.RefObject<HTMLVideoElement>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    displayLyrics(canvasRef.current, props.lyrics);
  }, [props.lyrics]);

  function displayLyrics(canvas: HTMLCanvasElement, lyrics: string[]): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;

    const fontSize = canvas.height / 10;
    ctx.font = `bold ${fontSize}px 'Aria', sans-serif`;
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;
    let verticalSpace = canvas.height - fontSize;

    lyrics
      .slice()
      .reverse()
      .forEach((line) => {
        const textSize = ctx.measureText(line);
        ctx.fillText(
          line,
          canvas.width / 2 - textSize.width / 2,
          verticalSpace
        );
        ctx.strokeText(
          line,
          canvas.width / 2 - textSize.width / 2,
          verticalSpace
        );
        verticalSpace = verticalSpace - fontSize;
      });
  }

  return <canvas className="adhoc-lyrics" ref={canvasRef} />;
}
