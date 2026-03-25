export function drawAvatar(canvasId, traits = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const eyeShape = traits.eyeShape || "uneven";
  const mouthShape = traits.mouthShape || "confused";
  const extraFeature = traits.extraFeature || "question_mark";
  const faceColor = traits.faceColor || "#a8a08b";

  ctx.clearRect(0, 0, 200, 200);
  ctx.save();
  ctx.translate(100, 100);
  ctx.rotate((Math.random() - 0.5) * 0.08);

  ctx.fillStyle = faceColor;
  ctx.beginPath();
  ctx.arc(0, 0, 70, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 3;

  const drawEye = (x, y, type) => {
    ctx.beginPath();
    if (type === "wide") {
      ctx.arc(x, y, 10, 0, Math.PI * 2);
    } else if (type === "squinting") {
      ctx.moveTo(x - 12, y);
      ctx.lineTo(x + 12, y + 1);
    } else if (type === "droopy") {
      ctx.moveTo(x - 10, y - 2);
      ctx.quadraticCurveTo(x, y + 8, x + 10, y + 2);
    } else {
      ctx.ellipse(x, y, 8, 5, 0.2, 0, Math.PI * 2);
    }
    ctx.stroke();
  };

  if (eyeShape === "uneven") {
    drawEye(-22, -16, "wide");
    drawEye(22, -12, "squinting");
  } else {
    drawEye(-24, -14, eyeShape);
    drawEye(24, -14, eyeShape);
  }

  ctx.beginPath();
  if (mouthShape === "frown") {
    ctx.moveTo(-20, 30);
    ctx.quadraticCurveTo(0, 12, 20, 30);
  } else if (mouthShape === "smirk") {
    ctx.moveTo(-20, 20);
    ctx.quadraticCurveTo(10, 38, 26, 18);
  } else if (mouthShape === "open") {
    ctx.ellipse(0, 26, 14, 10, 0, 0, Math.PI * 2);
  } else {
    ctx.moveTo(-20, 24);
    ctx.bezierCurveTo(-8, 35, 8, 10, 20, 24);
  }
  ctx.stroke();

  if (extraFeature === "sweat_drop") {
    ctx.fillStyle = "#7fb3d5";
    ctx.beginPath();
    ctx.moveTo(38, -30);
    ctx.quadraticCurveTo(48, -18, 38, -8);
    ctx.quadraticCurveTo(30, -18, 38, -30);
    ctx.fill();
  } else if (extraFeature === "question_mark") {
    ctx.strokeStyle = "#f5f0e8";
    ctx.beginPath();
    ctx.moveTo(45, -42);
    ctx.quadraticCurveTo(58, -45, 56, -30);
    ctx.quadraticCurveTo(54, -22, 47, -20);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(46, -12, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = "#f5f0e8";
    ctx.fill();
  } else if (extraFeature === "flies") {
    const spots = [
      [-52, -26],
      [-44, -10],
      [-58, 3]
    ];
    ctx.fillStyle = "#1a1a1a";
    spots.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 3, y - 2, 1.3, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (extraFeature === "halo") {
    ctx.strokeStyle = "#e8d44d";
    ctx.beginPath();
    ctx.ellipse(0, -62, 28, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}
