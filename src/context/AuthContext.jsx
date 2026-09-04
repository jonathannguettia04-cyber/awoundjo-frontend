import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authAPI, rolesAPI } from "../services/api";

const AuthContext = createContext(null);

// Pages qui ont leur propre système d'auth — l'auth agent ne doit pas s'y charger
const ISOLATED_PREFIXES = ["/etablissement", "/client", "/diaspora", "/referral"];

export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(null);
  // FIX : token est maintenant dans le state React (plus de lecture directe
  //       de localStorage à chaque render → plus de valeur null transitoire)
  const [token,        setToken]        = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [initializing, setInitializing] = useState(true);
  // Permissions EFFECTIVES de l'agent connecté, dérivées de son rôle côté
  // backend (table role_permissions — voir rolesController.getAgentPermissions).
  // Chargées après login et au montage (pas stockées en localStorage : elles
  // peuvent changer si un admin modifie les droits du rôle entre-temps).
  const [permissions,  setPermissions]  = useState([]);

  const loadPermissions = useCallback(async (agentId) => {
    if (!agentId) { setPermissions([]); return; }
    try {
      const { data } = await rolesAPI.getAgentPermissions(agentId);
      setPermissions(data.data?.permissions || data.permissions || []);
    } catch {
      setPermissions([]); // repli silencieux — can() retombera sur les permissions statiques
    }
  }, []);

  // Lecture localStorage au montage — async-safe sur mobile
  // FIX : on n'initialise PAS l'auth agent sur les pages isolées
  // (provider, client, diaspora, referral) pour éviter les conflits de token
  useEffect(() => {
    try {
      const pathname = window.location.pathname;
      const isIsolatedPage = ISOLATED_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix)
      );

      if (!isIsolatedPage) {
        const stored      = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");
        if (stored)      { const u = JSON.parse(stored); setUser(u); loadPermissions(u.id); }
        // FIX : token chargé en même temps que user — plus de désynchronisation
        if (storedToken) setToken(storedToken);
      }
    } catch {}
    setInitializing(false);
  }, [loadPermissions]);

  const login = useCallback(async (phone, password) => {
    setLoading(true);
    try {
      const { data } = await authAPI.login({ phone, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user",  JSON.stringify(data.user));
      // FIX : mise à jour simultanée de user ET token dans le state
      setUser(data.user);
      setToken(data.token);
      loadPermissions(data.user?.id);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.response?.data?.error || "Erreur de connexion" };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    // FIX : token remis à null au logout — état cohérent garanti
    setToken(null);
    setPermissions([]);
  }, []);

  const isAdmin = user?.role === "ADMIN";
  const isAgent = user?.role === "AGENT";
  // token est maintenant un vrai état React — stable, réactif, jamais null par surprise

  return (
    <AuthContext.Provider value={{ user, token, loading, initializing, permissions, login, logout, isAdmin, isAgent }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
};
