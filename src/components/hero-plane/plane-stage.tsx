"use client";

import { useEffect, useRef } from "react";
import type { PlaneScene, StageLayout, flightPath as FlightPath } from "./plane-scene";

type NavigatorWithConnection = Navigator & { connection?: { saveData?: boolean } };

function whenIdle(callback: () => void) {
  const run = () => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(callback, { timeout: 2000 });
    } else {
      setTimeout(callback, 400);
    }
  };
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
}

export function PlaneStage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const revealRef = useRef<SVGPathElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const hero = root?.closest<HTMLElement>("[data-hero]");
    const anchorEl = hero?.querySelector<HTMLElement>("[data-plane-anchor]");
    if (!root || !canvas || !hero || !anchorEl) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as NavigatorWithConnection).connection?.saveData === true;
    if (reduceMotion) return;
    if (saveData) {
      hero.dataset.plane = "fallback";
      return;
    }

    let scene: PlaneScene | null = null;
    let disposed = false;
    let visible = true;
    let trailLength = 0;
    const cleanups: (() => void)[] = [];

    const measure = (): StageLayout => {
      const heroRect = hero.getBoundingClientRect();
      const anchorRect = anchorEl.getBoundingClientRect();
      return {
        width: heroRect.width,
        height: heroRect.height,
        anchor: {
          x: anchorRect.left - heroRect.left + anchorRect.width / 2,
          y: anchorRect.top - heroRect.top + anchorRect.height / 2,
        },
        planeSize: anchorRect.width,
      };
    };

    const drawTrail = (pathFor: typeof FlightPath, layout: StageLayout, progress: number) => {
      const [a, b, c, d] = pathFor(layout);
      const path = `M${a.x} ${a.y} C${b.x} ${b.y} ${c.x} ${c.y} ${d.x} ${d.y}`;
      svgRef.current?.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
      trailRef.current?.setAttribute("d", path);
      revealRef.current?.setAttribute("d", path);
      trailLength = revealRef.current?.getTotalLength() ?? 0;
      setTrailProgress(progress);
    };

    const setTrailProgress = (progress: number) => {
      const reveal = revealRef.current;
      if (!reveal) return;
      reveal.style.strokeDasharray = `${trailLength}`;
      reveal.style.strokeDashoffset = `${trailLength * (1 - progress)}`;
    };

    whenIdle(async () => {
      try {
        const { createPlaneScene, flightPath } = await import("./plane-scene");
        if (disposed) return;
        scene = await createPlaneScene(canvas);
        if (disposed) {
          scene.dispose();
          return;
        }

        let layout = measure();
        scene.layout(layout);
        drawTrail(flightPath, layout, 0);
        hero.dataset.plane = "live";
        root.dataset.ready = "true";

        await scene.arrive(setTrailProgress);
        root.querySelector("[data-float]")?.classList.add("plane-float");

        const resize = new ResizeObserver(() => {
          layout = measure();
          scene?.layout(layout);
          drawTrail(flightPath, layout, 1);
        });
        resize.observe(hero);
        cleanups.push(() => resize.disconnect());

        const io = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
        });
        io.observe(hero);
        cleanups.push(() => io.disconnect());

        let ticking = false;
        const onScroll = () => {
          if (!visible || ticking) return;
          ticking = true;
          requestAnimationFrame(() => {
            ticking = false;
            const progress = Math.min(Math.max(window.scrollY / layout.height, 0), 1);
            scene?.scroll(progress);
            if (svgRef.current) svgRef.current.style.opacity = String(1 - progress * 1.6);
          });
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        cleanups.push(() => window.removeEventListener("scroll", onScroll));
        onScroll();

        const local = (event: MouseEvent) => {
          const rect = hero.getBoundingClientRect();
          return { x: event.clientX - rect.left, y: event.clientY - rect.top };
        };
        const isControl = (target: EventTarget | null) =>
          target instanceof Element && target.closest("a, button, input, label, select, textarea") !== null;

        const onClick = (event: MouseEvent) => {
          if (isControl(event.target)) return;
          const { x, y } = local(event);
          if (scene?.hits(x, y)) scene.roll();
        };
        hero.addEventListener("click", onClick);
        cleanups.push(() => hero.removeEventListener("click", onClick));

        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
          const onPointer = (event: PointerEvent) => {
            if (!visible) return;
            const x = (event.clientX / window.innerWidth) * 2 - 1;
            const y = (event.clientY / window.innerHeight) * 2 - 1;
            scene?.pointer(x, y);
            const point = local(event);
            hero.style.cursor = !isControl(event.target) && scene?.hits(point.x, point.y) ? "pointer" : "";
          };
          window.addEventListener("pointermove", onPointer, { passive: true });
          cleanups.push(() => window.removeEventListener("pointermove", onPointer));
        }
      } catch {
        if (!disposed) hero.dataset.plane = "fallback";
      }
    });

    return () => {
      disposed = true;
      cleanups.forEach((cleanup) => cleanup());
      scene?.dispose();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-500 data-[ready=true]:opacity-100"
    >
      <svg ref={svgRef} className="absolute inset-0 h-full w-full" fill="none" preserveAspectRatio="none">
        <defs>
          <mask id="contrail-reveal" maskUnits="userSpaceOnUse">
            <path ref={revealRef} stroke="#fff" strokeWidth="8" strokeLinecap="round" />
          </mask>
        </defs>
        <path
          ref={trailRef}
          className="contrail-path"
          stroke="var(--color-coral)"
          strokeWidth="2"
          strokeLinecap="round"
          mask="url(#contrail-reveal)"
        />
      </svg>
      <div data-float className="absolute inset-0">
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>
    </div>
  );
}
