// src/App.jsx
// ─────────────────────────────────────────────────────────────
//  Routeur principal Awoundjô
//  Deux réseaux ambassadeurs :
//    DIASPORA  : /diaspora/*  (Amb. Diaspora → Amb. Pays → Recruteur → Client)
//    REFERRAL  : /referral/*  (RUM → Leader → Pasteur → Responsable → Client)
//    AFFILIE   : /affilie/*   (Directrice → Leader → Superviseur → Recruteur)
//  Auth partagée via DiasporaAuth + même token JWT
// ─────────────────────────────────────────────────────────────
import { lazy, Suspense, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useRole } from "./context/RoleContext";
import { isDiasporaTokenValid } from "./diasporaApi";
import BusinessAuth from "./pages/business/BusinessAuth";

import Sidebar from "./components/Sidebar";

// ── Helper localStorage sécurisé (mobile / iOS privé) ────────
function safeLocalStorage(method, ...args) {
  try { return localStorage[method](...args); } catch { return null; }
}

// ── Pages AGENT ──────────────────────────────────────────────
const Login               = lazy(() => import("./pages/Login"));
const Dashboard           = lazy(() => import("./pages/Dashboard"));
const AdminHub            = lazy(() => import("./pages/AdminHub"));
const Clients             = lazy(() => import("./pages/Clients"));
const ClientDetails       = lazy(() => import("./pages/ClientDetails"));
const Payments            = lazy(() => import("./pages/Payments"));
const Agents              = lazy(() => import("./pages/Agents"));
const AgentsRoles          = lazy(() => import("./pages/admin/AgentsRoles"));
const Settings             = lazy(() => import("./pages/Settings"));
const Commissions         = lazy(() => import("./pages/Commissions"));
const Cotations           = lazy(() => import("./pages/Cotations"));
const Groups              = lazy(() => import("./pages/Groups"));
const HealthcareAdmin     = lazy(() => import("./pages/HealthcareAdmin"));
const AdminProviders      = lazy(() => import("./pages/AdminProviders"));

// ── Pages ADMIN ambassadeurs ─────────────────────────────────
const AdminDiaspora             = lazy(() => import("./pages/AdminDiaspora"));
const AdminFederation           = lazy(() => import("./pages/AdminFederation"));
const AdminCredentials          = lazy(() => import("./pages/AdminCredentials"));

// ── Pages ADMIN — outils ─────────────────────────────────────
const AdminExports              = lazy(() => import("./pages/AdminExports"));
const AdminValidationClients    = lazy(() => import("./pages/AdminValidationClients"));
const AdminResetPassword        = lazy(() => import("./pages/AdminResetPassword"));
const AdminSmsDelivery          = lazy(() => import("./pages/AdminSmsDelivery"));

// ── Pages ADMIN — Affilié ────────────────────────────────────
const AdminAffilie              = lazy(() => import("./pages/admin/AdminAffilie"));

// ── Pages ADMIN — Business ───────────────────────────────────
const AdminBusiness             = lazy(() => import("./pages/AdminBusiness"));

// ── Pages ADMIN — CNEPECI ────────────────────────────────────
const AdminCnepeci              = lazy(() => import("./pages/AdminCnepeci"));

// ── Pages ADMIN — Blog ───────────────────────────────────────
const AdminBlog                 = lazy(() => import("./pages/AdminBlog"));

// ── Pages ADMIN — Broadcast ──────────────────────────────────
const AdminBroadcasts           = lazy(() => import("./pages/admin/AdminBroadcasts"));

// ── Portail CNEPECI ──────────────────────────────────────────
const CnepeciApp                = lazy(() => import("./pages/cnepeci/cnepeci-dashboard"));

// ── Pages CLIENT ─────────────────────────────────────────────
const ClientLogin         = lazy(() => import("./pages/client/ClientLogin"));
const ClientLayout        = lazy(() => import("./pages/client/ClientLayout"));
const ClientDashboard     = lazy(() => import("./pages/client/ClientDashboard"));
const ClientCarte         = lazy(() => import("./pages/client/ClientCarte"));
const ClientCotisations   = lazy(() => import("./pages/client/ClientCotisations"));
const ClientFamille       = lazy(() => import("./pages/client/ClientFamille"));
const ClientDossier       = lazy(() => import("./pages/client/ClientDossier"));
const ClientTeleconsult   = lazy(() => import("./pages/client/ClientTeleconsult"));
const ClientReseau        = lazy(() => import("./pages/client/ClientReseau"));
const ClientProfil        = lazy(() => import("./pages/client/ClientProfil"));

// ── Espace MÉDECIN (téléconsultation) ────────────────────────
const MedecinDashboard    = lazy(() => import("./pages/medecin/MedecinDashboard"));

