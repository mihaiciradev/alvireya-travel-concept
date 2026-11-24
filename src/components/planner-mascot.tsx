"use client";

import { useEffect, useRef, useState } from "react";
import type { Mascot, MascotPose } from "./hero-plane/plane-mascot";

type Side = "left" | "right";
type Status = "idle" | "thinking" | "done";

const FLIGHT_MS = 1150;
const TURN_MS = 520;
const PERCH_TILT = 0.24;

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Facing = { left: number; right: number };
type Metrics = { w: number; h: number; y: number; arc: number; xFor: (side: Side) => number };

function measure(wrap: HTMLElement | null, box: HTMLElement | null): Metrics | null {
  if (!wrap || !box) return null;
  const width = wrap.clientWidth;
  const w = box.clientWidth;
  const h = box.clientHeight;
  return {
    w,
    h,
    y: -h * 0.86,
    arc: Math.min(90, width * 0.12),
    xFor: (side) => (side === "right" ? width - w * 0.78 : -w * 0.22),
  };
}

function place(box: HTMLElement | null, shadow: HTMLElement | null, m: Metrics, x: number, y: number, lift: number) {
  if (!box || !shadow) return;
  box.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  shadow.style.transform = `translate3d(${x + m.w * 0.5 - 45}px, -6px, 0) scale(${1 - lift * 0.45})`;
  shadow.style.opacity = String(1 - lift * 0.6);
}

function perchPose(side: Side, facing: Facing): MascotPose {
  const facingLeft = side === "right";
  return { yaw: facingLeft ? facing.left : facing.right, tilt: facingLeft ? -PERCH_TILT : PERCH_TILT, bank: 0 };
}

export function PlannerMascot({ status }: { status: Status }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const mascotRef = useRef<Mascot | null>(null);
  const facingRef = useRef<Facing>({ left: 0, right: 0 });
  const sideRef = useRef<Side>("right");
  const frameRef = useRef(0);
  const [mode, setMode] = useState<"loading" | "live" | "fallback">("loading");

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    let disposed = false;
    let resize: ResizeObserver | null = null;

    const layout = () => {
      const m = measure(wrapRef.current, boxRef.current);
      const mascot = mascotRef.current;
      if (!m || !mascot) return;
      mascot.resize(m.w, m.h, m.w * 0.72);
      place(boxRef.current, shadowRef.current, m, m.xFor(sideRef.current), m.y, 0);
      mascot.pose(perchPose(sideRef.current, facingRef.current));
    };

    const io = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        try {
          const { createMascot, FACING_LEFT, FACING_RIGHT } = await import("./hero-plane/plane-mascot");
          if (disposed) return;
          const mascot = await createMascot(canvas);
          if (disposed) {
            mascot.dispose();
            return;
          }
          facingRef.current = { left: FACING_LEFT, right: FACING_RIGHT };
          mascotRef.current = mascot;
          layout();
          resize = new ResizeObserver(layout);
          resize.observe(wrap);
          setMode("live");
        } catch {
          if (!disposed) {
            const m = measure(wrapRef.current, boxRef.current);
            if (m) place(boxRef.current, shadowRef.current, m, m.xFor("right"), m.y, 0);
            setMode("fallback");
          }
        }
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(wrap);

    return () => {
      disposed = true;
      io.disconnect();
      resize?.disconnect();
      cancelAnimationFrame(frameRef.current);
      mascotRef.current?.dispose();
      mascotRef.current = null;
    };
  }, []);

  useEffect(() => {
    const mascot = mascotRef.current;
    const box = boxRef.current;
    const shadow = shadowRef.current;
    const m = measure(wrapRef.current, box);
    if (status !== "thinking" || !mascot || !m) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const from = sideRef.current;
    const to: Side = from === "right" ? "left" : "right";
    const facingLeft = from === "right";
    const sign = facingLeft ? -1 : 1;
    const x0 = m.xFor(from);
    const x1 = m.xFor(to);
    const start = performance.now();
    cancelAnimationFrame(frameRef.current);

    const step = (now: number) => {
      const elapsed = now - start;
      if (elapsed <= FLIGHT_MS) {
        const t = elapsed / FLIGHT_MS;
        const eased = easeInOutSine(t);
        const lift = Math.sin(Math.PI * eased);
        const climb = Math.atan2(Math.cos(Math.PI * eased) * Math.PI * m.arc, Math.abs(x1 - x0)) * 0.7;
        place(box, shadow, m, lerp(x0, x1, eased), m.y - lift * m.arc, lift);
        mascot.pose({
          yaw: facingLeft ? facingRef.current.left : facingRef.current.right,
          tilt: sign * (PERCH_TILT * (1 - lift) + climb),
          bank: -sign * lift * 0.32,
        });
      } else {
        const t = easeInOutCubic(Math.min((elapsed - FLIGHT_MS) / TURN_MS, 1));
        const fromPose = perchPose(from, facingRef.current);
        const toPose = perchPose(to, facingRef.current);
        place(box, shadow, m, x1, m.y, 0);
        mascot.pose({ yaw: lerp(fromPose.yaw, toPose.yaw, t), tilt: lerp(fromPose.tilt, toPose.tilt, t), bank: 0 });
        if (t >= 1) {
          sideRef.current = to;
          frameRef.current = 0;
          return;
        }
      }
      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
  }, [status]);

  return (
    <div ref={wrapRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0">
      <div
        ref={shadowRef}
        className={`absolute top-0 left-0 h-3 w-[90px] rounded-full bg-ink/25 blur-[6px] transition-opacity duration-700 ${mode === "loading" ? "opacity-0" : ""}`}
      />
      <div
        ref={boxRef}
        className={`absolute top-0 left-0 aspect-[4/3] w-[140px] transition-opacity duration-700 will-change-transform md:w-[180px] ${mode === "loading" ? "opacity-0" : "opacity-100"}`}
      >
        <div className={`h-full w-full ${mode === "live" ? "plane-float" : ""}`}>
          <canvas ref={canvasRef} className={`h-full w-full ${mode === "fallback" ? "hidden" : ""}`} />
          {mode === "fallback" ? (
            <div className="h-full w-full bg-[url(/images/alvireya-plane.webp)] bg-contain bg-center bg-no-repeat" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
