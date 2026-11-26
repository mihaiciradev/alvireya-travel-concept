"use client";

import { useEffect, useRef, useState } from "react";
import type { Mascot, MascotPose } from "./hero-plane/plane-mascot";

type Side = "left" | "right";
type Status = "idle" | "thinking" | "done";
type Point = { x: number; y: number };
type Curve = [Point, Point, Point, Point];

const DIVE_MS = 2200;
const TURN_MS = 520;
const HOP_MS = 560;
const PERCH_TILT = 0.24;

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (value: number, limit: number) => Math.min(Math.max(value, -limit), limit);

type Facing = { left: number; right: number };
type Metrics = { w: number; h: number; y: number; depth: number; xFor: (side: Side) => number };

function measure(wrap: HTMLElement | null, box: HTMLElement | null): Metrics | null {
  const card = wrap?.parentElement?.querySelector<HTMLElement>("[data-sketch-card]");
  if (!wrap || !box) return null;
  const width = wrap.clientWidth;
  const w = box.clientWidth;
  const h = box.clientHeight;
  return {
    w,
    h,
    y: -h * 0.86,
    depth: Math.min((card?.clientHeight ?? 540) * 0.5, 300),
    xFor: (side) => (side === "right" ? width - w * 0.78 : -w * 0.22),
  };
}

function bezier([a, b, c, d]: Curve, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  };
}

function tangent([a, b, c, d]: Curve, t: number): Point {
  const u = 1 - t;
  return {
    x: 3 * u * u * (b.x - a.x) + 6 * u * t * (c.x - b.x) + 3 * t * t * (d.x - c.x),
    y: 3 * u * u * (b.y - a.y) + 6 * u * t * (c.y - b.y) + 3 * t * t * (d.y - c.y),
  };
}

function place(box: HTMLElement | null, shadow: HTMLElement | null, m: Metrics, x: number, y: number, lift: number) {
  if (!box || !shadow) return;
  box.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  shadow.style.transform = `translate3d(${x + m.w * 0.5 - 45}px, -6px, 0) scale(${1 - lift * 0.45})`;
  shadow.style.opacity = String(Math.max(0, 1 - lift * 0.9));
}

function perchPose(side: Side, facing: Facing): MascotPose {
  const facingLeft = side === "right";
  return { yaw: facingLeft ? facing.left : facing.right, tilt: facingLeft ? -PERCH_TILT : PERCH_TILT, bank: 0 };
}