// ── Pages ÉTABLISSEMENT ──────────────────────────────────────
const EtablissementLogin  = lazy(() => import("./pages/provider/EtablissementLogin"));
const ProviderLayout      = lazy(() => import("./pages/provider/ProviderLayout"));
const ProviderDashboard   = lazy(() => import("./pages/provider/ProviderDashboard"));
const ProviderScan        = lazy(() => import("./pages/provider/ProviderScan"));
const ProviderServices    = lazy(() => import("./pages/provider/ProviderServices"));
const ProviderMedical     = lazy(() => import("./pages/provider/ProviderMedical"));
const ProviderBilling              = lazy(() => import("./pages/provider/ProviderBilling"));
const ProviderPharmacyPrescriptions = lazy(() => import("./pages/provider/ProviderPharmacyPrescriptions"));
const ProviderExamRequests         = lazy(() => import("./pages/provider/ProviderExamRequests"));
const ProviderPriorAuth            = lazy(() => import("./pages/provider/ProviderPriorAuth"));
const ProviderDoctors              = lazy(() => import("./pages/provider/ProviderDoctors"));
// ── Redirect scan selon type de prestataire ──────────────────
// Pharmacie → ordonnances patients | Autres → prise en charge classique
function ScanRoute() {
  const data = (() => { try { return JSON.parse(localStorage.getItem('provider_data')); } catch { return null; } })();
  if (data?.type === 'pharmacy') return <Navigate to='/etablissement/prescriptions' replace />;
  return <ProviderScan />;
}

// ── Pages DIASPORA ───────────────────────────────────────────
const DiasporaAuth        = lazy(() => import("./pages/diaspora/DiasporaAuth"));
const DiasporaLayout      = lazy(() =>
  import("./pages/diaspora/DiasporaDashboard").then(m => ({ default: m.DiasporaLayout }))
);
const DiasporaDashboard   = lazy(() => import("./pages/diaspora/DiasporaDashboard"));
const DiasporaProfile     = lazy(() => import("./pages/diaspora/DiasporaProfile"));

const diasporaPage = (name) =>
  lazy(() => import("./pages/diaspora/DiasporaPages").then(m => ({ default: m[name] })));

const DiasporaPayments          = diasporaPage("DiasporaPayments");
const DiasporaNewPayment        = diasporaPage("DiasporaNewPayment");
const DiasporaEarnings          = diasporaPage("DiasporaEarnings");
const DiasporaReferral          = diasporaPage("DiasporaReferral");
const DiasporaNetwork           = diasporaPage("DiasporaNetwork");
const DiasporaLeaderboard       = diasporaPage("DiasporaLeaderboard");
const DiasporaNotifications     = diasporaPage("DiasporaNotifications");
const DiasporaRewards           = diasporaPage("DiasporaRewards");
const DiasporaRegisterPays      = diasporaPage("DiasporaRegisterPays");
const DiasporaRegisterRUM       = diasporaPage("DiasporaRegisterRUM");
const DiasporaRegisterRecruiter = diasporaPage("DiasporaRegisterRecruiter");
const DiasporaBeneficiaries     = diasporaPage("DiasporaBeneficiaries");
const DiasporaNewBeneficiary    = diasporaPage("DiasporaNewBeneficiary");
const DiasporaNewClient         = diasporaPage("DiasporaNewClient");
const DiasporaMyClients         = diasporaPage("DiasporaMyClients");
const DiasporaCards             = diasporaPage("DiasporaCards");

// ── Pages REFERRAL ───────────────────────────────────────────
const FederationLayout    = lazy(() =>
  import("./pages/federation/FederationDashboard").then(m => ({ default: m.FederationLayout }))
);
const FederationDashboard = lazy(() => import("./pages/federation/FederationDashboard"));

const referralPage = (name) =>
  lazy(() => import("./pages/federation/ReferralPages").then(m => ({ default: m[name] })));

const ReferralPayments            = referralPage("ReferralPayments");
const ReferralEarnings            = referralPage("ReferralEarnings");
const ReferralNetwork             = referralPage("ReferralNetwork");
const ReferralLeaderboard         = referralPage("ReferralLeaderboard");
const ReferralNotifications       = referralPage("ReferralNotifications");
const ReferralReferral            = referralPage("ReferralReferral");
const ReferralRewards             = referralPage("ReferralRewards");
const ReferralProfile             = referralPage("ReferralProfile");
const ReferralRegisterLeader      = referralPage("ReferralRegisterLeader");
const ReferralRegisterPasteur     = referralPage("ReferralRegisterPasteur");
const ReferralRegisterResponsable = referralPage("ReferralRegisterResponsable");
const ReferralRegisterClient      = referralPage("ReferralRegisterClient");
const ReferralClients             = referralPage("ReferralClients");
const ReferralCards               = referralPage("ReferralCards");
const FederationMyClients         = referralPage("FederationMyClients");
const FederationNewClient         = referralPage("FederationNewClient");

