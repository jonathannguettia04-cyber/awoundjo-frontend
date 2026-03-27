// src/App.jsx
// ─────────────────────────────────────────────────────────────
//  Routeur principal Awoundjô
//  Deux réseaux ambassadeurs :
//    DIASPORA  : /diaspora/*  (Amb. Diaspora → Amb. Pays → Recruteur → Client)
//    REFERRAL  : /referral/*  (RUM → Leader → Pasteur → Responsable → Client)
//  Auth partagée via DiasporaAuth + même token JWT
// ─────────────────────────────────────────────────────────────
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { isDiasporaTokenValid } from "./diasporaApi";

import Navbar from "./components/Navbar";

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
const AdminDiaspora       = lazy(() => import("./pages/AdminDiaspora"));
const AdminFederation     = lazy(() => import("./pages/AdminFederation"));
// Nouvelle page admin : gestion des credentials des deux réseaux
const AdminCredentials    = lazy(() => import("./pages/AdminCredentials"));

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
const ProviderBilling     = lazy(() => import("./pages/provider/ProviderBilling"));

// ── Pages DIASPORA ───────────────────────────────────────────
const DiasporaAuth        = lazy(() => import("./pages/diaspora/DiasporaAuth"));
const DiasporaLayout      = lazy(() =>
  import("./pages/diaspora/DiasporaDashboard").then(m => ({ default: m.DiasporaLayout }))
);
const DiasporaDashboard   = lazy(() => import("./pages/diaspora/DiasporaDashboard"));
const DiasporaProfile     = lazy(() => import("./pages/diaspora/DiasporaProfile"));

// Helper : importe un export nommé de DiasporaPages
const diasporaPage = (name) =>
  lazy(() => import("./pages/diaspora/DiasporaPages").then(m => ({ default: m[name] })));

// Pages communes à tous les rôles Diaspora
const DiasporaPayments          = diasporaPage("DiasporaPayments");
const DiasporaNewPayment        = diasporaPage("DiasporaNewPayment");
const DiasporaEarnings          = diasporaPage("DiasporaEarnings");
const DiasporaReferral          = diasporaPage("DiasporaReferral");
const DiasporaNetwork           = diasporaPage("DiasporaNetwork");
const DiasporaLeaderboard       = diasporaPage("DiasporaLeaderboard");
const DiasporaNotifications     = diasporaPage("DiasporaNotifications");
const DiasporaRewards           = diasporaPage("DiasporaRewards");

// Pages spécifiques AMBASSADEUR_DIASPORA
const DiasporaRegisterPays      = diasporaPage("DiasporaRegisterPays");

// Pages spécifiques AMBASSADEUR_PAYS
const DiasporaRegisterRecruiter = diasporaPage("DiasporaRegisterRecruiter");

// Pages spécifiques RECRUTEUR
const DiasporaBeneficiaries     = diasporaPage("DiasporaBeneficiaries");   // liste clients
const DiasporaNewBeneficiary    = diasporaPage("DiasporaNewBeneficiary");  // enregistrer client
const DiasporaCards             = diasporaPage("DiasporaCards");           // cartes vendues

// ── Pages REFERRAL (Réseau Parrainage) ───────────────────────
const FederationLayout    = lazy(() =>
  import("./pages/federation/FederationDashboard").then(m => ({ default: m.FederationLayout }))
);
const FederationDashboard = lazy(() => import("./pages/federation/FederationDashboard"));

// Helper : importe un export nommé de ReferralPages
const referralPage = (name) =>
  lazy(() => import("./pages/federation/ReferralPages").then(m => ({ default: m[name] })));

// Pages communes réseau Parrainage
const ReferralPayments          = referralPage("ReferralPayments");
const ReferralEarnings          = referralPage("ReferralEarnings");
const ReferralNetwork           = referralPage("ReferralNetwork");
const ReferralLeaderboard       = referralPage("ReferralLeaderboard");
const ReferralNotifications     = referralPage("ReferralNotifications");
const ReferralReferral          = referralPage("ReferralReferral");
const ReferralRewards           = referralPage("ReferralRewards");
const ReferralProfile           = referralPage("ReferralProfile");

// Pages spécifiques RUM
const ReferralRegisterLeader    = referralPage("ReferralRegisterLeader");

// Pages spécifiques LEADER
const ReferralRegisterPasteur   = referralPage("ReferralRegisterPasteur");

