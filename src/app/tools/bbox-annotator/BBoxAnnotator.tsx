"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ImageEntry {
  name: string;
  src: string;
}

interface ViewState {
  scale: number;
  panX: number;
  panY: number;
}

export default function BBoxAnnotator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [images, setImages] = useState<ImageEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [annotations, setAnnotations] = useState<Record<string, BBox[]>>({});
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null);
  const [hoveredBoxIndex, setHoveredBoxIndex] = useState<number | null>(null);
  const [zoomDisplay, setZoomDisplay] = useState<number>(1);
  const [cursorStyle, setCursorStyle] = useState<string>("crosshair");

  // View state: scale=1 means no extra zoom (fit-to-canvas already handled separately)
  const viewState = useRef<ViewState>({ scale: 1, panX: 0, panY: 0 });

  const isDrawing = useRef(false);
  const drawStart = useRef<{ x: number; y: number } | null>(null);
  const drawCurrent = useRef<{ x: number; y: number } | null>(null);
  const isPanning = useRef(false);
  const panStart = useRef<{ x: number; y: number } | null>(null);
  const isShiftDown = useRef(false);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);
  const currentImageNameRef = useRef<string>("");

  // Refs for stable access in event handlers without stale closures
  const annotationsRef = useRef<Record<string, BBox[]>>({});
  const selectedBoxIndexRef = useRef<number | null>(null);
  const hoveredBoxIndexRef = useRef<number | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);
  useEffect(() => {
    selectedBoxIndexRef.current = selectedBoxIndex;
  }, [selectedBoxIndex]);
  useEffect(() => {
    hoveredBoxIndexRef.current = hoveredBoxIndex;
  }, [hoveredBoxIndex]);

  // Compute fit-to-canvas parameters
  const getFitParams = useCallback(() => {
    const canvas = canvasRef.current;
    const img = loadedImageRef.current;
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) {
      return { fitScale: 1, fitOffsetX: 0, fitOffsetY: 0 };
    }
    const scaleX = img.naturalWidth / canvas.width;
    const scaleY = img.naturalHeight / canvas.height;
    const fitScale2 = Math.min(scaleX, scaleY); // scale to contain (show full image)
    const displayW = img.naturalWidth / fitScale2;
    const displayH = img.naturalHeight / fitScale2;
    const fitOffsetX = (canvas.width - displayW) / 2;
    const fitOffsetY = (canvas.height - displayH) / 2;
    // fitScale here = pixels per original pixel
    const fitScale = displayW / img.naturalWidth;
    return { fitScale, fitOffsetX, fitOffsetY };
  }, []);

  // Convert original image coords -> final canvas coords (including zoom/pan)
  const origToCanvas = useCallback(
    (origX: number, origY: number): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: origX, y: origY };
      const { fitScale, fitOffsetX, fitOffsetY } = getFitParams();
      const { scale, panX, panY } = viewState.current;
      // Base canvas coords (fit only)
      const cx = origX * fitScale + fitOffsetX;
      const cy = origY * fitScale + fitOffsetY;
      // Apply view zoom/pan (zoom around canvas center)
      const finalX = (cx - canvas.width / 2) * scale + canvas.width / 2 + panX;
      const finalY = (cy - canvas.height / 2) * scale + canvas.height / 2 + panY;
      return { x: finalX, y: finalY };
    },
    [getFitParams]
  );

  // Convert final canvas coords -> original image coords (inverse transform)
  const canvasToOrig = useCallback(
    (finalX: number, finalY: number): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: finalX, y: finalY };
      const { fitScale, fitOffsetX, fitOffsetY } = getFitParams();
      const { scale, panX, panY } = viewState.current;
      // Inverse of: finalX = (cx - cw/2) * scale + cw/2 + panX
      const cx = (finalX - canvas.width / 2 - panX) / scale + canvas.width / 2;
      const cy = (finalY - canvas.height / 2 - panY) / scale + canvas.height / 2;
      // Inverse of: cx = origX * fitScale + fitOffsetX
      const origX = (cx - fitOffsetX) / fitScale;
      const origY = (cy - fitOffsetY) / fitScale;
      return { x: origX, y: origY };
    },
    [getFitParams]
  );

  const redraw = useCallback(
    (
      boxes: BBox[],
      selectedIdx: number | null,
      hoveredIdx: number | null,
      dragBox?: { x: number; y: number; w: number; h: number } | null
    ) => {
      const canvas = canvasRef.current;
      const img = loadedImageRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (img && img.complete && img.naturalWidth > 0) {
        const { fitScale, fitOffsetX, fitOffsetY } = getFitParams();
        const { scale, panX, panY } = viewState.current;

        const displayW = img.naturalWidth * fitScale;
        const displayH = img.naturalHeight * fitScale;

        // Apply view transform: zoom around canvas center, then pan
        ctx.save();
        ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY);
        ctx.scale(scale, scale);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);

        ctx.drawImage(img, fitOffsetX, fitOffsetY, displayW, displayH);

        // Draw existing boxes (in base canvas coords, inside the transform)
        boxes.forEach((box, i) => {
          const tl = {
            x: box.x * fitScale + fitOffsetX,
            y: box.y * fitScale + fitOffsetY,
          };
          const br = {
            x: (box.x + box.w) * fitScale + fitOffsetX,
            y: (box.y + box.h) * fitScale + fitOffsetY,
          };
          const cw = br.x - tl.x;
          const ch = br.y - tl.y;

          const isSelected = i === selectedIdx;
          const isHovered = i === hoveredIdx;

          ctx.strokeStyle = isSelected ? "#ff00ff" : "#00f3ff";
          ctx.lineWidth = (isSelected || isHovered ? 2.5 : 2) / scale;
          ctx.fillStyle = isSelected
            ? "rgba(255,0,255,0.1)"
            : "rgba(0,243,255,0.1)";
          ctx.beginPath();
          ctx.rect(tl.x, tl.y, cw, ch);
          ctx.fill();
          ctx.stroke();

          // Only show delete button when scale is large enough to be clickable
          if ((isHovered || isSelected) && scale >= 0.5) {
            const btnSize = 14 / scale;
            const btnX = tl.x + cw - btnSize;
            const btnY = tl.y + 2 / scale;
            ctx.fillStyle = isSelected
              ? "rgba(255,0,255,0.8)"
              : "rgba(0,243,255,0.8)";
            ctx.beginPath();
            ctx.roundRect(btnX, btnY, btnSize, btnSize, 3 / scale);
            ctx.fill();
            ctx.fillStyle = "#000";
            ctx.font = `bold ${11 / scale}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("×", btnX + btnSize / 2, btnY + btnSize / 2);
            ctx.textAlign = "start";
            ctx.textBaseline = "alphabetic";
          }
        });

        ctx.restore();

        // Draw drag preview box in final canvas coords (outside transform)
        if (dragBox) {
          ctx.strokeStyle = "#00f3ff";
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.fillStyle = "rgba(0,243,255,0.05)";
          ctx.beginPath();
          ctx.rect(dragBox.x, dragBox.y, dragBox.w, dragBox.h);
          ctx.fill();
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    },
    [getFitParams]
  );

  const triggerRedraw = useCallback(
    (dragBox?: { x: number; y: number; w: number; h: number } | null) => {
      const name = currentImageNameRef.current;
      const boxes = annotationsRef.current[name] ?? [];
      redraw(boxes, selectedBoxIndexRef.current, hoveredBoxIndexRef.current, dragBox);
    },
    [redraw]
  );

  const currentImageName =
    images.length > 0 ? images[currentIndex]?.name ?? "" : "";
  const currentBoxes = annotations[currentImageName] ?? [];

  useEffect(() => {
    redraw(currentBoxes, selectedBoxIndex, hoveredBoxIndex, null);
  }, [currentBoxes, selectedBoxIndex, hoveredBoxIndex, redraw]);

  const loadImage = useCallback(
    (entry: ImageEntry) => {
      const img = new Image();
      img.onload = () => {
        loadedImageRef.current = img;
        currentImageNameRef.current = entry.name;
        // Reset view on image change
        viewState.current = { scale: 1, panX: 0, panY: 0 };
        setZoomDisplay(1);
        redraw(annotationsRef.current[entry.name] ?? [], null, null, null);
      };
      img.src = entry.src;
    },
    [redraw]
  );

  useEffect(() => {
    if (images.length > 0) {
      const entry = images[currentIndex];
      if (entry) {
        setSelectedBoxIndex(null);
        setHoveredBoxIndex(null);
        loadImage(entry);
      }
    } else {
      loadedImageRef.current = null;
      currentImageNameRef.current = "";
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [currentIndex, images, loadImage]);

  // ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const observer = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      triggerRedraw(null);
    });

    observer.observe(container);
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    return () => observer.disconnect();
  }, [triggerRedraw]);

  // Wheel event (must be non-passive to preventDefault)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Zoom around mouse position
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const vs = viewState.current;
      let newScale = vs.scale * factor;
      newScale = Math.max(0.2, Math.min(10, newScale));

      const cw = canvas.width;
      const ch = canvas.height;
      const baseCx = (mouseX - cw / 2 - vs.panX) / vs.scale + cw / 2;
      const baseCy = (mouseY - ch / 2 - vs.panY) / vs.scale + ch / 2;
      const newPanX = mouseX - (baseCx - cw / 2) * newScale - cw / 2;
      const newPanY = mouseY - (baseCy - ch / 2) * newScale - ch / 2;

      viewState.current = { scale: newScale, panX: newPanX, panY: newPanY };
      setZoomDisplay(Math.round(newScale * 10) / 10);
      triggerRedraw(null);
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [triggerRedraw]);

  // Shift key tracking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        isShiftDown.current = true;
        setCursorStyle(isPanning.current ? "grabbing" : "grab");
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const selIdx = selectedBoxIndexRef.current;
        if (selIdx !== null) {
          const name = currentImageNameRef.current;
          setAnnotations((prev) => {
            const existing = prev[name] ?? [];
            return {
              ...prev,
              [name]: existing.filter((_, i) => i !== selIdx),
            };
          });
          setSelectedBoxIndex(null);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        isShiftDown.current = false;
        setCursorStyle("crosshair");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const getCanvasPos = (
    e: React.MouseEvent<HTMLCanvasElement>
  ): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const hitTestDeleteButton = (
    box: BBox,
    cx: number,
    cy: number
  ): boolean => {
    const vs = viewState.current;
    if (vs.scale < 0.5) return false;
    const { fitScale, fitOffsetX, fitOffsetY } = getFitParams();
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const { scale, panX, panY } = vs;

    const tlBase = {
      x: box.x * fitScale + fitOffsetX,
      y: box.y * fitScale + fitOffsetY,
    };
    const brBase = {
      x: (box.x + box.w) * fitScale + fitOffsetX,
      y: (box.y + box.h) * fitScale + fitOffsetY,
    };
    // Final coords
    const tlF = {
      x: (tlBase.x - canvas.width / 2) * scale + canvas.width / 2 + panX,
      y: (tlBase.y - canvas.height / 2) * scale + canvas.height / 2 + panY,
    };
    const brF = {
      x: (brBase.x - canvas.width / 2) * scale + canvas.width / 2 + panX,
      y: (brBase.y - canvas.height / 2) * scale + canvas.height / 2 + panY,
    };
    const cw = brF.x - tlF.x;
    const btnSize = 14; // in final canvas coords (fixed pixel size)
    const btnX = tlF.x + cw - btnSize;
    const btnY = tlF.y + 2;
    return cx >= btnX && cx <= btnX + btnSize && cy >= btnY && cy <= btnY + btnSize;
  };

  const hitTestBox = (box: BBox, cx: number, cy: number): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const { fitScale, fitOffsetX, fitOffsetY } = getFitParams();
    const { scale, panX, panY } = viewState.current;

    const toFinal = (bx: number, by: number) => ({
      x: (bx * fitScale + fitOffsetX - canvas.width / 2) * scale + canvas.width / 2 + panX,
      y: (by * fitScale + fitOffsetY - canvas.height / 2) * scale + canvas.height / 2 + panY,
    });

    const tl = toFinal(box.x, box.y);
    const br = toFinal(box.x + box.w, box.y + box.h);
    return cx >= tl.x && cx <= br.x && cy >= tl.y && cy <= br.y;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (images.length === 0) return;
    const pos = getCanvasPos(e);

    // Double-click: reset zoom/pan
    if (e.detail === 2) {
      viewState.current = { scale: 1, panX: 0, panY: 0 };
      setZoomDisplay(1);
      triggerRedraw(null);
      return;
    }

    // Shift: start panning
    if (isShiftDown.current) {
      isPanning.current = true;
      panStart.current = pos;
      setCursorStyle("grabbing");
      return;
    }

    const boxes = annotationsRef.current[currentImageName] ?? [];

    // Check delete buttons
    for (let i = boxes.length - 1; i >= 0; i--) {
      if (hitTestDeleteButton(boxes[i], pos.x, pos.y)) {
        const newBoxes = boxes.filter((_, idx) => idx !== i);
        setAnnotations((prev) => ({
          ...prev,
          [currentImageName]: newBoxes,
        }));
        setSelectedBoxIndex(null);
        return;
      }
    }

    // Check box selection
    for (let i = boxes.length - 1; i >= 0; i--) {
      if (hitTestBox(boxes[i], pos.x, pos.y)) {
        setSelectedBoxIndex(i);
        return;
      }
    }

    // Start drawing
    setSelectedBoxIndex(null);
    isDrawing.current = true;
    drawStart.current = pos;
    drawCurrent.current = pos;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e);

    if (isPanning.current && panStart.current) {
      const dx = pos.x - panStart.current.x;
      const dy = pos.y - panStart.current.y;
      viewState.current.panX += dx;
      viewState.current.panY += dy;
      panStart.current = pos;
      triggerRedraw(null);
      return;
    }

    if (isDrawing.current && drawStart.current) {
      drawCurrent.current = pos;
      const x = Math.min(drawStart.current.x, pos.x);
      const y = Math.min(drawStart.current.y, pos.y);
      const w = Math.abs(pos.x - drawStart.current.x);
      const h = Math.abs(pos.y - drawStart.current.y);
      triggerRedraw({ x, y, w, h });
      return;
    }

    // Hover detection
    const boxes = annotationsRef.current[currentImageName] ?? [];
    let hovered: number | null = null;
    for (let i = boxes.length - 1; i >= 0; i--) {
      if (hitTestBox(boxes[i], pos.x, pos.y)) {
        hovered = i;
        break;
      }
    }
    if (hovered !== hoveredBoxIndexRef.current) {
      setHoveredBoxIndex(hovered);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning.current) {
      isPanning.current = false;
      panStart.current = null;
      setCursorStyle(isShiftDown.current ? "grab" : "crosshair");
      return;
    }

    if (!isDrawing.current || !drawStart.current) {
      isDrawing.current = false;
      return;
    }

    const pos = getCanvasPos(e);
    const dx = Math.abs(pos.x - drawStart.current.x);
    const dy = Math.abs(pos.y - drawStart.current.y);

    if (dx < 4 || dy < 4) {
      isDrawing.current = false;
      drawStart.current = null;
      drawCurrent.current = null;
      triggerRedraw(null);
      return;
    }

    // Convert final canvas coords to original image coords
    const tlFinal = {
      x: Math.min(drawStart.current.x, pos.x),
      y: Math.min(drawStart.current.y, pos.y),
    };
    const brFinal = {
      x: Math.max(drawStart.current.x, pos.x),
      y: Math.max(drawStart.current.y, pos.y),
    };

    const tl = canvasToOrig(tlFinal.x, tlFinal.y);
    const br = canvasToOrig(brFinal.x, brFinal.y);
    const img = loadedImageRef.current;

    if (img) {
      const x = Math.max(0, Math.round(tl.x));
      const y = Math.max(0, Math.round(tl.y));
      const w = Math.min(
        img.naturalWidth - x,
        Math.round(br.x - tl.x)
      );
      const h = Math.min(
        img.naturalHeight - y,
        Math.round(br.y - tl.y)
      );

      if (w > 0 && h > 0) {
        const newBox: BBox = { x, y, w, h };
        setAnnotations((prev) => {
          const existing = prev[currentImageName] ?? [];
          return {
            ...prev,
            [currentImageName]: [...existing, newBox],
          };
        });
      }
    }

    isDrawing.current = false;
    drawStart.current = null;
    drawCurrent.current = null;
    triggerRedraw(null);
  };

  const handleMouseLeave = () => {
    if (isPanning.current) {
      isPanning.current = false;
      panStart.current = null;
    }
    if (isDrawing.current) {
      isDrawing.current = false;
      drawStart.current = null;
      drawCurrent.current = null;
      triggerRedraw(null);
    }
    setHoveredBoxIndex(null);
    setCursorStyle(isShiftDown.current ? "grab" : "crosshair");
  };

  const handleLoadImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newEntries: ImageEntry[] = [];
    Array.from(files).forEach((file) => {
      const src = URL.createObjectURL(file);
      newEntries.push({ name: file.name, src });
    });
    setImages((prev) => {
      const existingNames = new Set(prev.map((i) => i.name));
      const filtered = newEntries.filter((entry) => !existingNames.has(entry.name));
      return [...prev, ...filtered];
    });
    if (images.length === 0 && newEntries.length > 0) {
      setCurrentIndex(0);
    }
    e.target.value = "";
  };

  const exportJSON = (imageName: string) => {
    const boxes = annotations[imageName] ?? [];
    const data = {
      image: imageName,
      total: boxes.length,
      singles: boxes.map((b) => ({ x: b.x, y: b.y, w: b.w, h: b.h })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const baseName = imageName.replace(/\.[^.]+$/, "");
    a.download = `${baseName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAll = async () => {
    const annotated = images.filter(
      (img) => (annotations[img.name] ?? []).length > 0
    );
    if (annotated.length === 0) return;
    for (let i = 0; i < annotated.length; i++) {
      exportJSON(annotated[i].name);
      await new Promise((r) => setTimeout(r, 150));
    }
  };

  const singleInputRef = useRef<HTMLInputElement>(null);


  const annotatedCount = images.filter(
    (img) => (annotations[img.name] ?? []).length > 0
  ).length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        width: "100vw",
        position: "relative",
        left: "50%",
        transform: "translateX(-50%)",
        padding: "0 1.5rem",
        boxSizing: "border-box",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "8px",
          padding: "0.6rem 0.75rem",
        }}
      >
        <input
          ref={singleInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={handleLoadImages}
        />

        <button
          onClick={() => singleInputRef.current?.click()}
          style={btnStyle}
        >
          載入圖片
        </button>
        <button
          onClick={() => {
            const el = document.createElement("input");
            el.type = "file";
            el.accept = "image/*";
            el.multiple = true;
            (el as any).webkitdirectory = true;
            el.onchange = (e) => handleLoadImages(e as any);
            el.click();
          }}
          style={btnStyle}
        >
          載入資料夾
        </button>

        <div
          style={{
            width: "1px",
            height: "24px",
            background: "rgba(255,255,255,0.15)",
            margin: "0 0.25rem",
          }}
        />

        <button
          onClick={() => currentImageName && exportJSON(currentImageName)}
          style={{ ...btnStyle, opacity: currentImageName ? 1 : 0.4 }}
          disabled={!currentImageName}
        >
          匯出 JSON
        </button>
        <button
          onClick={exportAll}
          style={{ ...btnStyle, opacity: annotatedCount > 0 ? 1 : 0.4 }}
          disabled={annotatedCount === 0}
        >
          匯出全部 ({annotatedCount})
        </button>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: "1rem",
            fontSize: "0.85rem",
            opacity: 0.8,
            alignItems: "center",
          }}
        >
          {currentImageName && (
            <>
              <span
                style={{
                  maxWidth: "200px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={currentImageName}
              >
                {currentImageName}
              </span>
              <span style={{ color: "#00f3ff" }}>框數: {currentBoxes.length}</span>
            </>
          )}
          <span
            style={{
              color: "#adf",
              background: "rgba(100,200,255,0.08)",
              border: "1px solid rgba(100,200,255,0.2)",
              borderRadius: "4px",
              padding: "0.1rem 0.45rem",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
            title="雙擊畫布重置縮放"
          >
            縮放: {zoomDisplay.toFixed(1)}x
          </span>
        </div>
      </div>

      {/* Main layout */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          height: "calc(100vh - 200px)",
          minHeight: "600px",
        }}
      >
        {/* Left sidebar */}
        <div
          style={{
            width: "200px",
            flexShrink: 0,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {images.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                opacity: 0.4,
                fontSize: "0.8rem",
                textAlign: "center",
                padding: "1rem",
              }}
            >
              尚未載入圖片
            </div>
          ) : (
            images.map((img, i) => {
              const boxCount = (annotations[img.name] ?? []).length;
              const isActive = i === currentIndex;
              return (
                <button
                  key={img.name}
                  onClick={() => setCurrentIndex(i)}
                  style={{
                    background: isActive
                      ? "rgba(0,243,255,0.1)"
                      : "transparent",
                    border: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    borderLeft: isActive
                      ? "2px solid #00f3ff"
                      : "2px solid transparent",
                    color: isActive ? "#00f3ff" : "inherit",
                    padding: "0.5rem 0.6rem",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: "0.78rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    width: "100%",
                  }}
                >
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "172px",
                    }}
                    title={img.name}
                  >
                    {img.name}
                  </span>
                  {boxCount > 0 && (
                    <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>
                      {boxCount} 個標注
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Canvas area */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {images.length === 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                opacity: 0.45,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  border: "2px dashed rgba(255,255,255,0.3)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                }}
              >
                🖼
              </div>
              <p style={{ margin: 0, fontSize: "0.9rem" }}>
                點擊「載入圖片」或「載入資料夾」
              </p>
            </div>
          )}
          <canvas
            ref={canvasRef}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              userSelect: "none",
              cursor: images.length > 0 ? cursorStyle : "default",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          />
        </div>
      </div>

      {/* Hints row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.78rem",
          opacity: 0.5,
          gap: "1rem",
        }}
      >
        <span>滾輪 縮放 | Shift+拖曳 平移 | 雙擊 重置視圖</span>
        {selectedBoxIndex !== null && currentBoxes[selectedBoxIndex] && (
          <span style={{ opacity: 0.8, color: "#ff88ff" }}>
            已選框 #{selectedBoxIndex + 1} — x:{currentBoxes[selectedBoxIndex].x}{" "}
            y:{currentBoxes[selectedBoxIndex].y} w:{currentBoxes[selectedBoxIndex].w}{" "}
            h:{currentBoxes[selectedBoxIndex].h} | 按 Delete 刪除
          </span>
        )}
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "6px",
  color: "inherit",
  padding: "0.35rem 0.75rem",
  fontSize: "0.85rem",
  cursor: "pointer",
  transition: "background 0.15s",
  whiteSpace: "nowrap",
};
