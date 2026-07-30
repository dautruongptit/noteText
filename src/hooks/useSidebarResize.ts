import { useEffect, useRef, useState, type MouseEvent } from "react";

const DEFAULT_SW = 220;
const MIN_SW = 180;
const MAX_SW = 480;

export function useSidebarResize() {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const v = localStorage.getItem("noted-sw");
    return v ? Number(v) : DEFAULT_SW;
  });
  const swRef = useRef(sidebarWidth);
  const dragging = useRef(false);
  const dragX = useRef(0);
  const dragW = useRef(0);

  useEffect(() => { swRef.current = sidebarWidth; }, [sidebarWidth]);

  useEffect(() => {
    const onMove = (e: globalThis.MouseEvent) => {
      if (!dragging.current) return;
      const next = Math.min(MAX_SW, Math.max(MIN_SW, dragW.current + e.clientX - dragX.current));
      setSidebarWidth(next);
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      localStorage.setItem("noted-sw", String(swRef.current));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  const startResize = (e: MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    dragX.current = e.clientX;
    dragW.current = swRef.current;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const resetWidth = () => {
    setSidebarWidth(DEFAULT_SW);
    localStorage.setItem("noted-sw", String(DEFAULT_SW));
  };

  return { sidebarWidth, startResize, resetWidth };
}
