// src/App.jsx
// Votre App.jsx + routes /client/* ajoutées

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// ── Pages AGENT existantes (NE PAS TOUCHER) ──────────────────────
import Navbar        from "./components/Navbar";
import Login         from "./pages/Login";
import Dashboard     from "./pages/Dashboard";
import Clients       from "./pages/Clients";
import ClientDetails from "./pages/ClientDetails";
import Payments      from "./pages/Payments";
import Agents        from "./pages/Agents";
import Commissions   from "./pages/Commissions";
import Groups        from "./pages/Groups";

// ✅ Pages CLIENT — nouvelles
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

export default function App() {
  const { user } = useAuth();
  const isClientPage = window.location.pathname.startsWith("/client");

  return (
    <div className="min-h-screen bg-slate-50">
      {user && !isClientPage && <Navbar />}
      <main className={user && !isClientPage ? "pt-16" : ""}>
        <Routes>

          {/* ── Routes AGENT (inchangées) ─────────────────────── */}
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
          <Route path="/clients/:id" element={<ProtectedRoute><ClientDetails /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
          <Route path="/commissions" element={<ProtectedRoute><Commissions /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
          <Route path="/agents" element={<ProtectedRoute adminOnly><Agents /></ProtectedRoute>} />

          {/* ✅ Routes CLIENT ────────────────────────────────── */}
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
