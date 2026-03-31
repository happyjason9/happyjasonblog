"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import styles from "./VideoEditor.module.css";

type Clip = {
  id: string;
  start: number;
  end: number;
};

type TextOverlay = {
  id: string;
  text: string;
  x: number;
  y: number;
  startTime: number; // 相對於導出後的時間（按 clip 順序累計）
  endTime: number;
  color: string;
  fontSize: number;
};

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 10);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${ms}`;
}

function uuid() {
  return Math.random().toString(36).slice(2);
}

export default function VideoEditor() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [clips, setClips] = useState<Clip[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [overlays, setOverlays] = useState<TextOverlay[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [playingClipIdx, setPlayingClipIdx] = useState(0);

  // 拖移排序
  const [draggingClipId, setDraggingClipId] = useState<string | null>(null);
  const [dragOverClipId, setDragOverClipId] = useState<string | null>(null);

  // 文字表單
  const [newText, setNewText] = useState("");
  const [newColor, setNewColor] = useState("#00f3ff");
  const [newFontSize, setNewFontSize] = useState(32);
  const [newStartTime, setNewStartTime] = useState(0);
  const [newEndTime, setNewEndTime] = useState(0);
  const [placingText, setPlacingText] = useState(false);

  // 計算 clips 總時長
  const totalDuration = clips.reduce((s, c) => s + (c.end - c.start), 0);

  // 目前 currentTime 對應的是原始影片時間，用來換算在 clips 中的位置
  const clipProgress = (() => {
    if (!duration || clips.length === 0) return 0;
    let acc = 0;
    for (const c of clips) {
      const d = c.end - c.start;
      if (currentTime >= c.start && currentTime <= c.end) {
        return (acc + (currentTime - c.start)) / totalDuration;
      }
      acc += d;
    }
    return 0;
  })();

  // canvas 文字疊加（用導出時間換算）
  const getExportTime = useCallback((videoTime: number) => {
    let acc = 0;
    for (const c of clips) {
      const d = c.end - c.start;
      if (videoTime >= c.start && videoTime <= c.end) {
        return acc + (videoTime - c.start);
      }
      acc += d;
    }
    return 0;
  }, [clips]);

  const drawOverlays = useCallback((videoTime: number) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (canvas.width !== (video.videoWidth || 640)) canvas.width = video.videoWidth || 640;
    if (canvas.height !== (video.videoHeight || 360)) canvas.height = video.videoHeight || 360;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const exportT = getExportTime(videoTime);
    overlays.forEach((ov) => {
      if (exportT >= ov.startTime && exportT <= ov.endTime) {
        ctx.font = `bold ${ov.fontSize}px Inter, sans-serif`;
        ctx.fillStyle = ov.color;
        ctx.shadowColor = ov.color;
        ctx.shadowBlur = 8;
        ctx.textAlign = "left";
        ctx.fillText(ov.text, (ov.x / 100) * canvas.width, (ov.y / 100) * canvas.height);
        ctx.shadowBlur = 0;
      }
    });
  }, [overlays, getExportTime]);

  // rAF 渲染迴圈
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;
    const loop = () => {
      setCurrentTime(video.currentTime);
      drawOverlays(video.currentTime);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [videoUrl, drawOverlays]);

  // 縮圖生成
  const generateThumbnails = useCallback(async (video: HTMLVideoElement, count: number) => {
    const offscreen = document.createElement("canvas");
    offscreen.width = 80; offscreen.height = 45;
    const ctx = offscreen.getContext("2d")!;
    const thumbs: string[] = [];
    for (let i = 0; i < count; i++) {
      video.currentTime = (video.duration / count) * i;
      await new Promise<void>((r) => video.addEventListener("seeked", () => r(), { once: true }));
      ctx.drawImage(video, 0, 0, 80, 45);
      thumbs.push(offscreen.toDataURL("image/jpeg", 0.6));
    }
    video.currentTime = 0;
    return thumbs;
  }, []);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("video/")) return;
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setOverlays([]);
    setThumbnails([]);
    setClips([]);
    setCurrentTime(0);
    setIsPlaying(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleVideoLoaded = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    const d = video.duration;
    setDuration(d);
    setClips([{ id: uuid(), start: 0, end: d }]);
    setNewEndTime(d);
    const count = Math.min(Math.ceil(d), 20);
    const thumbs = await generateThumbnails(video, count);
    setThumbnails(thumbs);
  }, [generateThumbnails]);

  // 播放（按 clips 順序）
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || clips.length === 0) return;
    if (video.paused) {
      // 找目前所在 clip，繼續從當前位置播放
      let idx = clips.findIndex((c) => currentTime >= c.start && currentTime <= c.end);
      if (idx < 0) idx = 0;
      setPlayingClipIdx(idx);
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // 自動跳至下一 clip
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isPlaying || clips.length === 0) return;
    const check = () => {
      const clip = clips[playingClipIdx];
      if (!clip) return;
      if (video.currentTime >= clip.end) {
        const next = playingClipIdx + 1;
        if (next < clips.length) {
          video.currentTime = clips[next].start;
          setPlayingClipIdx(next);
        } else {
          video.pause();
          setIsPlaying(false);
        }
      }
    };
    video.addEventListener("timeupdate", check);
    return () => video.removeEventListener("timeupdate", check);
  }, [isPlaying, clips, playingClipIdx]);

  // 將時間軸 x 位置換算成原始影片 currentTime
  const xToVideoTime = useCallback((clientX: number) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect || totalDuration === 0) return null;
    const ratio = Math.max(0, Math.min((clientX - rect.left) / rect.width, 1));
    let targetExportTime = ratio * totalDuration;
    let acc = 0;
    for (const c of clips) {
      const d = c.end - c.start;
      if (targetExportTime <= acc + d) {
        return c.start + (targetExportTime - acc);
      }
      acc += d;
    }
    return null;
  }, [clips, totalDuration]);

  // 播放頭拖曳（mousedown → mousemove 即時跟隨 → mouseup 結束）
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const seekTo = (clientX: number) => {
      const t = xToVideoTime(clientX);
      if (t !== null && videoRef.current) videoRef.current.currentTime = t;
    };
    seekTo(e.clientX);
    const onMove = (mv: MouseEvent) => seekTo(mv.clientX);
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // 剪切：在 currentTime 處把當前 clip 一分為二
  const handleCut = () => {
    const t = currentTime;
    setClips((prev) => {
      const idx = prev.findIndex((c) => t > c.start && t < c.end);
      if (idx < 0) return prev;
      const clip = prev[idx];
      const a: Clip = { id: uuid(), start: clip.start, end: t };
      const b: Clip = { id: uuid(), start: t, end: clip.end };
      return [...prev.slice(0, idx), a, b, ...prev.slice(idx + 1)];
    });
  };

  // 刪除片段
  const handleDeleteClip = (id: string) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
  };

  // 拖移排序
  const handleClipDragStart = (id: string) => setDraggingClipId(id);
  const handleClipDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverClipId(id);
  };
  const handleClipDrop = (targetId: string) => {
    if (!draggingClipId || draggingClipId === targetId) return;
    setClips((prev) => {
      const from = prev.findIndex((c) => c.id === draggingClipId);
      const to = prev.findIndex((c) => c.id === targetId);
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDraggingClipId(null);
    setDragOverClipId(null);
  };

  // 點 Canvas 設定文字位置
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!placingText || !newText.trim()) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOverlays((prev) => [...prev, {
      id: uuid(), text: newText, x, y,
      startTime: newStartTime, endTime: newEndTime,
      color: newColor, fontSize: newFontSize,
    }]);
    setPlacingText(false);
    setNewText("");
  };

  // 導出
  const handleExport = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || clips.length === 0) return;
    setExporting(true);
    setExportProgress(0);

    const stream = (canvas as HTMLCanvasElement & { captureStream: (fps: number) => MediaStream }).captureStream(30);
    // 優先嘗試 MP4（Chrome 130+、Safari 支援），否則退回 WebM
    const mimeOptions = [
      "video/mp4;codecs=avc1,mp4a.40.2",
      "video/mp4;codecs=avc1",
      "video/mp4",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];
    const mimeType = mimeOptions.find((m) => MediaRecorder.isTypeSupported(m)) ?? "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ext = mimeType.startsWith("video/mp4") ? "mp4" : "webm";
      a.href = url; a.download = `edited-video.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      setExporting(false);
      setExportProgress(0);
    };

    recorder.start(100);
    let totalElapsed = 0;

    for (let i = 0; i < clips.length; i++) {
      const c = clips[i];
      video.currentTime = c.start;
      await new Promise<void>((r) => video.addEventListener("seeked", () => r(), { once: true }));
      await video.play();
      await new Promise<void>((resolve) => {
        const d = c.end - c.start;
        const clipStart = Date.now();
        const tick = setInterval(() => {
          const elapsed = (Date.now() - clipStart) / 1000;
          totalElapsed = clips.slice(0, i).reduce((s, cl) => s + cl.end - cl.start, 0) + elapsed;
          setExportProgress(Math.min(totalElapsed / totalDuration, 0.99));
          if (video.currentTime >= c.end || elapsed >= d) {
            clearInterval(tick);
            video.pause();
            resolve();
          }
        }, 100);
      });
    }

    recorder.stop();
    setExportProgress(1);
    setIsPlaying(false);
  };

  return (
    <div className={styles.editor}>
      {/* 上傳區 */}
      {!videoUrl && (
        <div
          className={`${styles.uploadZone} ${dragOver ? styles.dragOver : ""}`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className={styles.uploadIcon}>🎬</div>
          <p className={styles.uploadTitle}>拖曳影片至此，或點擊上傳</p>
          <p className={styles.uploadHint}>支援 MP4、MOV、WebM、AVI</p>
          <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileInput} style={{ display: "none" }} />
        </div>
      )}

      {videoUrl && (
        <>
          <div className={styles.workspace}>
            {/* 預覽 */}
            <div className={styles.previewSection}>
              <div className={styles.previewWrapper}>
                <video ref={videoRef} src={videoUrl} onLoadedMetadata={handleVideoLoaded} style={{ display: "none" }} playsInline />
                <canvas
                  ref={canvasRef}
                  className={`${styles.previewCanvas} ${placingText ? styles.placing : ""}`}
                  onClick={handleCanvasClick}
                  title={placingText ? "點擊設定文字位置" : undefined}
                />
                {placingText && <div className={styles.placingHint}>點擊畫面放置文字</div>}
              </div>

              {/* 播放控制 */}
              <div className={styles.controls}>
                <button className={styles.ctrlBtn} onClick={() => {
                  if (videoRef.current && clips[0]) videoRef.current.currentTime = clips[0].start;
                }}>⏮</button>
                <button className={styles.playBtn} onClick={togglePlay}>
                  {isPlaying ? "⏸" : "▶"}
                </button>
                <span className={styles.timeDisplay}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                <button
                  className={styles.cutBtn}
                  onClick={handleCut}
                  title="在目前位置剪切"
                  disabled={clips.every(c => !(currentTime > c.start && currentTime < c.end))}
                >
                  ✂ 剪切
                </button>
              </div>
            </div>

            {/* 文字疊加面板 */}
            <div className={`glass-panel ${styles.overlayPanel}`}>
              <h3 className={styles.panelTitle}>文字疊加</h3>
              <div className={styles.overlayForm}>
                <input className={styles.textInput} placeholder="輸入文字..." value={newText} onChange={(e) => setNewText(e.target.value)} />
                <div className={styles.formRow}>
                  <label>顏色</label>
                  <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className={styles.colorInput} />
                </div>
                <div className={styles.formRow}>
                  <label>大小</label>
                  <input type="range" min={16} max={80} value={newFontSize} onChange={(e) => setNewFontSize(Number(e.target.value))} className={styles.rangeInput} />
                  <span>{newFontSize}px</span>
                </div>
                <div className={styles.formRow}>
                  <label>出現</label>
                  <input type="number" min={0} max={totalDuration} step={0.1} value={newStartTime} onChange={(e) => setNewStartTime(Number(e.target.value))} className={styles.timeInput} />
                  <label>消失</label>
                  <input type="number" min={0} max={totalDuration} step={0.1} value={newEndTime} onChange={(e) => setNewEndTime(Number(e.target.value))} className={styles.timeInput} />
                </div>
                <button
                  className={`${styles.addTextBtn} ${placingText ? styles.placing : ""}`}
                  onClick={() => newText.trim() && setPlacingText(!placingText)}
                  disabled={!newText.trim()}
                >
                  {placingText ? "取消放置" : "點擊畫面放置"}
                </button>
              </div>
              <div className={styles.overlayList}>
                {overlays.length === 0 && <p className={styles.emptyHint}>尚無文字疊加</p>}
                {overlays.map((ov) => (
                  <div key={ov.id} className={styles.overlayItem}>
                    <span style={{ color: ov.color, fontWeight: 700 }}>{ov.text}</span>
                    <span className={styles.overlayTime}>{formatTime(ov.startTime)}–{formatTime(ov.endTime)}</span>
                    <button className={styles.deleteBtn} onClick={() => setOverlays((p) => p.filter((o) => o.id !== ov.id))}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 時間軸 */}
          <div className={`glass-panel ${styles.timelineSection}`}>
            <div className={styles.timelineLabel}>
              影片軌
              <span className={styles.timelineHint}>（可拖移片段調整順序，✕ 刪除）</span>
            </div>

            {/* 片段排序區 */}
            <div className={styles.clipsRow}>
              {clips.map((clip) => {
                const d = clip.end - clip.start;
                const widthPct = totalDuration > 0 ? (d / totalDuration) * 100 : 0;
                const thumbIdx = duration > 0 ? Math.round((clip.start / duration) * (thumbnails.length - 1)) : 0;
                return (
                  <div
                    key={clip.id}
                    className={`${styles.clipBlock} ${draggingClipId === clip.id ? styles.dragging : ""} ${dragOverClipId === clip.id ? styles.dragTarget : ""}`}
                    style={{ width: `${widthPct}%` }}
                    draggable
                    onDragStart={() => handleClipDragStart(clip.id)}
                    onDragOver={(e) => handleClipDragOver(e, clip.id)}
                    onDrop={() => handleClipDrop(clip.id)}
                    onDragEnd={() => { setDraggingClipId(null); setDragOverClipId(null); }}
                  >
                    {thumbnails[thumbIdx] && (
                      <img src={thumbnails[thumbIdx]} alt="" className={styles.clipThumb} draggable={false} />
                    )}
                    <div className={styles.clipInfo}>
                      <span className={styles.clipDuration}>{formatTime(d)}</span>
                    </div>
                    <button className={styles.clipDelete} onClick={() => handleDeleteClip(clip.id)} title="刪除此片段">✕</button>
                  </div>
                );
              })}
            </div>

            {/* 時間軸（播放頭 + 點擊跳轉） */}
            <div
              className={styles.timeline}
              ref={timelineRef}
              onMouseDown={handleTimelineMouseDown}
            >
              <div className={styles.thumbnailStrip}>
                {clips.map((clip) => {
                  const d = clip.end - clip.start;
                  const widthPct = totalDuration > 0 ? (d / totalDuration) * 100 : 0;
                  const count = Math.max(1, Math.round((d / duration) * thumbnails.length));
                  const startThumbIdx = Math.round((clip.start / duration) * thumbnails.length);
                  return (
                    <div key={clip.id} className={styles.clipStrip} style={{ width: `${widthPct}%` }}>
                      {Array.from({ length: count }).map((_, i) => {
                        const idx = Math.min(startThumbIdx + Math.round((i / count) * Math.round((d / duration) * thumbnails.length)), thumbnails.length - 1);
                        return thumbnails[idx] ? (
                          <img key={i} src={thumbnails[idx]} alt="" className={styles.thumbnail} draggable={false} />
                        ) : null;
                      })}
                    </div>
                  );
                })}
              </div>
              <div className={styles.playhead} style={{ left: `${clipProgress * 100}%` }} />
            </div>

            {/* 文字軌 */}
            {overlays.length > 0 && (
              <>
                <div className={styles.timelineLabel}>文字軌</div>
                <div className={styles.textTrack}>
                  {overlays.map((ov) => (
                    <div key={ov.id} className={styles.textBlock} style={{
                      left: `${(ov.startTime / totalDuration) * 100}%`,
                      width: `${((ov.endTime - ov.startTime) / totalDuration) * 100}%`,
                      backgroundColor: ov.color + "44",
                      borderColor: ov.color,
                    }}>
                      <span style={{ color: ov.color }}>{ov.text}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 導出區 */}
          <div className={styles.exportBar}>
            <div className={styles.trimInfo}>
              {clips.length} 個片段 · 總長 {formatTime(totalDuration)}
            </div>
            <div className={styles.exportActions}>
              <button className={styles.changeVideoBtn} onClick={() => { setVideoUrl(""); setThumbnails([]); setOverlays([]); setClips([]); }}>換片</button>
              <button className={styles.exportBtn} onClick={handleExport} disabled={exporting || clips.length === 0}>
                {exporting ? `導出中 ${Math.round(exportProgress * 100)}%` : "導出影片 ↓"}
              </button>
            </div>
            {exporting && (
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${exportProgress * 100}%` }} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