// ── Pages AFFILIÉ ─────────────────────────────────────────────
const AffilieAuth         = lazy(() => import("./pages/affilie/AffilieAuth"));
const AffilieLayout       = lazy(() => import("./pages/affilie/AffilieLayout"));

const affiliePage = (name) =>
  lazy(() => import("./pages/affilie/AffiliePages").then(m => ({ default: m[name] })));

const AffilieDashboard    = affiliePage("AffilieDashboard");
const AffilieCommissions  = affiliePage("AffilieCommissions");
const AffilieReseau       = affiliePage("AffilieReseau");
const AffilieNotifications= affiliePage("AffilieNotifications");
const AffilieProfil       = affiliePage("AffilieProfil");
const AffilieMembers      = affiliePage("AffilieMembers");

// ── Pages BUSINESS ───────────────────────────────────────────
// BizAuthProvider importé depuis BizAuthContext (fichier isolé)
// → pas de conflit static/dynamic avec BusinessPages.jsx
import { BizAuthProvider as BizAuthProviderComp } from "./pages/business/BizAuthContext";

const bizPage = (name) =>
  lazy(() => import("./pages/BusinessPages").then(m => ({ default: m[name] })));

const BizLayout         = bizPage("BizLayout");
const BizDashboardPage  = bizPage("BizDashboardPage");
const BizNetworkPage    = bizPage("BizNetworkPage");
const BizCommissionsPage= bizPage("BizCommissionsPage");
const BizBonusPage      = bizPage("BizBonusPage");
const BizInvitationPage = bizPage("BizInvitationPage");
const BizLeaderboardPage= bizPage("BizLeaderboardPage");
const BizMembersPage    = bizPage("BizMembersPage");
const BizClientsPage    = bizPage("BizClientsPage");
const BizCollectesPage  = bizPage("BizCollectesPage");
const BizParrainagePage = bizPage("BizParrainagePage");

// ── Page partagée : Retrait de commissions ───────────────────
const CommissionWithdrawal = lazy(() => import("./pages/shared/CommissionWithdrawal"));

// ── [COLLECTE] Page publique de collecte d'adhésion ──────────
// Accessible sans authentification via un lien token unique
// généré par l'agent depuis businessController.js
const CollectePage = lazy(() => import("./pages/collecte/CollectePage"));

// ── Hub de sélection de portail ──────────────────────────────
const PortailHub = lazy(() => import("./pages/PortailHub"));

// ── [PARRAINAGE] Page publique Business ──────────────────────
// Accessible sans authentification via lien de parrainage
// généré par un membre Business depuis /business/parrainage
const BusinessParrainagePage = lazy(() => import("./pages/parrainage/BusinessParrainagePage"));

// ── [PARRAINAGE] Page publique Client ────────────────────────
// Accessible sans authentification via lien de parrainage
// généré par un client final depuis son dashboard
const ClientParrainagePage = lazy(() => import("./pages/parrainage/ClientParrainagePage"));

// ── Landing page publique ─────────────────────────────────
const LandingPage = lazy(() => import("./pages/public/LandingPage"));
const AboutPage         = lazy(() => import("./pages/public/About"));
const FormulesPage       = lazy(() => import("./pages/public/Formules"));
const FonctionnementPage = lazy(() => import("./pages/public/Fonctionnement"));
const ReseauPage         = lazy(() => import("./pages/public/Reseau"));
const SimulateurPage     = lazy(() => import("./pages/public/Simulateur"));
const AvisPage           = lazy(() => import("./pages/public/Avis"));
const FaqPage            = lazy(() => import("./pages/public/Faq"));
const VerificationPage   = lazy(() => import("./pages/public/Verification"));
const ContactPage        = lazy(() => import("./pages/public/Contact"));
const AdhesionPage       = lazy(() => import("./pages/public/Adhesion"));
const AdhesionMerciPage  = lazy(() => import("./pages/public/AdhesionMerci"));
const AdhesionEchecPage  = lazy(() => import("./pages/public/AdhesionEchec"));
const BlogPage           = lazy(() => import("./pages/public/Blog"));
const BlogPostPage       = lazy(() => import("./pages/public/BlogPost"));
const PoliciesPage       = lazy(() => import("./pages/public/PoliciesPage"));

// ── Fallback chargement ──────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Chargement...</p>
      </div>
    </div>
  );
}

// ── Guards ───────────────────────────────────────────────────
const AGENT_ROLES = ["ADMIN", "AGENT", "RESPONSABLE_COMMERCIAL", "CONSEILLERE_CLIENTELE", "COMMUNITY_MANAGER", "APPORTEUR_AFFAIRES"];

// [SÉCURITÉ] Préfixe non devinable, isolé dans ./config/adminBase pour
// éviter tout import circulaire avec les pages (Login.jsx, api.js, etc.).
// "/" reste TOUJOURS la vitrine publique, quel que soit l'état de connexion.
import { ADMIN_BASE } from "./config/adminBase";
export { ADMIN_BASE };

