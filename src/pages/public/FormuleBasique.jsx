// src/pages/public/FormuleBasique.jsx
// Page dédiée à la Formule Basique (offre Awoundjô, réseau de soins existant).
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import VideoPitch from "../../components/shared/VideoPitch";
import { FORMULE_BASIQUE } from "../../data/constants";

const API_BASE = import.meta.env.VITE_API_URL || "";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || data?.message || "Erreur serveur");
  return data;
}

const METHODES = [
  { id: "orange", label: "Orange Money" },
  { id: "wave",   label: "Wave" },
  { id: "mtn",    label: "MTN MoMo" },
  { id: "moov",   label: "Moov Money" },
];

// Total de la première année = adhésion + montant (chaînes "6 000" → nombres)
const num = (s) => Number(String(s).replace(/\s/g, ""));
const fmt = (n) => n.toLocaleString("fr-FR").replace(/ /g, " ");

export default function FormuleBasique() {
  const B = FORMULE_BASIQUE;
  const TOTAL = num(B.prix_unique) + num(B.frais_adhesion);
  const [params] = useSearchParams();
  const retour = params.get("paiement"); // "ok" | "echec" (retour de Jeko)

  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "", parrain: (params.get("ref") || "").trim() });
  const [methode, setMethode] = useState("orange");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Atteindre #payer après le chargement (arrivée depuis l'accueil ou retour de Jeko)
  useEffect(() => {
    if (window.location.hash !== "#payer") return undefined;
    const t = setTimeout(() => document.getElementById("payer")?.scrollIntoView({ behavior: "auto", block: "start" }), 250);
    return () => clearTimeout(t);
  }, []);

  const set = (k) => (e) => setForm((v) => ({ ...v, [k]: e.target.value }));

  async function handlePay(e) {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim())  errs.name = "Le nom complet est requis.";
    if (form.phone.replace(/\D/g, "").length < 8) errs.phone = "Entrez un numéro de téléphone valide.";
    if (!agreed) errs.agreed = "Veuillez accepter les conditions.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    setFeedback(null);
    const BASE = window.location.origin;
    try {
      const res = await apiFetch("/api/payments/jeko/init", {
        method: "POST",
        body: JSON.stringify({
          amount: TOTAL,
          description: `Formule Basique Awoundjô — paiement unique ${B.prix_unique} F + adhésion ${B.frais_adhesion} F`,
          client_name: form.name.trim(),
          client_phone: form.phone.trim(),
          client_email: form.email.trim() || undefined,
          type: "basique",
          role: "FORMULE_BASIQUE_2026",
          form_data: {
            name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim() || undefined,
            city: form.city.trim() || undefined,
            formule_souhaitee: "BASIQUE",
            composition_souhaitee: "solo",
            montant_reservation: TOTAL,
            montant_unique: num(B.prix_unique),
            montant_adhesion: num(B.frais_adhesion),
            parrain_code: form.parrain.trim() || undefined,
          },
          jeko_method: methode,
          success_url: `${BASE}/formule-basique?paiement=ok#payer`,
          failure_url: `${BASE}/formule-basique?paiement=echec#payer`,
        }),
      });
      const redirectUrl = res?.data?.redirect_url || res?.redirect_url;
      if (redirectUrl) {
        if (typeof window.fbq === "function") {
          window.fbq("track", "InitiateCheckout", { content_name: "Formule Basique", value: TOTAL, currency: "XOF" });
        }
        window.location.href = redirectUrl;
      } else {
        setFeedback({ type: "err", msg: "Lien de paiement indisponible. Réessayez ou contactez-nous." });
      }
    } catch (err) {
      setFeedback({ type: "err", msg: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />

      <div className="awj-fb">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&display=swap');
          .awj-fb { --ink:#06223F; --navy:#01417E; --cyan:#00ADF1; --paper:#F3F7FB; --line:#D8E3EE; --grey:#46607A; --gold:#D4A843; --green:#009E60;
            font-family:'Figtree',system-ui,sans-serif; color:var(--ink); background:var(--paper); line-height:1.55; -webkit-font-smoothing:antialiased; }
          .awj-fb * { box-sizing:border-box; }
          .awj-fb h1,.awj-fb h2,.awj-fb h3 { font-family:'Bricolage Grotesque','Figtree',sans-serif; margin:0; letter-spacing:-.02em; }
          .awj-fb p { margin:0; }
          .awj-fb .wrap { max-width:1000px; margin:0 auto; padding:0 24px; }
          .awj-fb a:focus-visible { outline:3px solid var(--cyan); outline-offset:3px; }

          .awj-fb .btn { display:inline-flex; align-items:center; justify-content:center; gap:10px; font-weight:700; font-size:16px; text-decoration:none; padding:15px 28px; border-radius:12px; border:2px solid transparent; transition:transform .15s; }
          .awj-fb .btn:hover { transform:translateY(-2px); }
          .awj-fb .btn-gold { background:var(--gold); color:var(--ink); }
          .awj-fb .btn-navy { background:var(--navy); color:#fff; }
          .awj-fb .btn-line { border-color:var(--navy); color:var(--navy); }
          .awj-fb .btn-line:hover { background:var(--navy); color:#fff; }

          .awj-fb .hero { background:var(--ink); color:#fff; padding:128px 0 80px; background-image:radial-gradient(800px 600px at 100% 0%, rgba(0,173,241,.35), transparent 60%); }
          .awj-fb .pill { display:inline-block; font-size:14px; font-weight:700; padding:7px 16px; border-radius:99px; background:rgba(0,173,241,.18); color:#8FD6F7; border:1px solid rgba(0,173,241,.5); margin-bottom:22px; }
          .awj-fb .hero h1 { font-size:clamp(36px,6vw,64px); line-height:1.04; font-weight:800; max-width:16ch; }
          .awj-fb .hero .sub { margin-top:22px; font-size:19px; color:#BFD3E6; max-width:52ch; }
          .awj-fb .big { display:flex; flex-wrap:wrap; gap:14px 40px; margin-top:36px; }
          .awj-fb .big div { font-family:'Bricolage Grotesque',sans-serif; font-weight:800; font-size:clamp(40px,7vw,72px); line-height:1; color:var(--gold); }
          .awj-fb .big span { display:block; font-family:'Figtree',sans-serif; font-weight:600; font-size:16px; color:#B7D3EC; margin-top:8px; }

          .awj-fb .sec { padding:80px 0; }
          .awj-fb .sec-white { background:#fff; }
          .awj-fb h2 { font-size:clamp(28px,4.2vw,40px); line-height:1.1; font-weight:800; }
          .awj-fb .lede { color:var(--grey); font-size:18px; max-width:56ch; margin-top:14px; }

          .awj-fb .offers { margin-top:40px; display:grid; grid-template-columns:1fr 1fr; gap:20px; }
          .awj-fb .offer { background:#fff; border:1px solid var(--line); border-radius:24px; padding:36px 32px; display:flex; flex-direction:column; }
          .awj-fb .offer h3 { font-size:26px; font-weight:800; }
          .awj-fb .offer .amount { font-family:'Bricolage Grotesque',sans-serif; font-weight:800; font-size:52px; line-height:1; margin:22px 0 4px; color:var(--navy); }
          .awj-fb .offer .amount small { font-size:20px; font-weight:700; margin-left:6px; }
          .awj-fb .offer .detail { color:var(--grey); }
          .awj-fb .offer dl { margin:22px 0 28px; display:grid; gap:0; border-top:1px solid var(--line); }
          .awj-fb .offer dl div { display:flex; justify-content:space-between; gap:16px; padding:12px 0; border-bottom:1px solid var(--line); font-size:16px; }
          .awj-fb .offer dt { color:var(--grey); }
          .awj-fb .offer dd { margin:0; font-weight:700; text-align:right; }
          .awj-fb .offer .btn { margin-top:auto; }
          .awj-fb .offer.alt { background:var(--ink); color:#fff; border-color:var(--ink); }
          .awj-fb .offer.alt .amount { color:var(--gold); }
          .awj-fb .offer.alt .detail, .awj-fb .offer.alt dt { color:#B7D3EC; }
          .awj-fb .offer.alt dl, .awj-fb .offer.alt dl div { border-color:rgba(255,255,255,.18); }
          .awj-fb .offer.alt .btn-gold { width:100%; }
          .awj-fb .offer .btn-navy { width:100%; }
          .awj-fb .offer .steps { margin:22px 0 20px; padding-left:20px; display:grid; gap:10px; font-size:16px; color:#E2EEF8; }

          .awj-fb .avantages { list-style:none; margin:36px 0 0; padding:0; display:grid; grid-template-columns:1fr 1fr; gap:0 48px; }
          .awj-fb .avantages li { padding:20px 0 20px 34px; border-top:1px solid var(--line); position:relative; font-size:17px; font-weight:600; }
          .awj-fb .avantages li::before { content:""; position:absolute; left:0; top:27px; width:14px; height:14px; border-radius:4px; background:var(--green); }

          .awj-fb .next { background:var(--navy); color:#fff; padding:72px 0; }
          .awj-fb .next h2 { max-width:20ch; }
          .awj-fb .next p { color:#C6DBEE; font-size:18px; max-width:56ch; margin-top:14px; }
          .awj-fb .next .acts { display:flex; flex-wrap:wrap; gap:14px; margin-top:28px; }
          .awj-fb .next .btn-line { border-color:rgba(255,255,255,.5); color:#fff; }
          .awj-fb .next .btn-line:hover { background:#fff; color:var(--navy); }

          .awj-fb .pay { background:#fff; }
          .awj-fb .pay-grid { display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:start; }
          .awj-fb .pay form { display:grid; gap:16px; }
          .awj-fb .pay label.f { display:grid; gap:6px; font-weight:700; font-size:14px; }
          .awj-fb .pay input[type=text], .awj-fb .pay input[type=tel], .awj-fb .pay input[type=email] { font:inherit; font-weight:500; padding:13px 14px; border:1.5px solid var(--line); border-radius:10px; background:#FAFCFE; color:var(--ink); width:100%; }
          .awj-fb .pay input:focus-visible { outline:3px solid var(--cyan); outline-offset:1px; }
          .awj-fb .pay .err { color:#B42318; font-size:13px; font-weight:600; }
          .awj-fb .pay .row2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
          .awj-fb .pay .methods { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
          .awj-fb .pay .methods button { font:inherit; font-weight:700; font-size:14px; padding:13px 10px; border-radius:10px; border:2px solid var(--line); background:#fff; color:var(--grey); cursor:pointer; }
          .awj-fb .pay .methods button[aria-pressed=true] { border-color:var(--navy); color:var(--navy); background:#E9F2FB; }
          .awj-fb .pay .agree { display:flex; gap:10px; align-items:flex-start; font-size:14px; color:var(--grey); }
          .awj-fb .pay .agree input { margin-top:3px; accent-color:var(--green); }
          .awj-fb .pay .btn { width:100%; border:none; cursor:pointer; font-family:inherit; }
          .awj-fb .pay .btn[disabled] { opacity:.6; cursor:wait; }
          .awj-fb .recap { background:var(--ink); color:#fff; border-radius:24px; padding:32px; }
          .awj-fb .recap h3 { font-size:24px; font-weight:800; }
          .awj-fb .recap dl { margin:20px 0 0; border-top:1px solid rgba(255,255,255,.18); }
          .awj-fb .recap dl div { display:flex; justify-content:space-between; gap:16px; padding:12px 0; border-bottom:1px solid rgba(255,255,255,.18); }
          .awj-fb .recap dt { color:#B7D3EC; }
          .awj-fb .recap dd { margin:0; font-weight:800; }
          .awj-fb .recap p { color:#BFD3E6; margin-top:18px; font-size:15px; }
          .awj-fb .notice { border-radius:14px; padding:16px 18px; font-weight:600; margin-bottom:22px; }
          .awj-fb .notice.ok { background:#E5F6EE; color:#00593A; }
          .awj-fb .notice.ko { background:#FDECEA; color:#8A1C12; }
          @media (max-width:760px) {
            .awj-fb .pay-grid { grid-template-columns:1fr; gap:32px; }
            .awj-fb .pay .row2 { grid-template-columns:1fr; }
            .awj-fb .hero { padding:104px 0 64px; }
            .awj-fb .sec { padding:60px 0; }
            .awj-fb .offers, .awj-fb .avantages { grid-template-columns:1fr; }
            .awj-fb .offer { padding:30px 24px; }
          }
        `}</style>

        {/* ── Haut de page ── */}
        <header className="hero">
          <div className="wrap">
            <span className="pill">Nouveau, dès le 1er décembre</span>
            <h1>La Formule Basique</h1>
            <p className="sub">
              Payez moins vos soins sur le réseau existant Awoundjô : pharmacies, cliniques et hôpitaux partenaires.
            </p>
            <div className="big">
              <div>{B.reduction_pharmacie}<span>de réduction en pharmacie</span></div>
              <div>{B.remise_clinique_hopital}<span>de remise en clinique et à l'hôpital</span></div>
            </div>
          </div>
        </header>

        {/* ── Vidéo ── */}
        <VideoPitch
          title="La Formule Basique en 14 secondes"
          text="50 % de réduction en pharmacie, clinique et hôpital sur le réseau Awoundjô. Un seul paiement."
          ctaLabel="Payer maintenant"
          ctaTo="#payer"
          secondaryLabel="Voir les 4 formules 2027"
          secondaryTo="/formules"
        />

        {/* ── L'offre ── */}
        <section className="sec" id="offres">
          <div className="wrap">
            <h2>Une seule offre, un seul paiement</h2>
            <p className="lede">{B.prix_unique} F payés une fois, plus {B.frais_adhesion} F d'adhésion. Pas de mensualité. L'offre couvre uniquement la personne qui paie.</p>

            <div className="offers">
              {B.offres.map((o) => {
                const total = num(o.adhesion) + num(o.montant);
                return (
                  <article className="offer" key={o.id}>
                    <h3>{o.label}</h3>
                    <div className="amount">{o.montant}<small>F</small></div>
                    <p className="detail">en {o.frequence}</p>
                    <dl>
                      <div><dt>Paiement unique</dt><dd>{o.montant} F</dd></div>
                      <div><dt>Adhésion</dt><dd>{o.adhesion} F</dd></div>
                      <div><dt>Total à régler</dt><dd>{fmt(total)} F</dd></div>
                    </dl>
                    <a href="#payer" className="btn btn-navy">
                      Payer {fmt(total)} F
                    </a>
                  </article>
                );
              })}

              <article className="offer alt">
                <h3>Activez vos réductions</h3>
                <div className="amount">{B.parrainages_requis}<small>parrainages</small></div>
                <p className="detail">de personnes qui ont payé leurs {B.prix_unique} F</p>
                <ol className="steps">
                  <li>Vous réglez {B.prix_unique} F + {B.frais_adhesion} F d'adhésion.</li>
                  <li>Vous partagez votre lien de parrainage depuis votre espace adhérent.</li>
                  <li>{B.parrainages_requis} personnes parrainées règlent leurs {B.prix_unique} F.</li>
                  <li>Vos réductions de 50 % s'activent.</li>
                </ol>
                <p className="detail">Un parrainage compte seulement quand le paiement du filleul est confirmé.</p>
              </article>
            </div>
          </div>
        </section>

        {/* ── Paiement ── */}
        <section className="sec pay" id="payer">
          <div className="wrap">
            {retour === "ok" && (
              <div className="notice ok" role="status">
                Paiement reçu, merci. Notre équipe vous contacte sur le numéro indiqué pour activer votre carte. Pour débloquer vos réductions, parrainez {B.parrainages_requis} personnes qui paient leurs {B.prix_unique} F.
              </div>
            )}
            {retour === "echec" && (
              <div className="notice ko" role="alert">
                Le paiement n'a pas abouti. Aucun montant n'a été débité par Awoundjô. Vous pouvez réessayer ci-dessous.
              </div>
            )}
            <div className="pay-grid">
              <div>
                <h2>Payer ma Formule Basique</h2>
                <p className="lede">Paiement sécurisé par Mobile Money. Vous serez redirigé vers la page de votre opérateur.</p>
                <form onSubmit={handlePay} noValidate style={{ marginTop: 28 }}>
                  <label className="f">Nom complet
                    <input type="text" autoComplete="name" value={form.name} onChange={set("name")} />
                    {errors.name && <span className="err">{errors.name}</span>}
                  </label>
                  <label className="f">Téléphone
                    <input type="tel" autoComplete="tel" inputMode="tel" placeholder="07 00 00 00 00" value={form.phone} onChange={set("phone")} />
                    {errors.phone && <span className="err">{errors.phone}</span>}
                  </label>
                  <div className="row2">
                    <label className="f">E-mail (facultatif)
                      <input type="email" autoComplete="email" value={form.email} onChange={set("email")} />
                    </label>
                    <label className="f">Ville (facultatif)
                      <input type="text" autoComplete="address-level2" placeholder="Ex : Abidjan" value={form.city} onChange={set("city")} />
                    </label>
                  </div>
                  <label className="f">Code de parrainage (facultatif)
                    <input type="text" value={form.parrain} onChange={set("parrain")} placeholder="Si quelqu'un vous a parrainé" />
                  </label>

                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Méthode de paiement</div>
                    <div className="methods">
                      {METHODES.map((m) => (
                        <button key={m.id} type="button" aria-pressed={methode === m.id} onClick={() => setMethode(m.id)}>{m.label}</button>
                      ))}
                    </div>
                  </div>

                  <label className="agree">
                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                    <span>J'accepte les <a href="/politiques#cgu" style={{ color: "var(--navy)", fontWeight: 700 }}>conditions générales d'utilisation</a>. Je comprends que les réductions s'activent après {B.parrainages_requis} parrainages payants.</span>
                  </label>
                  {errors.agreed && <span className="err">{errors.agreed}</span>}
                  {feedback && <div className="notice ko" role="alert" style={{ marginBottom: 0 }}>{feedback.msg}</div>}

                  <button type="submit" className="btn btn-gold" disabled={submitting}>
                    {submitting ? "Redirection en cours..." : `Payer ${fmt(TOTAL)} F`}
                  </button>
                </form>
              </div>

              <aside className="recap">
                <h3>Votre commande</h3>
                <dl>
                  <div><dt>Formule Basique, une personne</dt><dd>{B.prix_unique} F</dd></div>
                  <div><dt>Adhésion</dt><dd>{B.frais_adhesion} F</dd></div>
                  <div><dt>Total à payer</dt><dd>{fmt(TOTAL)} F</dd></div>
                </dl>
                <p>Paiement unique, sans mensualité. 50 % de réduction en pharmacie, clinique et hôpital dès que vos {B.parrainages_requis} filleuls ont payé.</p>
              </aside>
            </div>
          </div>
        </section>

        {/* ── Ce que vous obtenez ── */}
        <section className="sec sec-white">
          <div className="wrap">
            <h2>Ce qui est inclus</h2>
            <ul className="avantages">
              {B.avantages.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </div>
        </section>

        {/* ── Suite ── */}
        <section className="next">
          <div className="wrap">
            <h2>Besoin d'une couverture plus large ?</h2>
            <p>
              Les formules Classic, Aisance, Harmony et Premium couvrent de 80 % à 100 % de vos soins en 2027.
              La réservation de votre place est ouverte dès maintenant pour 15 000 F.
            </p>
            <div className="acts">
              <Link to="/adhesion?type=reservation" className="btn btn-gold">Réserver ma place 2027</Link>
              <Link to="/formules" className="btn btn-line">Comparer les 4 formules</Link>
              <Link to="/reseau" className="btn btn-line">Voir le réseau de soins</Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
      <WhatsAppFloat />
    </>
  );
}
