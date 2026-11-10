// src/components/shared/VideoPitch.jsx
// Vidéo de présentation (format vertical), chargée seulement quand elle approche de l'écran.
// Fichiers attendus dans public/videos/ : awoundjo-presentation.mp4 et awoundjo-presentation.jpg
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const VIDEO_SRC = "/videos/awoundjo-presentation.mp4";
const VIDEO_POSTER = "/videos/awoundjo-presentation.jpg";

export default function VideoPitch({
  title = "Une facture de consultation ne devrait pas décider de vos soins",
  text = "Avec Awoundjô, vous cotisez à l'avance et la mutuelle prend en charge une part de vos soins. 14 secondes pour comprendre.",
  ctaLabel = "Réserver ma place",
  ctaTo = "/formule-basique#payer",
  secondaryLabel,
  secondaryTo,
  dark = false,
}) {
  const boxRef = useRef(null);
  const vidRef = useRef(null);
  const [load, setLoad] = useState(false);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);

  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    if (!("IntersectionObserver" in window)) { setLoad(true); return undefined; }
    const io = new IntersectionObserver(([e]) => {
      const v = vidRef.current;
      if (e.isIntersecting) { setLoad(true); if (v && !reduced()) v.play().catch(() => {}); }
      else if (v) v.pause();
    }, { rootMargin: "200px 0px", threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (failed) return null;
  return (
    <section className={`awj-vp ${dark ? "awj-vp-dark" : ""}`} id="presentation">
      <div className="awj-vp-grid">
        <div className="awj-vp-frame" ref={boxRef}>
          <video
            ref={vidRef}
            poster={VIDEO_POSTER}
            muted={muted}
            loop playsInline preload="none"
            controls={false}
            aria-label="Présentation de la mutuelle Awoundjô"
            onLoadedData={() => { const v = vidRef.current; if (v && !reduced()) v.play().catch(() => {}); }}
            onError={() => setFailed(true)}
          >
            {load && <source src={VIDEO_SRC} type="video/mp4" onError={() => setFailed(true)} />}
          </video>
          <button type="button" className="awj-vp-sound" onClick={() => { setMuted((m) => !m); vidRef.current?.play().catch(() => {}); }}>
            {muted ? "Activer le son" : "Couper le son"}
          </button>
        </div>
        <div className="awj-vp-text">
          <h2>{title}</h2>
          <p>{text}</p>
          <div className="awj-vp-acts">
            {ctaTo.includes("#")
              ? <a href={ctaTo} className="awj-vp-btn awj-vp-btn-main">{ctaLabel}</a>
              : <Link to={ctaTo} className="awj-vp-btn awj-vp-btn-main">{ctaLabel}</Link>}
            {secondaryTo && <Link to={secondaryTo} className="awj-vp-btn awj-vp-btn-line">{secondaryLabel}</Link>}
          </div>
        </div>
      </div>
      <style>{`
        .awj-vp { padding: 80px 24px; background: #fff; color: #06223F; font-family: 'Figtree', system-ui, sans-serif; }
        .awj-vp-dark { background: #06223F; color: #fff; }
        .awj-vp-grid { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: minmax(240px, 300px) 1fr; gap: 56px; align-items: center; }
        .awj-vp-frame { position: relative; aspect-ratio: 9 / 16; border-radius: 28px; overflow: hidden; background: #06223F; box-shadow: 0 0 0 8px #0B2A4A, 0 24px 48px rgba(6,34,63,.28); }
        .awj-vp-dark .awj-vp-frame { box-shadow: 0 0 0 8px #12395F, 0 24px 48px rgba(0,0,0,.4); }
        .awj-vp-frame video { width: 100%; height: 100%; object-fit: cover; display: block; }
        .awj-vp-sound { position: absolute; left: 12px; right: 12px; bottom: 12px; border: 0; border-radius: 10px; padding: 10px; font: 700 14px 'Figtree', sans-serif; background: rgba(6,34,63,.82); color: #fff; cursor: pointer; }
        .awj-vp-sound:focus-visible, .awj-vp-btn:focus-visible { outline: 3px solid #00ADF1; outline-offset: 3px; }
        .awj-vp-text h2 { font-family: 'Bricolage Grotesque', 'Figtree', sans-serif; font-weight: 800; letter-spacing: -.02em; line-height: 1.1; font-size: clamp(28px, 4.2vw, 40px); max-width: 20ch; margin: 0; }
        .awj-vp-text p { font-size: 18px; max-width: 52ch; margin: 16px 0 0; color: #46607A; }
        .awj-vp-dark .awj-vp-text p { color: #BFD3E6; }
        .awj-vp-acts { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 28px; }
        .awj-vp-btn { display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; text-decoration: none; padding: 15px 28px; border-radius: 12px; border: 2px solid transparent; transition: transform .15s; }
        .awj-vp-btn:hover { transform: translateY(-2px); }
        .awj-vp-btn-main { background: #D4A843; color: #06223F; }
        .awj-vp-btn-line { border-color: #01417E; color: #01417E; }
        .awj-vp-dark .awj-vp-btn-line { border-color: rgba(255,255,255,.5); color: #fff; }
        @media (max-width: 720px) {
          .awj-vp { padding: 60px 24px; }
          .awj-vp-grid { grid-template-columns: 1fr; gap: 32px; justify-items: center; }
          .awj-vp-frame { width: min(280px, 100%); }
          .awj-vp-text { justify-self: stretch; }
        }
        @media (prefers-reduced-motion: reduce) { .awj-vp-btn { transition: none; } }
      `}</style>
    </section>
  );
}
