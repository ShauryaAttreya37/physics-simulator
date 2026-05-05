/**
 * Canvas Rendering Utilities
 *
 * Provides consistent, high-performance drawing helpers for physics visualizations.
 */

/**
 * Draws a high-fidelity arrow on a 2D canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x1 - Start X
 * @param {number} y1 - Start Y
 * @param {number} x2 - End X
 * @param {number} y2 - End Y
 * @param {Object} options - { color, lineWidth, headLength, headWidth, label }
 */
export function drawArrow(ctx, x1, y1, x2, y2, options = {}) {
  const { color = '#fff', lineWidth = 2, headLength = 10, headWidth = 6, label = '' } = options;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  const len = Math.sqrt(dx * dx + dy * dy);

  if (len < 1) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  // Main line
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle - Math.PI / headWidth),
    y2 - headLength * Math.sin(angle - Math.PI / headWidth),
  );
  ctx.lineTo(
    x2 - headLength * Math.cos(angle + Math.PI / headWidth),
    y2 - headLength * Math.sin(angle + Math.PI / headWidth),
  );
  ctx.closePath();
  ctx.fill();

  // Label
  if (label) {
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const lx = (x1 + x2) / 2 + 10 * Math.cos(angle + Math.PI / 2);
    const ly = (y1 + y2) / 2 + 10 * Math.sin(angle + Math.PI / 2);
    ctx.fillText(label, lx, ly);
  }

  ctx.restore();
}

/**
 * Draws a fading trail from a set of points.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<Array<number>>} points - [[x1, y1], [x2, y2], ...]
 * @param {Object} options - { color, lineWidth, maxAlpha }
 */
export function drawTrail(ctx, points, options = {}) {
  if (points.length < 2) return;
  const { color = 'rgba(96, 165, 250, 1)', lineWidth = 2, maxAlpha = 0.8 } = options;

  // Extract base color if it's rgba
  let baseColor = color;
  if (color.startsWith('rgba')) {
    baseColor = color.substring(0, color.lastIndexOf(','));
  }

  for (let i = 1; i < points.length; i++) {
    const alpha = (i / points.length) * maxAlpha;
    ctx.beginPath();
    ctx.moveTo(points[i - 1][0], points[i - 1][1]);
    ctx.lineTo(points[i][0], points[i][1]);
    ctx.strokeStyle = color.startsWith('rgba') ? `${baseColor}, ${alpha})` : color;
    ctx.lineWidth = 1 + (i / points.length) * lineWidth;
    ctx.stroke();
  }
}

/**
 * Converts hex color to RGB string.
 */
export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}