// [LANDING] Pages vitrine publiques (hors "/", gérée séparément via isLandingPage)
const PUBLIC_PATHS = ["/about", "/formules", "/fonctionnement", "/reseau", "/simulateur", "/avis", "/faq", "/verification", "/contact", "/adhesion", "/adhesion/merci", "/adhesion/echec", "/blog", "/politiques"];

function ProtectedRoute({ children, allowedRoles = null, requiredPermission = null }) {
  const { user, initializing } = useAuth();
  const { can } = useRole();
  const { pathname } = useLocation();

  // Ne pas interférer avec les portails indépendants
  const isIndependentPortal = pathname.startsWith("/business") ||
    pathname.startsWith("/diaspora") || pathname.startsWith("/referral") ||
    pathname.startsWith("/affilie") || pathname.startsWith("/client") ||
    pathname.startsWith("/etablissement") || pathname.startsWith("/cnepeci") ||
    pathname.startsWith("/collecte") || // [COLLECTE] route publique exclue
    PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/blog/"); // [LANDING] pages vitrine publiques exclues
  if (isIndependentPortal) return children;

  // Attend que le localStorage soit lu avant de décider
  if (initializing) return <PageLoader />;

  if (!user) return <Navigate to={`${ADMIN_BASE}/login`} replace />;

  // Garde par permission dynamique (backoffice) — prioritaire si fournie.
  // ADMIN garde toujours accès (même filet de sécurité que côté backend).
  if (requiredPermission) {
    if (user.role !== "ADMIN" && !can(requiredPermission))
      return <Navigate to={ADMIN_BASE} replace />;
    return children;
  }

  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to={ADMIN_BASE} replace />;
  return children;
}

function ClientRoute({ children }) {
  // FIX : localStorage wrappé — ne crashe plus sur iOS privé / WebView Android
  const token = safeLocalStorage("getItem", "client_token");
  if (!token) return <Navigate to="/client/login" replace />;
  return children;
}

function ProviderRoute({ children }) {
  // FIX : clé dédiée "provider_token" — isolée du token agent
  const token = safeLocalStorage("getItem", "provider_token");
  if (!token) return <Navigate to="/etablissement/login" replace />;
  return children;
}

// Guard partagé Diaspora + Referral — même token JWT
function DiasporaGuard({ children }) {
  if (!isDiasporaTokenValid()) {
    // FIX : localStorage wrappé
    safeLocalStorage("removeItem", "diaspora_token");
    safeLocalStorage("removeItem", "diaspora_data");
    return <Navigate to="/diaspora/login" replace />;
  }
  return children;
}

// Guard Affilié — token dédié
function AffilieGuard({ children }) {
  const token = safeLocalStorage("getItem", "affilie_token");
  if (!token) return <Navigate to="/affilie/login" replace />;
  return children;
}

// Guard Business — même token JWT que Diaspora/Referral
function BizGuard({ children }) {
  const token = safeLocalStorage("getItem", "business_token");
  if (!token) return <Navigate to="/business/login" replace />;
  return children;
}


