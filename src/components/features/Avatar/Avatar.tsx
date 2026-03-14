"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./Avatar.module.css";

type Particle = { id: number; angle: number; color: string; distance: number };

export default function Avatar() {
  const [isClicked, setIsClicked] = useState(false);
  const [message, setMessage] = useState("");
  const [particles, setParticles] = useState<Particle[]>([]);
  const leftEyeRef = useRef<SVGCircleElement>(null);
  const rightEyeRef = useRef<SVGCircleElement>(null);
  const leftPupilRef = useRef<SVGCircleElement>(null);
  const rightPupilRef = useRef<SVGCircleElement>(null);

  const messages = [
    "嗨！我是你的專屬導覽員 🤖",
    "點雲特效好玩嗎？✨",
    "我的眼睛會跟著你轉喔 👀",
    "歡迎來到超現代玻璃宇宙！🚀",
    "需要幫忙嗎？雖然我也幫不上忙 😜",
  ];

  useEffect(() => {
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      animationFrameId = requestAnimationFrame(() => {
        const updatePupil = (eye: SVGCircleElement | null, pupil: SVGCircleElement | null, baseX: number, baseY: number) => {
          if (!eye || !pupil) return;
          const rect = eye.getBoundingClientRect();
          const eyeCenterX = rect.left + rect.width / 2;
          const eyeCenterY = rect.top + rect.height / 2;

          const angle = Math.atan2(e.clientY - eyeCenterY, e.clientX - eyeCenterX);
          const maxOffset = 6;
          let offsetX = Math.cos(angle) * maxOffset;
          let offsetY = Math.sin(angle) * maxOffset;

          const distance = Math.sqrt(Math.pow(e.clientX - eyeCenterX, 2) + Math.pow(e.clientY - eyeCenterY, 2));
          if (distance < 20) {
            offsetX = 0;
            offsetY = 0;
          }

          pupil.setAttribute("cx", (baseX + offsetX).toString());
          pupil.setAttribute("cy", (baseY + offsetY).toString());
        };

        updatePupil(leftEyeRef.current, leftPupilRef.current, 40, 37);
        updatePupil(rightEyeRef.current, rightPupilRef.current, 60, 37);
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  const handleClick = () => {
    if (isClicked) return;
    setIsClicked(true);
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    setMessage(randomMsg);

    // 粒子爆炸效果
    const newParticles: Particle[] = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      angle: (i / 12) * 360,
      color: i % 2 === 0 ? "var(--accent-cyan)" : "var(--accent-magenta)",
      distance: 40 + Math.random() * 25,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 800);

    setTimeout(() => {
      setIsClicked(false);
      setMessage("");
    }, 3000);
  };

  return (
    <div className={styles.avatarContainer}>
      {/* 說話泡泡 */}
      <div className={`${styles.speechBubble} ${message ? styles.showBubble : ""}`}>
        {message}
      </div>

      {/* 粒子爆炸 */}
      {particles.map((p) => {
        const tx = Math.cos((p.angle * Math.PI) / 180) * p.distance;
        const ty = Math.sin((p.angle * Math.PI) / 180) * p.distance;
        return (
          <span
            key={p.id}
            className={styles.particle}
            style={{
              backgroundColor: p.color,
              boxShadow: `0 0 6px ${p.color}`,
              ["--tx" as string]: `${tx}px`,
              ["--ty" as string]: `${ty}px`,
            }}
          />
        );
      })}

      {/* 機器人 SVG Avatar */}
      <div
        className={`${styles.robot} ${isClicked ? styles.jump : ""}`}
        onClick={handleClick}
      >
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* 天線 */}
          <line x1="50" y1="20" x2="50" y2="5" stroke="var(--accent-cyan)" strokeWidth="3" />
          <circle cx="50" cy="5" r="4" fill="var(--accent-magenta)" className={styles.antennaGlow} />

          {/* 頭部外框 (玻璃擬態質感) */}
          <rect x="25" y="20" width="50" height="45" rx="10" fill="rgba(10, 10, 25, 0.8)" stroke="var(--accent-cyan)" strokeWidth="2" className={styles.headGlow} />

          {/* 耳朵 */}
          <rect x="15" y="35" width="10" height="15" rx="3" fill="var(--accent-cyan)" />
          <rect x="75" y="35" width="10" height="15" rx="3" fill="var(--accent-cyan)" />

          {/* 臉部螢幕 */}
          <rect x="30" y="25" width="40" height="25" rx="5" fill="#030014" />

          {/* 眼睛包裝器 (白眼球部分為隱形或稍微發亮) */}
          <circle ref={leftEyeRef} cx="40" cy="37" r="8" fill="rgba(0, 243, 255, 0.1)" />
          <circle ref={rightEyeRef} cx="60" cy="37" r="8" fill="rgba(0, 243, 255, 0.1)" />

          {/* 瞳孔 (會追蹤滑鼠) */}
          <circle
            ref={leftPupilRef}
            cx="40"
            cy="37"
            r="4"
            fill="var(--accent-cyan)"
            className={styles.pupil}
          />
          <circle
            ref={rightPupilRef}
            cx="60"
            cy="37"
            r="4"
            fill="var(--accent-cyan)"
            className={styles.pupil}
          />

          {/* 嘴巴 (平時直線，開心時彎曲) */}
          {isClicked ? (
            <path d="M 40 55 Q 50 60 60 55" stroke="var(--accent-magenta)" strokeWidth="2" fill="none" strokeLinecap="round" />
          ) : (
            <line x1="42" y1="55" x2="58" y2="55" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" />
          )}

          {/* 身體 */}
          <path d="M 35 65 L 65 65 L 70 95 L 30 95 Z" fill="rgba(10, 10, 25, 0.8)" stroke="var(--accent-cyan)" strokeWidth="2" />

          {/* 能量核心 */}
          <circle cx="50" cy="80" r="6" fill="var(--accent-magenta)" className={styles.corePulse} />
        </svg>
      </div>
    </div>
  );
}
