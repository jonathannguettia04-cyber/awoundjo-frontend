// src/pages/business/BizAuthContext.jsx
// ─────────────────────────────────────────────────────────────
//  Context d'authentification Business — fichier ISOLÉ
//  Extrait de BusinessPages.jsx pour éviter le warning Vite :
//  [INEFFECTIVE_DYNAMIC_IMPORT] — App.jsx peut l'importer en
//  statique sans bloquer le code-splitting de BusinessPages.jsx
// ─────────────────────────────────────────────────────────────
import React, {
  useState, useEffect, useCallback,
  createContext, useContext,
} from "react";

const API_BASE = import.meta.env.VITE_API_URL || "https://awoundjo-backend.up.railway.app";

async function apiBizAuth(path, options = {}) {
  const token = localStorage.getItem("business_token");
  const res = await fetch(`${API_BASE}/api/business${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export const BizAuthContext = createContext(null);

export function BizAuthProvider({ children }) {
  const [member,  setMember]  = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = localStorage.getItem("business_token");
    if (!token) { setLoading(false); return; }
    try {
      const { member: m } = await apiBizAuth("/me");
      setMember(m);
    } catch {
      localStorage.removeItem("business_token");
      localStorage.removeItem("business_data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loginCtx = (token, m) => {
    localStorage.setItem("business_token", token);
    localStorage.setItem("business_data",  JSON.stringify(m));
    setMember(m);
  };

  const logoutCtx = () => {
    localStorage.removeItem("business_token");
    localStorage.removeItem("business_data");
    setMember(null);
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#F5F3FF" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:40, height:40, border:"4px solid #7C3AED", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 12px" }} />
        <p style={{ color:"#7C3AED", fontWeight:600 }}>Chargement…</p>
      </div>
    </div>
  );

  return (
    <BizAuthContext.Provider value={{ member, loading, loginCtx, logoutCtx, reload: load }}>
      {children}
    </BizAuthContext.Provider>
  );
}

export function useBizAuth() {
  return useContext(BizAuthContext);
}
