// src/App.jsx
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// ── Composants NON lazy (toujours affichés) ──────────────────
import Navbar from "./components/Navbar";

// ── Pages AGENT — lazy ───────────────────────────────────────
const Login                = lazy(() => import("./pages/Login"));
const Dashboard            = lazy(() => import("./pages/Dashboard"));
const AdminHub             = lazy(() => import("./pages/AdminHub"));
const Clients              = lazy(() => import("./pages/Clients"));
const ClientDetails        = lazy(() => import("./pages/ClientDetails"));
const Payments             = lazy(() => import("./pages/Payments"));
const Agents               = lazy(() => import("./pages/Agents"));
const Commissions          = lazy(() => import("./pages/Commissions"));
const Groups               = lazy(() => import("./pages/Groups"));
const HealthcareAdmin      = lazy(() => import("./pages/HealthcareAdmin"));
const AdminProviders       = lazy(() => import("./pages/AdminProviders"));

// ── Pages CLIENT — lazy ──────────────────────────────────────
const ClientLogin          = lazy(() => import("./pages/client/ClientLogin"));
const ClientLayout         = lazy(() => import("./pages/client/ClientLayout"));
const ClientDashboard      = lazy(() => import("./pages/client/ClientDashboard"));
const ClientCarte          = lazy(() => import("./pages/client/ClientCarte"));
const ClientCotisations    = lazy(() => import("./pages/client/ClientCotisations"));
const ClientFamille        = lazy(() => import("./pages/client/ClientFamille"));
const ClientDossier        = lazy(() => import("./pages/client/ClientDossier"));
const ClientTeleconsult    = lazy(() => import("./pages/client/ClientTeleconsult"));
const ClientReseau         = lazy(() => import("./pages/client/ClientReseau"));
const ClientProfil         = lazy(() => import("./pages/client/ClientProfil"));

// ── Pages ÉTABLISSEMENT — lazy ───────────────────────────────
const EtablissementLogin   = lazy(() => import("./pages/provider/EtablissementLogin"));
const ProviderLayout       = lazy(() => import("./pages/provider/ProviderLayout"));
const ProviderDashboard    = lazy(() => import("./pages/provider/ProviderDashboard"));
const ProviderScan         = lazy(() => import("./pages/provider/ProviderScan"));
const ProviderServices     = lazy(() => import("./pages/provider/ProviderServices"));
const ProviderMedical      = lazy(() => import("./pages/provider/ProviderMedical"));
const ProviderBilling      = lazy(() => import("./pages/provider/ProviderBilling"));

// ── Pages AMBASSADEUR DIASPORA — lazy ────────────────────────
const DiasporaAuth           = lazy(() => import("./pages/diaspora/DiasporaAuth"));
const DiasporaDashboard      = lazy(() => import("./pages/diaspora/DiasporaDashboard"));
const DiasporaLayout         = lazy(() =>
  import("./pages/diaspora/DiasporaDashboard").then((m) => ({ default: m.DiasporaLayout }))
);
const DiasporaBeneficiaries  = lazy(() =>
  import("./pages/diaspora/DiasporaPages").then((m) => ({ default: m.DiasporaBeneficiaries }))
);
const DiasporaNewBeneficiary = lazy(() =>
  import("./pages/diaspora/DiasporaPages").then((m) => ({ default: m.DiasporaNewBeneficiary }))
);
const DiasporaPayments       = lazy(() =>
  import("./pages/diaspora/DiasporaPages").then((m) => ({ default: m.DiasporaPayments }))
);
const DiasporaNewPayment     = lazy(() =>
  import("./pages/diaspora/DiasporaPages").then((m) => ({ default: m.DiasporaNewPayment }))
);
const DiasporaEarnings       = lazy(() =>
  import("./pages/diaspora/DiasporaPages").then((m) => ({ default: m.DiasporaEarnings }))
);
const DiasporaReferral       = lazy(() =>
  import("./pages/diaspora/DiasporaPages").then((m) => ({ default: m.DiasporaReferral }))
);

// ── Fallback de chargement ───────────────────────────────────
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
  if (!token) return <Navigate to="/etablissement" replace />;
  return children;
}

function DiasporaGuard({ children }) {
  const token = localStorage.getItem("diaspora_token");
  if (!token) return <Navigate to="/diaspora/login" replace />;
  return children;
}

// ── App ──────────────────────────────────────────────────────
export default function App() {
  const { user } = useAuth();
  const path = window.location.pathname;
  const isClientPage   = path.startsWith("/client");
  const isProviderPage = path.startsWith("/etablissement");
  const isDiasporaPage = path.startsWith("/diaspora");
  const showNavbar = user && !isClientPage && !isProviderPage && !isDiasporaPage;

  return (
    <div className="min-h-screen bg-slate-50">
      {showNavbar && <Navbar />}
      <main className={showNavbar ? "pt-16" : ""}>
        <Suspense fallback={<PageLoader />}>
          <Routes>

            {/* ── Authentification ────────────────────────── */}
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/hub"   element={<ProtectedRoute><AdminHub /></ProtectedRoute>} />

            {/* ── Routes AGENT ────────────────────────────── */}
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
              <ProtectedRoute allowedRoles={["ADMIN", "AGENT", "RESPONSABLE_COMMERCIAL"]}><Groups /></ProtectedRoute>
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

            {/* ── Routes CLIENT ───────────────────────────── */}
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

            {/* ── Routes ÉTABLISSEMENT ────────────────────── */}
            <Route path="/etablissement" element={<EtablissementLogin />} />
            <Route path="/etablissement" element={<ProviderRoute><ProviderLayout /></ProviderRoute>}>
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

            {/* ── Routes AMBASSADEUR DIASPORA ─────────────── */}
            <Route path="/diaspora/login" element={<DiasporaAuth />} />
            <Route path="/diaspora" element={<DiasporaGuard><DiasporaLayout /></DiasporaGuard>}>
              <Route index                    element={<Navigate to="/diaspora/dashboard" replace />} />
              <Route path="dashboard"         element={<DiasporaDashboard />} />
              <Route path="beneficiaries"     element={<DiasporaBeneficiaries />} />
              <Route path="beneficiaries/new" element={<DiasporaNewBeneficiary />} />
              <Route path="payments"          element={<DiasporaPayments />} />
              <Route path="payments/new"      element={<DiasporaNewPayment />} />
              <Route path="earnings"          element={<DiasporaEarnings />} />
              <Route path="referral"          element={<DiasporaReferral />} />
            </Route>

            {/* ── Fallback ────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </Suspense>
      </main>
    </div>
  );
}