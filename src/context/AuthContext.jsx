import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true); // ← AJOUT

  // Lecture localStorage au montage — async-safe sur mobile
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setInitializing(false); // ← on ne bloque plus les routes
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