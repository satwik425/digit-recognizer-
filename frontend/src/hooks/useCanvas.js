import { useRef, useState, useEffect, useCallback } from "react";

export function useCanvas({ onStrokeEnd, debounceMs = 600, brushSize = 22 }) {
  const canvasRef   = useRef(null);
  const isDrawing   = useRef(false);
  const lastPos     = useRef({ x: 0, y: 0 });
  const debounceRef = useRef(null);
  const [hasContent, setHasContent] = useState(false);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    if (e.touches) return {
      x: (e.touches[0].clientX - rect.left) * sx,
      y: (e.touches[0].clientY - rect.top)  * sy,
    };
    return {
      x: (e.clientX - rect.left) * sx,
      y: (e.clientY - rect.top)  * sy,
    };
  };

  const applyBrush = useCallback((ctx) => {
    ctx.strokeStyle  = "#ffffff";
    ctx.fillStyle    = "#ffffff";
    ctx.lineWidth    = brushSize;
    ctx.lineCap      = "round";
    ctx.lineJoin     = "round";
    ctx.shadowColor  = "rgba(255,255,255,0.55)";
    ctx.shadowBlur   = 7;
  }, [brushSize]);

  const schedulePredict = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas && onStrokeEnd) onStrokeEnd(canvas.toDataURL("image/png"), canvas);
    }, debounceMs);
  }, [onStrokeEnd, debounceMs]);

  const startDraw = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    applyBrush(ctx);
    const pos = getPos(e, canvas);
    isDrawing.current = true;
    lastPos.current   = pos;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    setHasContent(true);
  }, [applyBrush]);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    applyBrush(ctx);
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setHasContent(true);
  }, [applyBrush]);

  const stopDraw = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    schedulePredict();
  }, [schedulePredict]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("mousedown",  startDraw, { passive: false });
    canvas.addEventListener("mousemove",  draw,      { passive: false });
    canvas.addEventListener("mouseup",    stopDraw);
    canvas.addEventListener("mouseleave", stopDraw);
    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove",  draw,      { passive: false });
    canvas.addEventListener("touchend",   stopDraw);
    return () => {
      canvas.removeEventListener("mousedown",  startDraw);
      canvas.removeEventListener("mousemove",  draw);
      canvas.removeEventListener("mouseup",    stopDraw);
      canvas.removeEventListener("mouseleave", stopDraw);
      canvas.removeEventListener("touchstart", startDraw);
      canvas.removeEventListener("touchmove",  draw);
      canvas.removeEventListener("touchend",   stopDraw);
    };
  }, [startDraw, draw, stopDraw]);

  return { canvasRef, clearCanvas, hasContent };
}
