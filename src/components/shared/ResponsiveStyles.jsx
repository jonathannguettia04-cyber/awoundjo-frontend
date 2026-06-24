// src/components/shared/ResponsiveStyles.jsx
// Styles globaux partagés par toutes les pages publiques Awoundjô.
// Monté une seule fois par page, juste après <Nav />.
export default function ResponsiveStyles() {
  return (
    <style>{`
      .awj-grid-2 { display: grid; grid-template-columns: 1fr 1fr; }
      .awj-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); }
      .awj-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); }
      .awj-grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); }

      @media (max-width: 900px) {
        .awj-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
        .awj-grid-5 { grid-template-columns: repeat(3, 1fr) !important; gap: 24px 16px !important; }
      }
      @media (max-width: 760px) {
        .awj-grid-2 { grid-template-columns: 1fr !important; }
        .awj-grid-3 { grid-template-columns: 1fr !important; }
        .awj-grid-5 { grid-template-columns: repeat(2, 1fr) !important; }
        .awj-section { padding-left: 18px !important; padding-right: 18px !important; }
        .awj-hero-pad { padding-top: 110px !important; padding-bottom: 56px !important; }
        .awj-page-pad { padding-top: 110px !important; padding-bottom: 56px !important; }
        h1 { line-height: 1.25 !important; }
      }
      @media (max-width: 480px) {
        .awj-grid-4 { grid-template-columns: 1fr 1fr !important; }
        .awj-grid-5 { grid-template-columns: 1fr 1fr !important; }
      }
    `}</style>
  );
}
