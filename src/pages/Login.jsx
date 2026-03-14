import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]   = useState({ phone: "", password: "" });
  const [error, setError] = useState("");
  const [show,  setShow]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const res = await login(form.phone.trim(), form.password);
    if (res.success) navigate("/");
    else setError(res.error);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">

          {/* Header */}
          <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-8 text-center">
            <div className="flex justify-center mb-3">
              <img src="/logo-awoundjo.jpg" alt="Awoundjô" className="w-20 h-20 rounded-xl object-cover object-top shadow-lg" />
            </div>
            <h1 className="text-2xl font-bold text-white">Awoundjô</h1>
            <p className="text-white/70 text-sm mt-1">Mutuelle Santé · Côte d'Ivoire</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Connexion</h2>
              <p className="text-slate-500 text-sm mt-0.5">Accédez à votre espace de gestion</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                <input
                  type="text"
                  placeholder="Ex : 0701234567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
                  >
                    {show ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/50 text-xs mt-6">
          © {new Date().getFullYear()} Awoundjô · Tous droits réservés
        </p>
      </div>
    </div>
  );
}
