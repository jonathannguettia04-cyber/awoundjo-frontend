// src/App.jsx
// ─────────────────────────────────────────────────────────────
//  Routeur principal Awoundjô
//  Deux réseaux ambassadeurs :
//    DIASPORA  : /diaspora/*  (Amb. Diaspora → Amb. Pays → Recruteur → Client)
//    REFERRAL  : /referral/*  (RUM → Leader → Pasteur → Responsable → Client)
//  Auth partagée via DiasporaAuth + même token JWT
// ─────────────────────────────────────────────────────────────
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { isDiasporaTokenValid } from "./diasporaApi";

import Navbar from "./components/Navbar";

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
const Commissions         = lazy(() => import("./pages/Commissions"));
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

// ── Pages ÉTABLISSEMENT ──────────────────────────────────────
const EtablissementLogin  = lazy(() => import("./pages/provider/EtablissementLogin"));
const ProviderLayout      = lazy(() => import("./pages/provider/ProviderLayout"));
const ProviderDashboard   = lazy(() => import("./pages/provider/ProviderDashboard"));
const ProviderScan        = lazy(() => import("./pages/provider/ProviderScan"));
const ProviderServices    = lazy(() => import("./pages/provider/ProviderServices"));
const ProviderMedical     = lazy(() => import("./pages/provider/ProviderMedical"));
const ProviderBilling              = lazy(() => import("./pages/provider/ProviderBilling"));
const ProviderPharmacyPrescriptions = lazy(() => import("./pages/provider/ProviderPharmacyPrescriptions"));

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
const AGENT_ROLES = ["ADMIN", "AGENT", "RESPONSABLE_COMMERCIAL", "CONSEILLERE_CLIENTELE"];

function ProtectedRoute({ children, allowedRoles = null }) {
  const { user, initializing } = useAuth();

  // Attend que le localStorage soit lu avant de décider
  if (initializing) return <PageLoader />;

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to="/" replace />;
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

// ── App ──────────────────────────────────────────────────────
export default function App() {
  const { user } = useAuth();
  // FIX : useLocation() au lieu de window.location.pathname
  //       → se met à jour à chaque navigation SPA sans re-render manqué
  const { pathname } = useLocation();

  const isClientPage   = pathname.startsWith("/client");
  const isProviderPage = pathname.startsWith("/etablissement");
  const isDiasporaPage = pathname.startsWith("/diaspora");
  const isReferralPage = pathname.startsWith("/referral");
  const showNavbar = user && !isClientPage && !isProviderPage && !isDiasporaPage && !isReferralPage;

  return (
    <div className="min-h-screen bg-slate-50">
      {showNavbar && <Navbar />}
      <main className={showNavbar ? "pt-16" : ""}>
        <Suspense fallback={<PageLoader />}>
          <Routes>

            {/* ── Auth ────────────────────────────────────── */}
            {/* FIX : la redirection après login ne se déclenche que si
                c'est un agent connecté — un provider_token seul ne redirige
                plus vers le dashboard admin */}
            <Route path="/login" element={
              user ? <Navigate to="/" replace /> : <Login />
            } />
            <Route path="/hub"   element={<ProtectedRoute><AdminHub /></ProtectedRoute>} />

            {/* ── AGENT ───────────────────────────────────── */}
            <Route path="/" element={
              <ProtectedRoute allowedRoles={AGENT_ROLES}><Dashboard /></ProtectedRoute>
            } />
            <Route path="/clients" element={
              <ProtectedRoute allowedRoles={AGENT_ROLES}><Clients /></ProtectedRoute>
            } />
            <Route path="/clients/:id" element={
              <ProtectedRoute allowedRoles={AGENT_ROLES}><ClientDetails /></ProtectedRoute>
            } />
            <Route path="/payments" element={
              <ProtectedRoute allowedRoles={["ADMIN", "AGENT", "RESPONSABLE_COMMERCIAL"]}><Payments /></ProtectedRoute>
            } />
            <Route path="/commissions" element={
              <ProtectedRoute allowedRoles={["ADMIN", "AGENT", "RESPONSABLE_COMMERCIAL"]}><Commissions /></ProtectedRoute>
            } />
            <Route path="/groups" element={
              <ProtectedRoute allowedRoles={["ADMIN", "AGENT", "RESPONSABLE_COMMERCIAL", "CONSEILLERE_CLIENTELE"]}><Groups /></ProtectedRoute>
            } />
            <Route path="/agents" element={
              <ProtectedRoute allowedRoles={["ADMIN", "RESPONSABLE_COMMERCIAL"]}><Agents /></ProtectedRoute>
            } />
            <Route path="/healthcare" element={
              <ProtectedRoute allowedRoles={["ADMIN", "CONSEILLERE_CLIENTELE"]}><HealthcareAdmin /></ProtectedRoute>
            } />
            <Route path="/admin/providers" element={
              <ProtectedRoute allowedRoles={["ADMIN", "CONSEILLERE_CLIENTELE"]}><AdminProviders /></ProtectedRoute>
            } />

            {/* ── ADMIN — ambassadeurs & credentials ──────── */}
            <Route path="/admin/diaspora" element={
              <ProtectedRoute allowedRoles={["ADMIN"]}><AdminDiaspora /></ProtectedRoute>
            } />
            <Route path="/admin/federation" element={
              <ProtectedRoute allowedRoles={["ADMIN"]}><AdminFederation /></ProtectedRoute>
            } />
            <Route path="/admin/credentials" element={
              <ProtectedRoute allowedRoles={["ADMIN"]}><AdminCredentials /></ProtectedRoute>
            } />

            {/* ── ADMIN — outils ──────────────────────────── */}
            <Route path="/admin/exports" element={
              <ProtectedRoute allowedRoles={["ADMIN"]}><AdminExports /></ProtectedRoute>
            } />
            <Route path="/admin/clients/validation" element={
              <ProtectedRoute allowedRoles={["ADMIN"]}><AdminValidationClients /></ProtectedRoute>
            } />
            <Route path="/admin/clients/reset-password" element={
              <ProtectedRoute allowedRoles={["ADMIN"]}><AdminResetPassword /></ProtectedRoute>
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
              <Route path="scan"              element={<ProviderScan />} />
              <Route path="search"            element={<ProviderScan />} />
              <Route path="services"          element={<ProviderServices />} />
              <Route path="services/new"      element={<ProviderServices />} />
              <Route path="medical/:clientId" element={<ProviderMedical />} />
              <Route path="medical"           element={<ProviderScan />} />
              <Route path="billing"           element={<ProviderBilling />} />
              <Route path="history"           element={<ProviderServices />} />
              <Route path="profile"           element={<ProviderDashboard />} />
              <Route path="prescriptions"     element={<ProviderPharmacyPrescriptions />} />
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
            </Route>

            {/* ── Fallback ─────────────────────────────────── */}
            {/* FIX : un provider connecté ne doit pas atterrir sur /login agent */}
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
