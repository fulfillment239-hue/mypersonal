/** Client-only hero enhancement serves the entrance, keeps pointer parallax restrained and cleans every listener. */
import { useEffect, useRef } from "react";

interface Props { kicker: string; title: string; description: string; scrollLabel: string; course: string; }

export default function HeroStage({ kicker, title, description, scrollLabel, course }: Props) {
  const imageRef = useRef<HTMLImageElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = matchMedia("(pointer: fine)");

    const start = () => {
      const root = document.documentElement;
      if (motionQuery.matches) {
        root.classList.remove("has-reveal");
        document.querySelectorAll<HTMLElement>("[data-step]").forEach((step) => step.style.setProperty("--d", "0s"));
        return () => undefined;
      }
      root.classList.add("has-reveal");

      const timers: number[] = [];
      const serve = (band: Element) => {
        const steps = Array.from(band.querySelectorAll<HTMLElement>("[data-step]"));
        steps.forEach((step, index) => step.style.setProperty("--d", `${(index * 0.085).toFixed(3)}s`));
        requestAnimationFrame(() => band.classList.add("is-revealed"));
        /* Retire the stagger once it has played, or every later hover on these elements waits out the entrance delay. */
        timers.push(window.setTimeout(() => {
          steps.forEach((step) => step.style.setProperty("--d", "0s"));
        }, 900 + steps.length * 85));
      };

      const entrance = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entrance.unobserve(entry.target);
          serve(entry.target);
        });
      }, { threshold: 0.16 });
      document.querySelectorAll("[data-reveal]").forEach((band) => entrance.observe(band));
      if (heroRef.current) {
        entrance.unobserve(heroRef.current);
        serve(heroRef.current);
      }

      /* Candlelight only burns where someone is looking. */
      const offstage = new IntersectionObserver((entries) => {
        entries.forEach((entry) => entry.target.classList.toggle("is-offstage", !entry.isIntersecting));
      }, { rootMargin: "140px" });
      document.querySelectorAll(".hero, .course").forEach((band) => offstage.observe(band));

      const cleanup = () => {
        entrance.disconnect();
        offstage.disconnect();
        timers.forEach((timer) => clearTimeout(timer));
        document.querySelectorAll(".is-offstage").forEach((band) => band.classList.remove("is-offstage"));
        root.classList.remove("has-reveal");
      };

      if (!pointerQuery.matches) return cleanup;

      const move = (event: PointerEvent) => {
        const x = (event.clientX / innerWidth - 0.5) * 9;
        const y = (event.clientY / innerHeight - 0.5) * 9;
        if (imageRef.current) imageRef.current.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(1.015)`;
      };
      addEventListener("pointermove", move, { passive: true });
      return () => {
        removeEventListener("pointermove", move);
        if (imageRef.current) imageRef.current.style.transform = "";
        cleanup();
      };
    };

    let stop = start();
    const restart = () => { stop(); stop = start(); };
    motionQuery.addEventListener("change", restart);
    return () => {
      motionQuery.removeEventListener("change", restart);
      stop();
    };
  }, []);

  return <section className="hero shell course" aria-labelledby="hero-title" data-reveal ref={heroRef}>
    <div className="hero__content">
      <div className="hero__meta">
        <div className="hero__index" data-step>{course}</div>
        <div className="eyebrow" data-step>{kicker}</div>
      </div>
      <div className="hero__statement">
        <h1 id="hero-title" data-step>{title}</h1>
        <p data-step>{description}</p>
        <a className="scroll-cue" href="#works" data-step>{scrollLabel} ↓</a>
      </div>
    </div>
    <div className="hero__visual" data-step>
      <div className="hero__backdrop" aria-hidden="true" />
      <picture>
        <source type="image/avif" srcSet="/images/nailong-640.avif 640w, /images/nailong-960.avif 960w, /images/nailong-1254.avif 1254w" sizes="(max-width: 760px) 125vw, 93vw" />
        <source type="image/webp" srcSet="/images/nailong-640.webp 640w, /images/nailong-960.webp 960w, /images/nailong-1254.webp 1254w" sizes="(max-width: 760px) 125vw, 93vw" />
        <img ref={imageRef} className="hero__painting" src="/images/nailong.png" alt="Nailong sits laughing at a glowing last-supper table." />
      </picture>
      <div className="hero__veil" aria-hidden="true" />
    </div>
  </section>;
}