// Pages spécifiques PASTEUR
const ReferralRegisterResponsable = referralPage("ReferralRegisterResponsable");

// Pages spécifiques RESPONSABLE / PASTEUR (clients + cartes)
const ReferralRegisterClient    = referralPage("ReferralRegisterClient");
const ReferralClients           = referralPage("ReferralClients");
const ReferralCards             = referralPage("ReferralCards");

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
const AGENT_ROLES = ["ADMIN","AGENT","RESPONSABLE_COMMERCIAL","CONSEILLERE_CLIENTELE"];

function ProtectedRoute({ children, allowedRoles = null }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to="/" replace />;
  return children;
}

function ClientRoute({ children }) {
  const token = localStorage.getItem("client_token");
  if (!token) return <Navigate to="/client/login" replace />;
  return children;
}

function ProviderRoute({ children }) {
  const token = localStorage.getItem("provider_token");
  if (!token) return <Navigate to="/etablissement/login" replace />;
  return children;
}

// Guard partagé Diaspora + Referral — même token JWT
function DiasporaGuard({ children }) {
  if (!isDiasporaTokenValid()) {
    localStorage.removeItem("diaspora_token");
    localStorage.removeItem("diaspora_data");
    return <Navigate to="/diaspora/login" replace />;
  }
  return children;
}

