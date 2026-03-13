"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, ReactNode } from "react";
import styles from "./PageTransition.module.css";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove(styles.animate);
    // Trigger reflow to restart animation
    void el.offsetHeight;
    el.classList.add(styles.animate);
  }, [pathname]);

  return (
    <div ref={ref} className={`${styles.wrapper} ${styles.animate}`}>
      {children}
    </div>
  );
}
