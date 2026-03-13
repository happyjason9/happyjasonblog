"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./Avatar.module.css";

export default function Avatar() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isClicked, setIsClicked] = useState(false);
  const [message, setMessage] = useState("");
  const leftEyeRef = useRef<SVGCircleElement>(null);
  const rightEyeRef = useRef<SVGCircleElement>(null);

  const messages = [
    "嗨！我是你的專屬導覽員 🤖",
    "點雲特效好玩嗎？✨",
    "我的眼睛會跟著你轉喔 👀",
    "歡迎來到超現代玻璃宇宙！🚀",
    "需要幫忙嗎？雖然我也幫不上忙 😜",
  ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleClick = () => {
    if (isClicked) return;
    setIsClicked(true);
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    setMessage(randomMsg);

    // 動畫與泡泡顯示時間
    setTimeout(() => {
      setIsClicked(false);
      setMessage("");
    }, 3000);
  };

  // 計算瞳孔位置
  const calculatePupilOffset = (eyeRef: React.RefObject<SVGCircleElement>) => {
    if (!eyeRef.current) return { x: 0, y: 0 };
    const rect = eyeRef.current.getBoundingClientRect();
    const eyeCenterX = rect.left + rect.width / 2;
    const eyeCenterY = rect.top + rect.height / 2;

    // 計算滑鼠與眼睛中心的角度
    const angle = Math.atan2(mousePos.y - eyeCenterY, mousePos.x - eyeCenterX);

    // 限制瞳孔只能在一定半徑內移動 (例如 5px)
    const maxOffset = 6;
    const offsetX = Math.cos(angle) * maxOffset;
    const offsetY = Math.sin(angle) * maxOffset;

    // 如果滑鼠非常靠近，則不偏移太多
    const distance = Math.sqrt(Math.pow(mousePos.x - eyeCenterX, 2) + Math.pow(mousePos.y - eyeCenterY, 2));
    if (distance < 20) {
      return { x: 0, y: 0 };
    }

    return { x: offsetX, y: offsetY };
  };

  const leftOffset = calculatePupilOffset(leftEyeRef as React.RefObject<SVGCircleElement>);
  const rightOffset = calculatePupilOffset(rightEyeRef as React.RefObject<SVGCircleElement>);

  return (
    <div className={styles.avatarContainer}>
      {/* 說話泡泡 */}
      <div className={`${styles.speechBubble} ${message ? styles.showBubble : ""}`}>
        {message}
      </div>

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
          <circle ref={leftEyeRef as React.RefObject<SVGCircleElement>} cx="40" cy="37" r="8" fill="rgba(0, 243, 255, 0.1)" />
          <circle ref={rightEyeRef as React.RefObject<SVGCircleElement>} cx="60" cy="37" r="8" fill="rgba(0, 243, 255, 0.1)" />

          {/* 瞳孔 (會追蹤滑鼠) */}
          <circle
            cx={40 + leftOffset.x}
            cy={37 + leftOffset.y}
            r="4"
            fill="var(--accent-cyan)"
            className={styles.pupil}
          />
          <circle
            cx={60 + rightOffset.x}
            cy={37 + rightOffset.y}
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
