import React, { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  MotionValue,
} from "framer-motion";

export interface CollectionItem {
  id: number;
  image: string;
  title: string;
}

export type CollectionSurferVariant = "magnetic" | "uplift" | "simple";

interface CollectionSurferProps {
  items: CollectionItem[];
  variant?: CollectionSurferVariant;
}

export function CollectionSurfer({
  items,
  variant = "magnetic",
}: CollectionSurferProps) {
  const duplicatedItems = [...items, ...items];
  const scrollPerItem = 600;
  const loopDistance = items.length * scrollPerItem;

  const { scrollY } = useScroll();
  const smoothScroll = useSpring(scrollY, { mass: 0.1, stiffness: 100, damping: 20 });

  const loopedProgress = useTransform(
    smoothScroll,
    (value) => value % loopDistance,
  );

  const stepX = 240;
  const stepY = -84;
  const stepZ = -288;

  const x = useTransform(loopedProgress, [0, loopDistance], [0, -items.length * stepX]);
  const y = useTransform(loopedProgress, [0, loopDistance], [0, -items.length * stepY]);
  const z = useTransform(loopedProgress, [0, loopDistance], [0, -items.length * stepZ]);

  const mouseX = useMotionValue(-10000);
  const mouseY = useMotionValue(-10000);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (variant === "simple") return;
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  };

  const handleMouseLeave = () => {
    if (variant === "simple") return;
    mouseX.set(-10000);
    mouseY.set(-10000);
  };

  return (
    <div className="relative bg-black min-h-screen text-white w-full">
      <div style={{ height: "50000px" }} className="w-full" />

      <div
        className="fixed inset-0 w-full h-screen overflow-hidden flex items-center justify-center"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Başlık */}
        <div className="absolute top-[3vw] left-[3vw] z-50 pointer-events-none">
          <h1 className="font-bold text-[clamp(2rem,6vw,5rem)] leading-[0.9] tracking-tighter ml-[4vw]">
            STİCKER
          </h1>
          <h1 className="font-bold text-[clamp(2rem,6vw,5rem)] leading-[0.9] tracking-tighter">
            HAVUZU
            <span className="text-[0.4em] align-top relative top-[0.6em] ml-2 font-mono tabular-nums">
              ({items.length})
            </span>
          </h1>
        </div>

        <div className="absolute bottom-[3vw] right-[3vw] z-50 font-mono text-xs tracking-wider uppercase opacity-70">
          kaydır
        </div>

        {/* 3D Sahne */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: "2000px", perspectiveOrigin: "10% 10%" }}
        >
          <motion.div
            className="relative w-0 h-0"
            style={{ x, y, z, transformStyle: "preserve-3d" }}
          >
            {duplicatedItems.map((item, i) => (
              <Card
                key={`${item.id}-${i}`}
                item={item}
                i={i}
                stepX={stepX}
                stepY={stepY}
                stepZ={stepZ}
                mouseX={mouseX}
                mouseY={mouseY}
                scrollSpring={smoothScroll}
                variant={variant}
                totalItems={items.length}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Card({
  item, i, stepX, stepY, stepZ, mouseX, mouseY, scrollSpring, variant, totalItems,
}: {
  item: CollectionItem;
  i: number;
  stepX: number;
  stepY: number;
  stepZ: number;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  scrollSpring: MotionValue<number>;
  variant: CollectionSurferVariant;
  totalItems: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform([mouseX, mouseY, scrollSpring], ([x, y]) => {
    if (!ref.current || variant === "simple") return 200;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.sqrt(Math.pow((x as number) - centerX, 2) + Math.pow((y as number) - centerY, 2));
  });

  const targetScale = useTransform(distance, [0, 400], [1.5, 1]);
  const springScale = useSpring(targetScale, { mass: 0.5, stiffness: 300, damping: 20 });

  const targetUplift = useTransform(distance, [0, 400], [-100, 0]);
  const springUplift = useSpring(targetUplift, { mass: 0.5, stiffness: 300, damping: 20 });

  const transform = useTransform([springScale, springUplift], ([s, u]) => {
    const scaleValue = variant === "magnetic" ? Number(s) : 1;
    const upliftValue = variant === "uplift" ? Number(u) : 0;
    return `translate3d(${i * stepX}px, ${i * stepY + upliftValue}px, ${i * stepZ}px) rotateY(-50deg) scale(${scaleValue})`;
  });

  return (
    <motion.div
      ref={ref}
      className="absolute w-[300px] h-[400px] bg-neutral-900 overflow-hidden shadow-2xl group"
      style={{ transform, transformStyle: "preserve-3d" }}
    >
      <div className="absolute -top-6 -left-4 text-white font-mono text-xs opacity-50 group-hover:opacity-100 transition-opacity">
        {String((i % totalItems) + 1).padStart(2, "0")}
      </div>

      <div className="relative w-full h-full brightness-75 group-hover:brightness-100 transition-all duration-300">
        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
      </div>

      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
    </motion.div>
  );
}

export default CollectionSurfer;
