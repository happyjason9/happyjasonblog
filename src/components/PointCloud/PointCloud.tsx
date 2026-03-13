"use client";

import { useEffect, useRef } from "react";

export default function PointCloud() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const mouse = { x: -1000, y: -1000, radius: 150 }; // 滑鼠影響半徑

    type Particle = {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      vx: number;
      vy: number;
      radius: number;
      colorType: number;
    };

    const particles: Particle[] = [];
    const particleCount = 120; // 稍微增加點數量讓連線更好看

    // 初始化點雲，記錄初始位置 (baseX, baseY)
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      particles.push({
        x: x,
        y: y,
        baseX: x, // 游蕩的錨點基準
        baseY: y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: Math.random() * 2 + 0.5,
        colorType: Math.random() > 0.5 ? 1 : 0, // 1: Cyan, 0: Magenta/Purple
      });
    }

    let animationFrameId: number;

    const render = () => {
      // 帶一點拖影效果
      ctx.fillStyle = "rgba(3, 0, 20, 0.25)";
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p, i) => {
        // 1. 基本的漂浮移動 (更新基準點，讓原位也會緩慢移動)
        p.baseX += p.vx * 0.3;
        p.baseY += p.vy * 0.3;

        // 邊界反彈
        if (p.baseX < 0 || p.baseX > width) p.vx *= -1;
        if (p.baseY < 0 || p.baseY > height) p.vy *= -1;

        // 2. 計算與滑鼠的距離與排斥力
        const dxMouse = mouse.x - p.x;
        const dyMouse = mouse.y - p.y;
        const distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        if (distanceMouse < mouse.radius) {
          // 滑鼠靠近，產生排斥力 (散開)
          const forceDirectionX = dxMouse / distanceMouse;
          const forceDirectionY = dyMouse / distanceMouse;
          const force = (mouse.radius - distanceMouse) / mouse.radius; // 越近力道越大
          const pushX = forceDirectionX * force * -7; // 負值代表推開，數值為推開力度
          const pushY = forceDirectionY * force * -7;

          p.x += pushX;
          p.y += pushY;
        } else {
          // 滑鼠不在附近，緩慢回到 baseX/baseY (原位)
          // 這邊使用彈簧機制 (Spring physics) 讓回歸更自然平滑
          const dxBase = p.baseX - p.x;
          const dyBase = p.baseY - p.y;
          p.x += dxBase * 0.05; // 0.05 是回歸速度，越小越平滑
          p.y += dyBase * 0.05;
        }

        // 繪製粒子
        const color = p.colorType === 1 ? "0, 255, 255" : "255, 0, 255";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, 0.8)`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(${color}, 1)`;
        ctx.fill();
        ctx.shadowBlur = 0; // 重置陰影避免影響連線

        // 與其他粒子連線
        for (let j = i + 1; j < particleCount; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            // 距離越近，線條越不透明
            const opacity = 0.25 * (1 - dist / 120);
            
            // 兩點連線如果是不同顏色，線條可以用混合漸層或是直接取其中一色，這邊用 Cyan
            ctx.strokeStyle = `rgba(0, 255, 255, ${opacity})`;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // 事件監聽
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.x;
      mouse.y = e.y;
    };

    const handleMouseLeave = () => {
      // 移出視窗時把滑鼠座標丟到無限遠，粒子就會回歸原位
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1, // 放置於最底層
        pointerEvents: "none", // 讓下面這層特效不阻擋滑鼠點擊 Navbar/卡片
      }}
    />
  );
}
