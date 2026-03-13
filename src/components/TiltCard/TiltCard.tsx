"use client";

import { useRef, MouseEvent, ReactNode } from "react";
import styles from "./TiltCard.module.css";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  href?: string;
  target?: string;
  rel?: string;
}

export default function TiltCard({ children, className = "", href, target, rel }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform =
      "perspective(1000px) rotateX(0) rotateY(0) translateZ(0)";
  };

  const content = (
    <div
      ref={cardRef}
      className={`${styles.tilt} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );

  if (href) {
    return (
      <a href={href} target={target} rel={rel} className={styles.wrapper}>
        {content}
      </a>
    );
  }

  return content;
}
