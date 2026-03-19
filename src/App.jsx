import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// ── Interface commerciale ──────────────────────────────────────
import Navbar           from "./components/Navbar";
import Login            from "./pages/Login";
import Dashboard        from "./pages/Dashboard";
import Clients          from "./pages/Clients";
import ClientDetails    from "./pages/ClientDetails";
import Payments         from "./pages/Payments";
import Agents           from "./pages/Agents";
import Commissions      from "./pages/Commissions";
import Groups           from "./pages/Groups";
import HealthcareAdmin  from "./pages/HealthcareAdmin";

// ── Portail client ─────────────────────────────────────────────
import ClientLogin        from "./pages/client/ClientLogin";
import ClientLayout       from "./pages/client/ClientLayout";
import ClientDashboard    from "./pages/client/ClientDashboard";
import ClientCarte        from "./pages/client/ClientCarte";
import ClientCotisations  from "./pages/client/ClientCotisations";
import ClientFamille      from "./pages/client/ClientFamille";
import ClientDossier      from "./pages/client/ClientDossier";
import ClientProfil       from "./pages/client/ClientProfil";
import ClientReseau       from "./pages/client/ClientReseau";
import ClientTeleconsult  from "./pages/client/ClientTeleconsult";

// ── Guards ─────────────────────────────────────────────────────
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return children;
}

function ClientProtectedRoute({ children }) {
  const token = localStorage.getItem("client_token");
  if (!token) return <Navigate to="/client/login" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar uniquement pour l'interface commerciale */}
      {user && <Navbar />}

      <Routes>

        {/* ── Routes portail client (pas de Navbar commerciale) ── */}
        <Route path="/client/login" element={<ClientLogin />} />

        <Route path="/client" element={
          <ClientProtectedRoute>
            <ClientLayout />
          </ClientProtectedRoute>
        }>
          <Route index element={<Navigate to="/client/dashboard" replace />} />
          <Route path="dashboard"       element={<ClientDashboard />} />
          <Route path="carte"           element={<ClientCarte />} />
          <Route path="cotisations"     element={<ClientCotisations />} />
          <Route path="famille"         element={<ClientFamille />} />
          <Route path="dossier"         element={<ClientDossier />} />
          <Route path="profil"          element={<ClientProfil />} />
          <Route path="reseau"          element={<ClientReseau />} />
          <Route path="teleconsultation" element={<ClientTeleconsult />} />
        </Route>

        {/* ── Routes interface commerciale ──────────────────────── */}
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

        <Route path="/" element={
          <main className="pt-16">
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          </main>
        } />
        <Route path="/clients" element={
          <main className="pt-16">
            <ProtectedRoute><Clients /></ProtectedRoute>
          </main>
        } />
        <Route path="/clients/:id" element={
          <main className="pt-16">
            <ProtectedRoute><ClientDetails /></ProtectedRoute>
          </main>
        } />
        <Route path="/payments" element={
          <main className="pt-16">
            <ProtectedRoute><Payments /></ProtectedRoute>
          </main>
        } />
        <Route path="/commissions" element={
          <main className="pt-16">
            <ProtectedRoute><Commissions /></ProtectedRoute>
          </main>
        } />
        <Route path="/groups" element={
          <main className="pt-16">
            <ProtectedRoute><Groups /></ProtectedRoute>
          </main>
        } />
        <Route path="/healthcare" element={
          <main className="pt-16">
            <ProtectedRoute adminOnly><HealthcareAdmin /></ProtectedRoute>
          </main>
        } />
        <Route path="/agents" element={
          <main className="pt-16">
            <ProtectedRoute adminOnly><Agents /></ProtectedRoute>
          </main>
        } />

        {/* ── 404 → login commercial ────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </div>
  );
}
