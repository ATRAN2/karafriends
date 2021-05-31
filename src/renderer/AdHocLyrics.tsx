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

  useEffect(() => {
    if (!props.videoRef.current) return;
    props.videoRef.current.addEventListener("resize", () => {
      if (!canvasRef.current) return;
      if (!props.videoRef.current) return;
      canvasRef.current.width =
        props.videoRef.current.getBoundingClientRect().width *
        window.devicePixelRatio;
      canvasRef.current.height =
        props.videoRef.current.getBoundingClientRect().height *
        window.devicePixelRatio *
        0.9;
      displayLyrics(canvasRef.current, props.lyrics);
    });
  }, [props.videoRef.current]);

  function displayLyrics(canvas: HTMLCanvasElement, lyrics: string[]): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fontSize = Math.round(canvas.height / 10);
    ctx.font = `bold ${fontSize}px 'Aria', sans-serif`;
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    let verticalSpace = canvas.height - fontSize / 2;
    console.log("hoa");

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