// ── App ──────────────────────────────────────────────────────
export default function App() {
  const { user } = useAuth();
  const path = window.location.pathname;

  const isClientPage    = path.startsWith("/client");
  const isProviderPage  = path.startsWith("/etablissement");
  const isDiasporaPage  = path.startsWith("/diaspora");
  const isReferralPage  = path.startsWith("/referral");
  const showNavbar = user && !isClientPage && !isProviderPage && !isDiasporaPage && !isReferralPage;

  return (
    <div className="min-h-screen bg-slate-50">
      {showNavbar && <Navbar />}
      <main className={showNavbar ? "pt-16" : ""}>
        <Suspense fallback={<PageLoader />}>
          <Routes>

            {/* ── Auth ────────────────────────────────────── */}
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
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
              <ProtectedRoute allowedRoles={["ADMIN","AGENT","RESPONSABLE_COMMERCIAL","CONSEILLERE_CLIENTELE"]}><Payments /></ProtectedRoute>
            } />
            <Route path="/commissions" element={
              <ProtectedRoute allowedRoles={["ADMIN","AGENT","RESPONSABLE_COMMERCIAL","CONSEILLERE_CLIENTELE"]}><Commissions /></ProtectedRoute>
            } />
            <Route path="/groups" element={
              <ProtectedRoute allowedRoles={["ADMIN","AGENT","RESPONSABLE_COMMERCIAL","CONSEILLERE_CLIENTELE"]}><Groups /></ProtectedRoute>
            } />
            <Route path="/agents" element={
              <ProtectedRoute allowedRoles={["ADMIN","RESPONSABLE_COMMERCIAL"]}><Agents /></ProtectedRoute>
            } />
            <Route path="/healthcare" element={
              <ProtectedRoute allowedRoles={["ADMIN","CONSEILLERE_CLIENTELE"]}><HealthcareAdmin /></ProtectedRoute>
            } />
            <Route path="/admin/providers" element={
              <ProtectedRoute allowedRoles={["ADMIN"]}><AdminProviders /></ProtectedRoute>
            } />

            {/* ── ADMIN — ambassadeurs & credentials ──────── */}
            <Route path="/admin/diaspora" element={
              <ProtectedRoute allowedRoles={["ADMIN"]}><AdminDiaspora /></ProtectedRoute>
            } />
            <Route path="/admin/federation" element={
              <ProtectedRoute allowedRoles={["ADMIN"]}><AdminFederation /></ProtectedRoute>
            } />
            {/* Nouvelle page admin : voir/reset credentials tous réseaux */}
            <Route path="/admin/credentials" element={
              <ProtectedRoute allowedRoles={["ADMIN"]}><AdminCredentials /></ProtectedRoute>
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
            <Route path="/etablissement/login" element={<EtablissementLogin />} />
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
            </Route>

            {/* ═══════════════════════════════════════════════
                RÉSEAU DIASPORA
                Auth partagée : /diaspora/login
                Guard : DiasporaGuard (token JWT valide)
            ══════════════════════════════════════════════════*/}
            <Route path="/diaspora/login" element={<DiasporaAuth />} />
            <Route path="/diaspora" element={<DiasporaGuard><DiasporaLayout /></DiasporaGuard>}>
              <Route index element={<Navigate to="/diaspora/dashboard" replace />} />
              <Route path="dashboard" element={<DiasporaDashboard />} />

              {/* ── AMBASSADEUR_DIASPORA : enregistre Ambassadeurs Pays ── */}
              <Route path="register-pays"     element={<DiasporaRegisterPays />} />
              <Route path="register-pays/new" element={<DiasporaRegisterPays />} />

              {/* ── AMBASSADEUR_PAYS : enregistre Recruteurs ── */}
              <Route path="register-recruiter"     element={<DiasporaRegisterRecruiter />} />
              <Route path="register-recruiter/new" element={<DiasporaRegisterRecruiter />} />

              {/* ── RECRUTEUR : enregistre Clients ── */}
              <Route path="clients"     element={<DiasporaBeneficiaries />} />
              <Route path="clients/new" element={<DiasporaNewBeneficiary />} />
              {/* Alias legacy pour compatibilité */}
              <Route path="beneficiaries"     element={<DiasporaBeneficiaries />} />
              <Route path="beneficiaries/new" element={<DiasporaNewBeneficiary />} />

              {/* ── RECRUTEUR : cartes vendues ── */}
              <Route path="cards"     element={<DiasporaCards />} />
              <Route path="cards/new" element={<DiasporaNewBeneficiary />} />

              {/* ── Commun tous rôles Diaspora ── */}
              <Route path="payments"      element={<DiasporaPayments />} />
              <Route path="payments/new"  element={<DiasporaNewPayment />} />
              <Route path="earnings"      element={<DiasporaEarnings />} />
              <Route path="rewards"       element={<DiasporaRewards />} />
              <Route path="referral"      element={<DiasporaReferral />} />
              <Route path="network"       element={<DiasporaNetwork />} />
              <Route path="leaderboard"   element={<DiasporaLeaderboard />} />
              <Route path="notifications" element={<DiasporaNotifications />} />
              <Route path="profile"       element={<DiasporaProfile />} />
            </Route>

            {/* ═══════════════════════════════════════════════
                RÉSEAU PARRAINAGE (REFERRAL)
                Même login : /diaspora/login
                Guard : DiasporaGuard (même token JWT)
            ══════════════════════════════════════════════════*/}
            <Route path="/referral" element={<DiasporaGuard><FederationLayout /></DiasporaGuard>}>
              <Route index element={<Navigate to="/referral/dashboard" replace />} />
              <Route path="dashboard" element={<FederationDashboard />} />

              {/* ── RUM : enregistre Leaders ── */}
              <Route path="register-leader"     element={<ReferralRegisterLeader />} />
              <Route path="register-leader/new" element={<ReferralRegisterLeader />} />

              {/* ── LEADER : enregistre Pasteurs ── */}
              <Route path="register-pasteur"     element={<ReferralRegisterPasteur />} />
              <Route path="register-pasteur/new" element={<ReferralRegisterPasteur />} />

              {/* ── PASTEUR : enregistre Responsables ── */}
              <Route path="register-responsable"     element={<ReferralRegisterResponsable />} />
              <Route path="register-responsable/new" element={<ReferralRegisterResponsable />} />

              {/* ── PASTEUR / RESPONSABLE : enregistre Clients ── */}
              <Route path="clients"     element={<ReferralClients />} />
              <Route path="clients/new" element={<ReferralRegisterClient />} />

              {/* ── PASTEUR / RESPONSABLE : cartes vendues ── */}
              <Route path="cards"     element={<ReferralCards />} />
              <Route path="cards/new" element={<ReferralRegisterClient />} />

              {/* ── Commun tous rôles Referral ── */}
              <Route path="payments"      element={<ReferralPayments />} />
              <Route path="earnings"      element={<ReferralEarnings />} />
              <Route path="rewards"       element={<ReferralRewards />} />
              <Route path="referral"      element={<ReferralReferral />} />
              <Route path="network"       element={<ReferralNetwork />} />
              <Route path="leaderboard"   element={<ReferralLeaderboard />} />
              <Route path="notifications" element={<ReferralNotifications />} />
              <Route path="profile"       element={<ReferralProfile />} />
            </Route>

            {/* ── Fallback ─────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
