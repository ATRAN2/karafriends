function displayLyrics(canvas: HTMLCanvasElement, text: string[]): void {
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

  text
    .slice()
    .reverse()
    .forEach((line) => {
      const textSize = ctx.measureText(line);
      ctx.fillText(line, canvas.width / 2 - textSize.width / 2, verticalSpace);
      ctx.strokeText(
        line,
        canvas.width / 2 - textSize.width / 2,
        verticalSpace
      );
      verticalSpace = verticalSpace - fontSize;
    });
}
