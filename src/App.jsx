// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// ── Pages AGENT ──────────────────────────────────────────────────
import Navbar         from "./components/Navbar";
import Login          from "./pages/Login";
import Dashboard      from "./pages/Dashboard";
import Clients        from "./pages/Clients";
import ClientDetails  from "./pages/ClientDetails";
import Payments       from "./pages/Payments";
import Agents         from "./pages/Agents";
import Commissions    from "./pages/Commissions";
import Groups         from "./pages/Groups";
import HealthcareAdmin from "./pages/HealthcareAdmin";
import AdminProviders  from "./pages/AdminProviders";

// ── Pages CLIENT ─────────────────────────────────────────────────
import ClientLogin       from "./pages/client/ClientLogin";
import ClientLayout      from "./pages/client/ClientLayout";
import ClientDashboard   from "./pages/client/ClientDashboard";
import ClientCarte       from "./pages/client/ClientCarte";
import ClientCotisations from "./pages/client/ClientCotisations";
import ClientFamille     from "./pages/client/ClientFamille";
import ClientDossier     from "./pages/client/ClientDossier";
import ClientTeleconsult from "./pages/client/ClientTeleconsult";
import ClientReseau      from "./pages/client/ClientReseau";
import ClientProfil      from "./pages/client/ClientProfil";

// ── Pages ÉTABLISSEMENT ──────────────────────────────────────────
import EtablissementLogin from "./pages/provider/EtablissementLogin";
import ProviderLayout     from "./pages/provider/ProviderLayout";
import ProviderDashboard  from "./pages/provider/ProviderDashboard";
import ProviderScan       from "./pages/provider/ProviderScan";
import ProviderServices   from "./pages/provider/ProviderServices";
import ProviderMedical    from "./pages/provider/ProviderMedical";
import ProviderBilling    from "./pages/provider/ProviderBilling";

// ── Guards ───────────────────────────────────────────────────────
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
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

export default function App() {
  const { user } = useAuth();
  const path = window.location.pathname;
  const isClientPage    = path.startsWith("/client");
  const isProviderPage  = path.startsWith("/etablissement");
  const showNavbar = user && !isClientPage && !isProviderPage;

  return (
    <div className="min-h-screen bg-slate-50">
      {showNavbar && <Navbar />}
      <main className={showNavbar ? "pt-16" : ""}>
        <Routes>

          {/* ── Routes AGENT ──────────────────────────────────── */}
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
          <Route path="/clients/:id" element={<ProtectedRoute><ClientDetails /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
          <Route path="/commissions" element={<ProtectedRoute><Commissions /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
          <Route path="/agents" element={<ProtectedRoute adminOnly><Agents /></ProtectedRoute>} />
          <Route path="/healthcare" element={<ProtectedRoute adminOnly><HealthcareAdmin /></ProtectedRoute>} />
          <Route path="/admin/providers" element={<ProtectedRoute adminOnly><AdminProviders /></ProtectedRoute>} />

          {/* ── Routes CLIENT ─────────────────────────────────── */}
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

          {/* ── Routes ÉTABLISSEMENT ──────────────────────────── */}
          <Route path="/etablissement" element={<EtablissementLogin />} />
          <Route path="/etablissement" element={<ProviderRoute><ProviderLayout /></ProviderRoute>}>
            <Route path="dashboard"          element={<ProviderDashboard />} />
            <Route path="scan"               element={<ProviderScan />} />
            <Route path="search"             element={<ProviderScan />} />
            <Route path="services"           element={<ProviderServices />} />
            <Route path="services/new"       element={<ProviderServices />} />
            <Route path="medical/:clientId"  element={<ProviderMedical />} />
            <Route path="medical"            element={<ProviderScan />} />
            <Route path="billing"            element={<ProviderBilling />} />
            <Route path="history"            element={<ProviderServices />} />
            <Route path="profile"            element={<ProviderDashboard />} />
          </Route>

          {/* ── Fallback ──────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </main>
    </div>
  );
}