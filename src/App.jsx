import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
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

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      {user && <Navbar />}
      <main className={user ? "pt-16" : ""}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
          <Route path="/clients/:id" element={<ProtectedRoute><ClientDetails /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
          <Route path="/commissions" element={<ProtectedRoute><Commissions /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
          <Route path="/healthcare" element={<ProtectedRoute adminOnly><HealthcareAdmin /></ProtectedRoute>} />
          <Route path="/agents" element={<ProtectedRoute adminOnly><Agents /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
