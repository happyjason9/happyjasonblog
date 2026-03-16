"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import styles from "./ImageCompareTool.module.css";

const MAG_R = 120;
const ZOOM_INIT = 3.0;

interface ImageFile {
  name: string;
  url: string;
  naturalWidth: number;
  naturalHeight: number;
}

interface FolderState {
  files: ImageFile[];
  selected: number;
}

export default function ImageCompareTool() {
  const canvasLRef   = useRef<HTMLCanvasElement>(null);
  const canvasRRef   = useRef<HTMLCanvasElement>(null);
  const magLDomRef   = useRef<HTMLCanvasElement>(null);
  const magRDomRef   = useRef<HTMLCanvasElement>(null);
  const imgLRef      = useRef<HTMLImageElement | null>(null);
  const imgRRef      = useRef<HTMLImageElement | null>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const mousePosRef       = useRef<{ origX: number; origY: number } | null>(null);
  const rafRef            = useRef<number | null>(null);
  const zoomRef           = useRef(ZOOM_INIT);
  const renderMagRef      = useRef<() => void>(() => {}); // 穩定的 ref 指向最新 renderMagnifiers

  const [folderL, setFolderL] = useState<FolderState | null>(null);
  const [folderR, setFolderR] = useState<FolderState | null>(null);
  const [imgScale, setImgScale]   = useState(1.0);
  const [zoomFactor, setZoomFactor] = useState(ZOOM_INIT); // 只用於 UI 顯示
  const [showMag, setShowMag]     = useState(false);
  const [draggingOver, setDraggingOver] = useState<"left" | "right" | null>(null);

  const imgLState = folderL?.files[folderL.selected] ?? null;
  const imgRState = folderR?.files[folderR.selected] ?? null;

  // ── 載入圖片清單 ─────────────────────────────────────────────
  const loadFiles = async (files: FileList, side: "left" | "right") => {
    const imageFiles = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (!imageFiles.length) return;

    const loaded: ImageFile[] = await Promise.all(
      imageFiles.map((f) =>
        new Promise<ImageFile>((resolve) => {
          const url = URL.createObjectURL(f);
          const img = new Image();
          img.onload = () => resolve({ name: f.name, url, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
          img.src = url;
        })
      )
    );
    if (side === "left") setFolderL({ files: loaded, selected: 0 });
    else                 setFolderR({ files: loaded, selected: 0 });
  };

  // ── 更新 imgRef ──────────────────────────────────────────────
  useEffect(() => {
    if (!imgLState) { imgLRef.current = null; return; }
    const img = new Image();
    img.onload = () => { imgLRef.current = img; drawCanvas(); };
    img.src = imgLState.url;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgLState]);

  useEffect(() => {
    if (!imgRState) { imgRRef.current = null; return; }
    const img = new Image();
    img.onload = () => { imgRRef.current = img; drawCanvas(); };
    img.src = imgRState.url;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgRState]);

  // ── 畫主 Canvas ──────────────────────────────────────────────
  const drawCanvas = useCallback(() => {
    const cl = canvasLRef.current;
    const cr = canvasRRef.current;
    if (!cl || !cr) return;
    const ctxL = cl.getContext("2d")!;
    const ctxR = cr.getContext("2d")!;

    const placeholder = (ctx: CanvasRenderingContext2D, c: HTMLCanvasElement, label: string) => {
      c.width = 640; c.height = 420;
      ctx.fillStyle = "#0d1117";
      ctx.fillRect(0, 0, 640, 420);
      ctx.fillStyle = "#30363d";
      ctx.font = "14px monospace";
      ctx.textAlign = "center";
      ctx.fillText(label, 320, 210);
    };

    if (imgLRef.current && imgLState) {
      const dw = Math.round(imgLState.naturalWidth * imgScale);
      const dh = Math.round(imgLState.naturalHeight * imgScale);
      cl.width = dw; cl.height = dh;
      ctxL.drawImage(imgLRef.current, 0, 0, dw, dh);
    } else {
      placeholder(ctxL, cl, "從上方選擇圖片 A");
    }

    if (imgRRef.current && imgRState) {
      const baseW = imgLState ? imgLState.naturalWidth : imgRState.naturalWidth;
      const baseH = imgLState ? imgLState.naturalHeight : imgRState.naturalHeight;
      const dw = Math.round(baseW * imgScale);
      const dh = Math.round(baseH * imgScale);
      cr.width = dw; cr.height = dh;
      ctxR.drawImage(imgRRef.current, 0, 0, dw, dh);
    } else {
      placeholder(ctxR, cr, "從上方選擇圖片 B");
    }
  }, [imgLState, imgRState, imgScale]);

  useEffect(() => { drawCanvas(); }, [drawCanvas]);

  // ── 放大鏡繪製 ───────────────────────────────────────────────
  const renderMagnifiers = useCallback(() => {
    const pos = mousePosRef.current;
    const ml  = magLDomRef.current;
    const mr_ = magRDomRef.current;
    if (!ml || !mr_ || !pos || !imgLState) return;

    const magSize = MAG_R * 2;
    [ml, mr_].forEach((c) => { c.width = magSize; c.height = magSize; });
    const ctxML = ml.getContext("2d")!;
    const ctxMR = mr_.getContext("2d")!;

    const { origX, origY } = pos;
    const zoom = zoomRef.current;
    const zr   = Math.max(10, Math.round(MAG_R / zoom));
    const srcW = imgLState.naturalWidth;
    const srcH = imgLState.naturalHeight;

    const xmin = Math.max(0, origX - zr);
    const ymin = Math.max(0, origY - zr);
    const xmax = Math.min(srcW, origX + zr);
    const ymax = Math.min(srcH, origY + zr);
    const sw = xmax - xmin, sh = ymax - ymin;
    const dxo = ((zr - (origX - xmin)) / (zr * 2)) * magSize;
    const dyo = ((zr - (origY - ymin)) / (zr * 2)) * magSize;
    const dw2 = (sw / (zr * 2)) * magSize;
    const dh2 = (sh / (zr * 2)) * magSize;

    const drawMag = (ctx: CanvasRenderingContext2D, imgEl: HTMLImageElement | null) => {
      ctx.clearRect(0, 0, magSize, magSize);
      ctx.save();
      const p = new Path2D(); p.arc(MAG_R, MAG_R, MAG_R, 0, Math.PI * 2); ctx.clip(p);
      ctx.fillStyle = "#111"; ctx.fillRect(0, 0, magSize, magSize);
      if (imgEl) ctx.drawImage(imgEl, xmin, ymin, sw, sh, dxo, dyo, dw2, dh2);
      ctx.restore();
      ctx.strokeStyle = "rgba(0,243,255,0.85)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(MAG_R, MAG_R, MAG_R - 1, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = "rgba(0,255,100,0.9)"; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(MAG_R - 12, MAG_R); ctx.lineTo(MAG_R + 12, MAG_R);
      ctx.moveTo(MAG_R, MAG_R - 12); ctx.lineTo(MAG_R, MAG_R + 12);
      ctx.stroke();
      ctx.fillStyle = "rgba(0,243,255,0.9)"; ctx.font = "bold 12px monospace";
      ctx.fillText(`x${zoom.toFixed(1)}`, 6, 18);
    };

    drawMag(ctxML, imgLRef.current);
    drawMag(ctxMR, imgRRef.current);
  }, [imgLState]);

  // renderMagnifiers 更新時同步到 ref，讓 wheel handler 永遠拿到最新版本
  useEffect(() => { renderMagRef.current = renderMagnifiers; }, [renderMagnifiers]);

  const updateMagPosition = useCallback(() => {
    const pos = mousePosRef.current;
    const cl  = canvasLRef.current;
    const cr  = canvasRRef.current;
    const ml  = magLDomRef.current;
    const mr_ = magRDomRef.current;
    if (!pos || !cl || !cr || !ml || !mr_) return;

    const clRect = cl.getBoundingClientRect();
    const crRect = cr.getBoundingClientRect();
    const dispXL = (pos.origX / cl.width) * clRect.width;
    const dispYL = (pos.origY / cl.height) * clRect.height;
    const dispXR = (pos.origX / (cr.width  || cl.width))  * crRect.width;
    const dispYR = (pos.origY / (cr.height || cl.height)) * crRect.height;

    const cx = (x: number, w: number) => Math.max(MAG_R, Math.min(w - MAG_R, x));
    const cy = (y: number, h: number) => Math.max(MAG_R, Math.min(h - MAG_R, y - MAG_R - 10));

    ml.style.left  = `${cx(dispXL, clRect.width)  - MAG_R}px`;
    ml.style.top   = `${cy(dispYL, clRect.height) - MAG_R}px`;
    mr_.style.left = `${cx(dispXR, crRect.width)  - MAG_R}px`;
    mr_.style.top  = `${cy(dispYR, crRect.height) - MAG_R}px`;
  }, []);

  // ── 滑鼠事件 ────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const cl = canvasLRef.current;
    const cr = canvasRRef.current;
    if (!cl || !cr) return;
    const clRect = cl.getBoundingClientRect();
    const crRect = cr.getBoundingClientRect();
    let origX: number, origY: number;
    if (e.target === cl) {
      origX = ((e.clientX - clRect.left) / clRect.width)  * cl.width;
      origY = ((e.clientY - clRect.top)  / clRect.height) * cl.height;
    } else if (e.target === cr) {
      origX = ((e.clientX - crRect.left) / crRect.width)  * cr.width;
      origY = ((e.clientY - crRect.top)  / crRect.height) * cr.height;
    } else return;

    mousePosRef.current = { origX: origX / imgScale, origY: origY / imgScale };
    updateMagPosition();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => renderMagRef.current());
  }, [imgScale, updateMagPosition]);

  const handleMouseLeave  = useCallback(() => { mousePosRef.current = null; setShowMag(false); }, []);
  const handleMouseEnter  = useCallback(() => setShowMag(true), []);

  useEffect(() => {
    const area = canvasAreaRef.current;
    if (!area) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const next = Math.max(1.0, Math.min(12.0, zoomRef.current - e.deltaY * 0.005));
      zoomRef.current = next;
      setZoomFactor(next); // 更新 UI 顯示
      // 立即重繪，不等下次 mousemove
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => renderMagRef.current());
    };
    area.addEventListener("wheel",      onWheel,          { passive: false });
    area.addEventListener("mousemove",  handleMouseMove);
    area.addEventListener("mouseleave", handleMouseLeave);
    area.addEventListener("mouseenter", handleMouseEnter);
    return () => {
      area.removeEventListener("wheel",      onWheel);
      area.removeEventListener("mousemove",  handleMouseMove);
      area.removeEventListener("mouseleave", handleMouseLeave);
      area.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [handleMouseMove, handleMouseLeave, handleMouseEnter]); // renderMagnifiers 透過 ref 存取，不需放 deps

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>

      {/* ── 頂部工具列 ── */}
      <div className={styles.toolbar}>
        {/* 左圖選擇區 */}
        <div
          className={`${styles.pickerGroup} ${draggingOver === "left" ? styles.dragOver : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDraggingOver("left"); }}
          onDragLeave={() => setDraggingOver(null)}
          onDrop={(e) => { e.preventDefault(); setDraggingOver(null); e.dataTransfer.files && loadFiles(e.dataTransfer.files, "left"); }}
        >
          <label className={styles.uploadBtn}>
            {folderL ? `A: ${folderL.files.length} 張` : "＋ 選擇圖片 A"}
            <input type="file" multiple accept="image/*" className={styles.fileInput}
              onChange={(e) => e.target.files && loadFiles(e.target.files, "left")} />
          </label>
          {folderL && (
            <select
              className={styles.select}
              value={folderL.selected}
              onChange={(e) => setFolderL((p) => p ? { ...p, selected: +e.target.value } : p)}
            >
              {folderL.files.map((f, i) => (
                <option key={i} value={i}>{f.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* 縮放控制（置中） */}
        <div className={styles.scaleControls}>
          <button className={styles.btn} onClick={() => setImgScale((s) => Math.min(3, +(s + 0.1).toFixed(1)))}>+</button>
          <span className={styles.scaleLabel}>{imgScale.toFixed(1)}x</span>
          <button className={styles.btn} onClick={() => setImgScale((s) => Math.max(0.1, +(s - 0.1).toFixed(1)))}>−</button>
          <span className={styles.zoomLabel}>🔍 {zoomFactor.toFixed(1)}x</span>
        </div>

        {/* 右圖選擇區 */}
        <div
          className={`${styles.pickerGroup} ${styles.pickerRight} ${draggingOver === "right" ? styles.dragOver : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDraggingOver("right"); }}
          onDragLeave={() => setDraggingOver(null)}
          onDrop={(e) => { e.preventDefault(); setDraggingOver(null); e.dataTransfer.files && loadFiles(e.dataTransfer.files, "right"); }}
        >
          {folderR && (
            <select
              className={styles.select}
              value={folderR.selected}
              onChange={(e) => setFolderR((p) => p ? { ...p, selected: +e.target.value } : p)}
            >
              {folderR.files.map((f, i) => (
                <option key={i} value={i}>{f.name}</option>
              ))}
            </select>
          )}
          <label className={styles.uploadBtn}>
            {folderR ? `B: ${folderR.files.length} 張` : "＋ 選擇圖片 B"}
            <input type="file" multiple accept="image/*" className={styles.fileInput}
              onChange={(e) => e.target.files && loadFiles(e.target.files, "right")} />
          </label>
        </div>
      </div>

      {/* ── Canvas 區（全寬） ── */}
      <div className={styles.canvasArea} ref={canvasAreaRef}>
        <div className={styles.canvasWrap}>
          <canvas ref={canvasLRef} className={styles.canvas} />
          <canvas ref={magLDomRef} className={styles.magnifier}
            style={{ display: showMag && !!imgLState ? "block" : "none" }} />
        </div>
        <div className={styles.divider} />
        <div className={styles.canvasWrap}>
          <canvas ref={canvasRRef} className={styles.canvas} />
          <canvas ref={magRDomRef} className={styles.magnifier}
            style={{ display: showMag && !!imgLState ? "block" : "none" }} />
        </div>
      </div>

      <p className={styles.hint}>在圖片上移動滑鼠以啟動同步放大鏡 · 滾輪調整放大鏡倍率</p>
    </div>
  );
}
