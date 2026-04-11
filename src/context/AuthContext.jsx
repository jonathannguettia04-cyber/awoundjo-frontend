import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

// Pages qui ont leur propre système d'auth — l'auth agent ne doit pas s'y charger
const ISOLATED_PREFIXES = ["/etablissement", "/client", "/diaspora", "/referral"];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

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
        const stored = localStorage.getItem("user");
        if (stored) setUser(JSON.parse(stored));
      }
    } catch {}
    setInitializing(false);
  }, []);

  const login = useCallback(async (phone, password) => {
    setLoading(true);
    try {
      const { data } = await authAPI.login({ phone, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user",  JSON.stringify(data.user));
      setUser(data.user);
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
  }, []);

  const isAdmin = user?.role === "ADMIN";
  const isAgent = user?.role === "AGENT";

  return (
    <AuthContext.Provider value={{ user, loading, initializing, login, logout, isAdmin, isAgent }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
};