export function PlannerMascot({ status, input }: { status: Status; input: unknown }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<SVGSVGElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const revealRef = useRef<SVGPathElement>(null);
  const underRef = useRef<SVGPathElement>(null);
  const mascotRef = useRef<Mascot | null>(null);
  const facingRef = useRef<Facing>({ left: 0, right: 0 });
  const sideRef = useRef<Side>("right");
  const busyRef = useRef(false);
  const lookRef = useRef({ x: 0, y: 0, tx: 0, ty: 0, frame: 0 });
  const frameRef = useRef(0);
  const inputKey = useRef(JSON.stringify(input));
  const [mode, setMode] = useState<"loading" | "live" | "fallback">("loading");

  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const rest = (look = lookRef.current) => {
    const mascot = mascotRef.current;
    if (!mascot) return;
    const base = perchPose(sideRef.current, facingRef.current);
    const sign = sideRef.current === "right" ? -1 : 1;
    mascot.pose({ yaw: base.yaw - look.x * 0.42 * sign, tilt: base.tilt - look.y * 0.2 * sign, bank: look.x * 0.18 });
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    let disposed = false;
    let resize: ResizeObserver | null = null;
    let visible = false;

    const layout = () => {
      const m = measure(wrapRef.current, boxRef.current);
      const mascot = mascotRef.current;
      if (!m || !mascot || busyRef.current) return;
      mascot.resize(m.w, m.h, m.w * 0.72);
      place(boxRef.current, shadowRef.current, m, m.xFor(sideRef.current), m.y, 0);
      rest();
    };

    const look = lookRef.current;
    const follow = () => {
      look.frame = 0;
      look.x += (look.tx - look.x) * 0.12;
      look.y += (look.ty - look.y) * 0.12;
      if (!busyRef.current) rest(look);
      if (Math.abs(look.tx - look.x) > 0.003 || Math.abs(look.ty - look.y) > 0.003) {
        look.frame = requestAnimationFrame(follow);
      }
    };

    const onPointer = (event: PointerEvent) => {
      if (!visible || event.pointerType !== "mouse" || !mascotRef.current || reduced()) return;
      const rect = boxRef.current?.getBoundingClientRect();
      if (!rect) return;
      look.tx = clamp((event.clientX - (rect.left + rect.width / 2)) / (window.innerWidth * 0.4), 1);
      look.ty = clamp((event.clientY - (rect.top + rect.height / 2)) / (window.innerHeight * 0.4), 1);
      if (!look.frame) look.frame = requestAnimationFrame(follow);
    };

    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    seen.observe(wrap.parentElement ?? wrap);
    window.addEventListener("pointermove", onPointer, { passive: true });

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
      seen.disconnect();
      resize?.disconnect();
      window.removeEventListener("pointermove", onPointer);
      cancelAnimationFrame(look.frame);
      cancelAnimationFrame(frameRef.current);
      mascotRef.current?.dispose();
      mascotRef.current = null;
    };
  }, []);

  useEffect(() => {
    const key = JSON.stringify(input);
    if (key === inputKey.current) return;
    inputKey.current = key;
    const mascot = mascotRef.current;
    const m = measure(wrapRef.current, boxRef.current);
    if (!mascot || !m || busyRef.current || reduced()) return;

    busyRef.current = true;
    const x = m.xFor(sideRef.current);
    const base = perchPose(sideRef.current, facingRef.current);
    const sign = sideRef.current === "right" ? -1 : 1;
    const start = performance.now();
    cancelAnimationFrame(frameRef.current);

    const step = (now: number) => {
      const t = Math.min((now - start) / HOP_MS, 1);
      const lift = Math.sin(Math.PI * t);
      place(boxRef.current, shadowRef.current, m, x, m.y - lift * m.h * 0.22, lift * 0.5);
      mascot.pose({
        yaw: base.yaw,
        tilt: base.tilt + sign * Math.sin(Math.PI * 2 * t) * 0.22,
        bank: Math.sin(Math.PI * 2 * t) * 0.5 * (1 - t),
      });
      if (t < 1) frameRef.current = requestAnimationFrame(step);
      else {
        busyRef.current = false;
        rest();
      }
    };
    frameRef.current = requestAnimationFrame(step);
  }, [input]);

  useEffect(() => {
    const mascot = mascotRef.current;
    const box = boxRef.current;
    const shadow = shadowRef.current;
    const m = measure(wrapRef.current, box);
    if (status !== "thinking" || !mascot || !m || reduced()) return;

    const from = sideRef.current;
    const to: Side = from === "right" ? "left" : "right";
    const x0 = m.xFor(from);
    const x1 = m.xFor(to);
    const dx = x1 - x0;
    const curve: Curve = [
      { x: x0, y: m.y },
      { x: x0 + dx * 0.12, y: m.y + m.depth * 1.35 },
      { x: x0 + dx * 0.72, y: m.y + m.depth * 1.25 },
      { x: x1, y: m.y },
    ];
    const cx = m.w * 0.5;
    const cy = m.h * 0.62;
    const d = `M${curve[0].x + cx} ${curve[0].y + cy} C${curve[1].x + cx} ${curve[1].y + cy} ${curve[2].x + cx} ${curve[2].y + cy} ${curve[3].x + cx} ${curve[3].y + cy}`;
    const trail = trailRef.current;
    const reveal = revealRef.current;
    lineRef.current?.setAttribute("d", d);
    underRef.current?.setAttribute("d", d);
    reveal?.setAttribute("d", d);
    const length = reveal?.getTotalLength() ?? 0;
    if (trail) {
      trail.style.transition = "none";
      trail.style.opacity = "1";
    }
    if (reveal) {
      reveal.style.strokeDasharray = `${length}`;
      reveal.style.strokeDashoffset = `${length}`;
    }

    const sign = dx < 0 ? -1 : 1;
    const yaw = dx < 0 ? facingRef.current.left : facingRef.current.right;
    busyRef.current = true;
    const start = performance.now();
    cancelAnimationFrame(frameRef.current);

    const step = (now: number) => {
      const elapsed = now - start;
      if (elapsed <= DIVE_MS) {
        const t = easeInOutSine(elapsed / DIVE_MS);
        const point = bezier(curve, t);
        const slope = tangent(curve, Math.min(Math.max(t, 0.02), 0.98));
        const noseUp = clamp(-Math.atan2(slope.y, Math.abs(slope.x)), 1.1);
        const depth = (point.y - m.y) / (m.depth * 1.3);
        place(box, shadow, m, point.x, point.y, Math.max(0, Math.min(1, 1 - depth)) * 0.2);
        mascot.pose({ yaw, tilt: sign * noseUp * 0.85, bank: -sign * Math.sin(Math.PI * t) * 0.55 });
        if (reveal) reveal.style.strokeDashoffset = `${length * (1 - t)}`;
      } else {
        const t = easeInOutCubic(Math.min((elapsed - DIVE_MS) / TURN_MS, 1));
        const fromPose = { yaw, tilt: sign * 0.1, bank: 0 };
        const toPose = perchPose(to, facingRef.current);
        place(box, shadow, m, x1, m.y, 0);
        mascot.pose({ yaw: lerp(fromPose.yaw, toPose.yaw, t), tilt: lerp(fromPose.tilt, toPose.tilt, t), bank: 0 });
        if (t >= 1) {
          sideRef.current = to;
          busyRef.current = false;
          frameRef.current = 0;
          if (trail) {
            trail.style.transition = "opacity 1.6s ease 2.4s";
            trail.style.opacity = "0";
          }
          return;
        }
      }
      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
  }, [status]);

  return (
    <div ref={wrapRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0">
      <svg ref={trailRef} className="absolute top-0 left-0 h-px w-full overflow-visible opacity-0" fill="none">
        <defs>
          <mask id="sketch-trail" maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000">
            <path ref={revealRef} stroke="#fff" strokeWidth="10" strokeLinecap="round" />
          </mask>
        </defs>
        <g mask="url(#sketch-trail)">
          <path ref={underRef} stroke="var(--color-paper)" strokeOpacity="0.7" strokeWidth="6" strokeLinecap="round" />
          <path
            ref={lineRef}
            stroke="var(--color-coral)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeDasharray="3 10"
          />
        </g>
      </svg>
      <div
        ref={shadowRef}
        className={`absolute top-0 left-0 h-3 w-[90px] rounded-full bg-ink/25 blur-[6px] transition-opacity duration-700 ${mode === "loading" ? "opacity-0" : ""}`}
      />
      <div
        ref={boxRef}
        className={`absolute top-0 left-0 aspect-[4/3] w-[140px] transition-opacity duration-700 will-change-transform md:w-[180px] ${mode === "loading" ? "opacity-0" : "opacity-100"}`}
      >
        <canvas ref={canvasRef} className={`h-full w-full ${mode === "fallback" ? "hidden" : ""}`} />
        {mode === "fallback" ? (
          <div className="h-full w-full bg-[url(/images/alvireya-plane.webp)] bg-contain bg-center bg-no-repeat" />
        ) : null}
      </div>
    </div>
  );
}