export default function App() {
  const { user } = useAuth();
  // FIX : useLocation() au lieu de window.location.pathname
  //       → se met à jour à chaque navigation SPA sans re-render manqué
  const { pathname } = useLocation();

  const isClientPage   = pathname.startsWith("/client");
  const isProviderPage = pathname.startsWith("/etablissement");
  const isDiasporaPage = pathname.startsWith("/diaspora");
  const isReferralPage = pathname.startsWith("/referral");
  const isAffiliePage  = pathname.startsWith("/affilie");
  const isBusinessPage = pathname.startsWith("/business");
  const isCnepeciPage  = pathname.startsWith("/cnepeci");
  // [COLLECTE] La page de collecte est publique — pas de navbar
  const isCollectePage  = pathname.startsWith("/collecte");
  // [PARRAINAGE CLIENT] La page publique de parrainage client — pas de navbar
  const isRejoindrePage = pathname.startsWith("/rejoindre");
  // [LANDING] "/" est TOUJOURS la vitrine publique, connecté ou non
  const isLandingPage   = pathname === "/";
  // [LANDING] Pages vitrine publiques (about, formules, etc.) — pas de navbar agent
  const isPublicPage    = PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/blog/");
  const isAgentAdminPage = pathname.startsWith(ADMIN_BASE);

  // ── Tracking PageView (Meta Pixel + Google Analytics) ────────
  // Se déclenche à chaque changement de route SPA. Le tout premier
  // PageView (chargement initial) est déjà envoyé par les scripts
  // de base dans index.html — on l'ignore ici via isFirstRender
  // pour éviter un double comptage sur la toute première page vue.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
    if (typeof window.gtag === "function") {
      window.gtag("config", "G-YN55L7L63G", { page_path: pathname });
    }
  }, [pathname]);


  const showNavbar = user && isAgentAdminPage && !isClientPage && !isProviderPage && !isDiasporaPage
    && !isReferralPage && !isAffiliePage && !isBusinessPage && !isCnepeciPage
    && !isCollectePage && !isRejoindrePage;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {showNavbar && <Sidebar />}
      <main className="flex-1 min-w-0">
        <Suspense fallback={<PageLoader />}>
          <Routes>

            {/* ── Auth (back-office agent, préfixe non devinable) ── */}
            <Route path={`${ADMIN_BASE}/login`} element={
              user ? <Navigate to={ADMIN_BASE} replace /> : <Login />
            } />
            <Route path={`${ADMIN_BASE}/hub`}      element={<ProtectedRoute><AdminHub /></ProtectedRoute>} />
            <Route path="/portail"  element={<PortailHub />} />

            {/* ── LANDING (toujours publique) ─────────────── */}
            <Route path="/" element={<LandingPage />} />
            <Route path={ADMIN_BASE} element={
              <ProtectedRoute allowedRoles={AGENT_ROLES}><Dashboard /></ProtectedRoute>
            } />
            <Route path="/about"          element={<AboutPage />} />
            <Route path="/formules"       element={<FormulesPage />} />
            <Route path="/fonctionnement" element={<FonctionnementPage />} />
            <Route path="/reseau"         element={<ReseauPage />} />
            <Route path="/simulateur"     element={<SimulateurPage />} />
            <Route path="/avis"           element={<AvisPage />} />
            <Route path="/faq"            element={<FaqPage />} />
            <Route path="/verification"   element={<VerificationPage />} />
            <Route path="/contact"        element={<ContactPage />} />
            <Route path="/adhesion"       element={<AdhesionPage />} />
            <Route path="/adhesion/merci" element={<AdhesionMerciPage />} />
            <Route path="/adhesion/echec" element={<AdhesionEchecPage />} />
            <Route path="/blog"           element={<BlogPage />} />
            <Route path="/blog/:slug"     element={<BlogPostPage />} />
            <Route path="/politiques"     element={<PoliciesPage />} />
            <Route path={`${ADMIN_BASE}/clients`} element={
              <ProtectedRoute allowedRoles={AGENT_ROLES}><Clients /></ProtectedRoute>
            } />
            <Route path={`${ADMIN_BASE}/clients/:id`} element={
              <ProtectedRoute allowedRoles={AGENT_ROLES}><ClientDetails /></ProtectedRoute>
            } />
            <Route path={`${ADMIN_BASE}/payments`} element={
              <ProtectedRoute allowedRoles={["ADMIN", "AGENT", "RESPONSABLE_COMMERCIAL"]}><Payments /></ProtectedRoute>
            } />
            <Route path={`${ADMIN_BASE}/commissions`} element={
              <ProtectedRoute allowedRoles={["ADMIN", "AGENT", "RESPONSABLE_COMMERCIAL", "APPORTEUR_AFFAIRES"]}><Commissions /></ProtectedRoute>
            } />
            <Route path={`${ADMIN_BASE}/cotations`} element={
              <ProtectedRoute requiredPermission="viewCotations"><Cotations /></ProtectedRoute>
            } />
            <Route path={`${ADMIN_BASE}/groups`} element={
              <ProtectedRoute requiredPermission="viewGroups"><Groups /></ProtectedRoute>
            } />
            <Route path={`${ADMIN_BASE}/agents`} element={
              <ProtectedRoute allowedRoles={["ADMIN", "RESPONSABLE_COMMERCIAL"]}><Agents /></ProtectedRoute>
            } />
            <Route path={`${ADMIN_BASE}/agents-roles`} element={
              <ProtectedRoute allowedRoles={["ADMIN"]}><AgentsRoles /></ProtectedRoute>
            } />
            <Route path={`${ADMIN_BASE}/settings`} element={
              <ProtectedRoute allowedRoles={["ADMIN"]}><Settings /></ProtectedRoute>
            } />
            <Route path={`${ADMIN_BASE}/healthcare`} element={
              <ProtectedRoute allowedRoles={["ADMIN", "CONSEILLERE_CLIENTELE", "COMMUNITY_MANAGER"]}><HealthcareAdmin /></ProtectedRoute>
            } />
            <Route path={`${ADMIN_BASE}/providers`} element={
              <ProtectedRoute allowedRoles={["ADMIN", "CONSEILLERE_CLIENTELE"]}><AdminProviders /></ProtectedRoute>
            } />

            {/* ── ADMIN — ambassadeurs & credentials ──────── */}
            <Route path={`${ADMIN_BASE}/diaspora`} element={
              <ProtectedRoute allowedRoles={["ADMIN"]}><AdminDiaspora /></ProtectedRoute>
            } />
            <Route path={`${ADMIN_BASE}/federation`} element={
              <ProtectedRoute allowedRoles={["ADMIN"]}><AdminFederation /></ProtectedRoute>
            } />
            <Route path={`${ADMIN_BASE}/credentials`} element={
              <ProtectedRoute allowedRoles={["ADMIN"]}><AdminCredentials /></ProtectedRoute>
            } />

            {/* ── ADMIN — outils ──────────────────────────── */}
            <Route path={`${ADMIN_BASE}/exports`} element={
              <ProtectedRoute allowedRoles={["ADMIN"]}><AdminExports /></ProtectedRoute>
            } />
            <Route path={`${ADMIN_BASE}/clients/validation`} element={
              <ProtectedRoute allowedRoles={["ADMIN"]}><AdminValidationClients /></ProtectedRoute>
            } />
            <Route path={`${ADMIN_BASE}/clients/reset-password`} element={
              <ProtectedRoute allowedRoles={["ADMIN"]}><AdminResetPassword /></ProtectedRoute>
            } />
            <Route path={`${ADMIN_BASE}/sms`} element={
              <ProtectedRoute allowedRoles={["ADMIN"]}><AdminSmsDelivery /></ProtectedRoute>
            } />

            {/* ── ADMIN — Affilié ──────────────────────────── */}
            <Route path={`${ADMIN_BASE}/affilie`} element={
              <ProtectedRoute allowedRoles={["ADMIN"]}><AdminAffilie /></ProtectedRoute>
            } />

            {/* ── ADMIN — Business ─────────────────────── */}
            <Route path={`${ADMIN_BASE}/business`} element={
              <ProtectedRoute allowedRoles={["ADMIN"]}><AdminBusiness /></ProtectedRoute>
            } />

            {/* ── ADMIN — CNEPECI ──────────────────────── */}
            <Route path={`${ADMIN_BASE}/cnepeci`} element={
              <ProtectedRoute allowedRoles={["ADMIN"]}><AdminCnepeci /></ProtectedRoute>
            } />

            {/* ── ADMIN — Blog ─────────────────────────── */}
            <Route path={`${ADMIN_BASE}/blog`} element={
              <ProtectedRoute allowedRoles={["ADMIN", "COMMUNITY_MANAGER"]}><AdminBlog /></ProtectedRoute>
            } />

            {/* ── ADMIN — Broadcast ────────────────────── */}
            <Route path={`${ADMIN_BASE}/broadcasts`} element={
              <ProtectedRoute allowedRoles={["ADMIN", "COMMUNITY_MANAGER"]}><AdminBroadcasts /></ProtectedRoute>
            } />

            {/* ── CLIENT ──────────────────────────────────── */}
            <Route path="/client/login" element={<ClientLogin />} />
            <Route path="/client" element={<ClientRoute><ClientLayout /></ClientRoute>}>
              <Route index element={<Navigate to="/client/dashboard" replace />} />
              <Route path="dashboard"        element={<ClientDashboard />} />
              <Route path="carte"            element={<ClientCarte />} />
              <Route path="cotisations"      element={<ClientCotisations />} />
              <Route path="famille"          element={<ClientFamille />} />
              <Route path="dossier"          element={<ClientDossier />} />
              <Route path="teleconsultation" element={<ClientTeleconsult />} />
              <Route path="reseau"           element={<ClientReseau />} />
              <Route path="profil"           element={<ClientProfil />} />
            </Route>

            {/* ── ÉTABLISSEMENT ───────────────────────────── */}
            {/* FIX : page login redirige vers dashboard provider si déjà connecté */}
            <Route path="/etablissement/login" element={
              safeLocalStorage("getItem", "provider_token")
                ? <Navigate to="/etablissement/dashboard" replace />
                : <EtablissementLogin />
            } />
            <Route path="/etablissement" element={<ProviderRoute><ProviderLayout /></ProviderRoute>}>
              <Route index element={<Navigate to="/etablissement/dashboard" replace />} />
              <Route path="dashboard"         element={<ProviderDashboard />} />
              <Route path="scan"              element={<ScanRoute />} />
              <Route path="search"            element={<ScanRoute />} />
              <Route path="services"          element={<ProviderServices />} />
              <Route path="services/new"      element={<ProviderServices />} />
              <Route path="medical/:clientId" element={<ProviderMedical />} />
              <Route path="medical"           element={<ScanRoute />} />
              <Route path="billing"           element={<ProviderBilling />} />
              <Route path="history"           element={<ProviderServices />} />
              <Route path="profile"           element={<ProviderDashboard />} />
              <Route path="prescriptions"     element={<ProviderPharmacyPrescriptions />} />
              <Route path="exam-requests"     element={<ProviderExamRequests />} />
              <Route path="prior-auth"        element={<ProviderPriorAuth />} />
              <Route path="doctors"           element={<ProviderDoctors />} />
            </Route>

            {/* ═══════════════════════════════════════════════
                RÉSEAU DIASPORA
            ══════════════════════════════════════════════════*/}
            <Route path="/diaspora/login" element={<DiasporaAuth />} />
            <Route path="/diaspora" element={<DiasporaGuard><DiasporaLayout /></DiasporaGuard>}>
              <Route index element={<Navigate to="/diaspora/dashboard" replace />} />
              <Route path="dashboard"              element={<DiasporaDashboard />} />
              <Route path="register-pays"          element={<DiasporaRegisterPays />} />
              <Route path="register-pays/new"      element={<DiasporaRegisterPays />} />
              <Route path="register-rum"           element={<DiasporaRegisterRUM />} />
              <Route path="register-rum/new"       element={<DiasporaRegisterRUM />} />
              <Route path="register-recruiter"     element={<DiasporaRegisterRecruiter />} />
              <Route path="register-recruiter/new" element={<DiasporaRegisterRecruiter />} />
              <Route path="clients"                element={<DiasporaBeneficiaries />} />
              <Route path="clients/new"            element={<DiasporaNewBeneficiary />} />
              <Route path="my-clients"             element={<DiasporaMyClients />} />
              <Route path="my-clients/new"         element={<DiasporaNewClient />} />
              <Route path="beneficiaries"          element={<DiasporaBeneficiaries />} />
              <Route path="beneficiaries/new"      element={<DiasporaNewBeneficiary />} />
              <Route path="cards"                  element={<DiasporaCards />} />
              <Route path="cards/new"              element={<DiasporaNewBeneficiary />} />
              <Route path="payments"               element={<DiasporaPayments />} />
              <Route path="payments/new"           element={<DiasporaNewPayment />} />
              <Route path="earnings"               element={<DiasporaEarnings />} />
              <Route path="rewards"                element={<DiasporaRewards />} />
              <Route path="referral"               element={<DiasporaReferral />} />
              <Route path="network"                element={<DiasporaNetwork />} />
              <Route path="leaderboard"            element={<DiasporaLeaderboard />} />
              <Route path="notifications"          element={<DiasporaNotifications />} />
              <Route path="profile"                element={<DiasporaProfile />} />
              <Route path="withdrawal"             element={<CommissionWithdrawal accentColor="#1B4FD8" backPath="/diaspora/earnings" />} />
            </Route>

            {/* ═══════════════════════════════════════════════
                RÉSEAU PARRAINAGE (REFERRAL)
            ══════════════════════════════════════════════════*/}
            <Route path="/referral" element={<DiasporaGuard><FederationLayout /></DiasporaGuard>}>
              <Route index element={<Navigate to="/referral/dashboard" replace />} />
              <Route path="dashboard"                  element={<FederationDashboard />} />
              <Route path="register-leader"            element={<ReferralRegisterLeader />} />
              <Route path="register-leader/new"        element={<ReferralRegisterLeader />} />
              <Route path="register-pasteur"           element={<ReferralRegisterPasteur />} />
              <Route path="register-pasteur/new"       element={<ReferralRegisterPasteur />} />
              <Route path="register-responsable"       element={<ReferralRegisterResponsable />} />
              <Route path="register-responsable/new"   element={<ReferralRegisterResponsable />} />
              <Route path="clients"                    element={<ReferralClients />} />
              <Route path="clients/new"                element={<ReferralRegisterClient />} />
              <Route path="cards"                      element={<ReferralCards />} />
              <Route path="cards/new"                  element={<ReferralRegisterClient />} />
              <Route path="payments"                   element={<ReferralPayments />} />
              <Route path="earnings"                   element={<ReferralEarnings />} />
              <Route path="rewards"                    element={<ReferralRewards />} />
              <Route path="referral"                   element={<ReferralReferral />} />
              <Route path="network"                    element={<ReferralNetwork />} />
              <Route path="leaderboard"                element={<ReferralLeaderboard />} />
              <Route path="notifications"              element={<ReferralNotifications />} />
              <Route path="profile"                    element={<ReferralProfile />} />
              <Route path="withdrawal"                 element={<CommissionWithdrawal accentColor="#7C3AED" backPath="/referral/earnings" />} />
              <Route path="my-clients"                 element={<FederationMyClients />} />
              <Route path="my-clients/new"             element={<FederationNewClient />} />
            </Route>

            {/* ═══════════════════════════════════════════════
                RÉSEAU AFFILIÉ
            ══════════════════════════════════════════════════*/}
            <Route path="/business/login"    element={<BusinessAuth />} />
            <Route path="/business/register" element={<BusinessAuth />} />
            <Route path="/affilie" element={<AffilieGuard><AffilieLayout /></AffilieGuard>}>
              <Route index                   element={<Navigate to="/affilie/dashboard" replace />} />
              <Route path="dashboard"        element={<AffilieDashboard />} />
              <Route path="commissions"      element={<AffilieCommissions />} />
              <Route path="reseau"           element={<AffilieReseau />} />
              <Route path="notifications"    element={<AffilieNotifications />} />
              <Route path="profil"           element={<AffilieProfil />} />
              <Route path="membres"          element={<AffilieMembers />} />
              <Route path="withdrawal"       element={<CommissionWithdrawal accentColor="#0D9488" backPath="/affilie/commissions" />} />
            </Route>

            {/* ═══════════════════════════════════════════════
                RÉSEAU BUSINESS
            ══════════════════════════════════════════════════*/}
            <Route path="/business/login"    element={<DiasporaAuth />} />
            <Route path="/business/register" element={<DiasporaAuth />} />
            <Route path="/business/dashboard"   element={<BizGuard><BizAuthProviderComp><BizDashboardPage /></BizAuthProviderComp></BizGuard>} />
            <Route path="/business/network"     element={<BizGuard><BizAuthProviderComp><BizNetworkPage /></BizAuthProviderComp></BizGuard>} />
            <Route path="/business/commissions" element={<BizGuard><BizAuthProviderComp><BizCommissionsPage /></BizAuthProviderComp></BizGuard>} />
            <Route path="/business/bonus"       element={<BizGuard><BizAuthProviderComp><BizBonusPage /></BizAuthProviderComp></BizGuard>} />
            <Route path="/business/invitation"  element={<BizGuard><BizAuthProviderComp><BizInvitationPage /></BizAuthProviderComp></BizGuard>} />
            <Route path="/business/leaderboard" element={<BizGuard><BizAuthProviderComp><BizLeaderboardPage /></BizAuthProviderComp></BizGuard>} />
            <Route path="/business/members"     element={<BizGuard><BizAuthProviderComp><BizMembersPage /></BizAuthProviderComp></BizGuard>} />
            <Route path="/business/collectes"   element={<BizGuard><BizAuthProviderComp><BizCollectesPage /></BizAuthProviderComp></BizGuard>} />
            <Route path="/business/clients"     element={<BizGuard><BizAuthProviderComp><BizClientsPage /></BizAuthProviderComp></BizGuard>} />
            <Route path="/business/withdrawal"  element={<BizGuard><BizAuthProviderComp><CommissionWithdrawal accentColor="#D97706" backPath="/business/commissions" /></BizAuthProviderComp></BizGuard>} />
            <Route path="/business/parrainage"  element={<BizGuard><BizAuthProviderComp><BizParrainagePage /></BizAuthProviderComp></BizGuard>} />
            <Route path="/business" element={<Navigate to="/business/dashboard" replace />} />

            {/* ═══════════════════════════════════════════════
                PORTAIL CNEPECI
            ══════════════════════════════════════════════════*/}
            <Route path="/cnepeci/login" element={<CnepeciApp />} />
            <Route path="/cnepeci/*"     element={<CnepeciApp />} />

            {/* ═══════════════════════════════════════════════
                [COLLECTE] LIEN PUBLIC CLIENT — SANS AUTH
                Route placée avant le fallback "*" pour garantir
                la priorité sur la redirection vers /login.
                Format : /collecte/:token (token 64 hex, 90 jours)
            ══════════════════════════════════════════════════*/}
            <Route path="/collecte/:token" element={<CollectePage />} />

            {/* ═══════════════════════════════════════════════
                [PARRAINAGE] LIEN PUBLIC BUSINESS — SANS AUTH
                Généré depuis /business/parrainage
                Format : /parrainage/:token
            ══════════════════════════════════════════════════*/}
            <Route path="/parrainage/:token"       element={<BusinessParrainagePage />} />
            <Route path="/parrainage/:token/merci" element={<BusinessParrainagePage />} />
            <Route path="/parrainage/:token/echec" element={<BusinessParrainagePage />} />

            {/* ═══════════════════════════════════════════════
                [PARRAINAGE] LIEN PUBLIC CLIENT — SANS AUTH
                Généré depuis le dashboard client
                Format : /rejoindre/:code
            ══════════════════════════════════════════════════*/}
            <Route path="/rejoindre/:code"       element={<ClientParrainagePage />} />
            <Route path="/rejoindre/:code/merci" element={<ClientParrainagePage />} />
            <Route path="/rejoindre/:code/echec" element={<ClientParrainagePage />} />
            {/* ═══════════════════════════════════════════════
                ESPACE MÉDECIN (téléconsultation)
                Gère sa propre auth (medecin_token) en interne
            ══════════════════════════════════════════════════*/}
            <Route path="/medecin" element={<MedecinDashboard />} />

            {/* ── Fallback ─────────────────────────────────── */}
            {/* FIX : un provider connecté ne doit pas atterrir sur /login agent */}
            {/* Route inconnue → landing page (ou dashboard provider si connecté) */}
            <Route path="*" element={
              safeLocalStorage("getItem", "provider_token")
                ? <Navigate to="/etablissement/dashboard" replace />
                : <Navigate to="/" replace />
            } />

          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
