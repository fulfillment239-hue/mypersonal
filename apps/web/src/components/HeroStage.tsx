/** Client-only hero enhancement adds restrained pointer parallax and always cleans its listener. */
import { useEffect, useRef } from "react";

interface Props { kicker: string; title: string; description: string; scrollLabel: string; }

export default function HeroStage({ kicker, title, description, scrollLabel }: Props) {
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealTargets = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = reducedMotion ? null : new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        observer?.unobserve(entry.target);
      });
    }, { threshold: 0.16 });
    document.documentElement.classList.toggle("has-reveal", !reducedMotion);
    revealTargets.forEach((target) => observer?.observe(target));
    const cleanupReveal = () => {
      observer?.disconnect();
      document.documentElement.classList.remove("has-reveal");
    };
    if (reducedMotion || !matchMedia("(pointer: fine)").matches) return cleanupReveal;

    const move = (event: PointerEvent) => {
      const x = (event.clientX / innerWidth - 0.5) * 9;
      const y = (event.clientY / innerHeight - 0.5) * 9;
      if (imageRef.current) imageRef.current.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(1.015)`;
    };
    addEventListener("pointermove", move, { passive: true });
    return () => {
      removeEventListener("pointermove", move);
      cleanupReveal();
    };
  }, []);

  return <section className="hero shell" aria-labelledby="hero-title">
    <div className="hero__content">
      <div className="hero__meta">
        <div className="hero__index">462019 / 01</div>
        <div className="eyebrow">{kicker}</div>
      </div>
      <div className="hero__statement">
        <h1 id="hero-title">{title}</h1>
        <p>{description}</p>
        <a className="scroll-cue" href="#courses">{scrollLabel} ↓</a>
      </div>
    </div>
    <div className="hero__visual">
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
