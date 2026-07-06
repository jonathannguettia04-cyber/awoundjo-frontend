// src/pages/AdminBlog.jsx
// Gestion des articles de blog depuis l'admin.
// Style aligné sur Dashboard.jsx (thème sombre, awj-card, awj-link, etc.)
//
// ⚠️ Adapter si besoin :
//  - VITE_API_URL (déjà utilisé ailleurs dans le projet)
//  - la clé localStorage du token si différente de "token"

import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "";
const CATEGORIES = ["Actualités", "Conseils", "Pratique"];

function authHeaders(extra = {}) {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}`, ...extra };
}

async function api(path, options = {}) {
  const res = await fetch(`${API}/api${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Erreur serveur");
  return data;
}

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const emptyForm = {
  id: null,
  title: "",
  excerpt: "",
  content: "",
  category: "Actualités",
  image: "",
  published: true,
};

export default function AdminBlog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function loadPosts() {
    setLoading(true);
    try {
      const data = await api("/admin/blog");
      setPosts(data.data || data || []);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPosts(); }, []);

  function openCreate() {
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(post) {
    setForm({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content || "",
      category: post.category,
      image: post.image || "",
      published: post.published,
    });
    setShowForm(true);
  }

  async function handleImageUpload(file) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`${API}/api/admin/blog/upload`, {
        method: "POST",
        headers: authHeaders(),
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Échec de l'upload");
      const url = data.data?.url || data.url;
      setForm((f) => ({ ...f, image: url }));
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (form.id) {
        await api(`/admin/blog/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await api("/admin/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      setShowForm(false);
      await loadPosts();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(post) {
    if (!confirm(`Supprimer l'article "${post.title}" ? Cette action est irréversible.`)) return;
    try {
      await api(`/admin/blog/${post.id}`, { method: "DELETE" });
      await loadPosts();
    } catch (e) {
      setError(e.message);
    }
  }

  async function togglePublish(post) {
    try {
      await api(`/admin/blog/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !post.published }),
      });
      await loadPosts();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div style={{ background: "#0a1628", minHeight: "100vh" }}>
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>📝 Gestion du blog</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>
            Créez, modifiez et publiez les articles affichés sur la page publique /blog.
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            background: "#00c4b4", color: "#0a1628", border: "none", fontWeight: 700, fontSize: 13,
            padding: "11px 20px", borderRadius: 10, cursor: "pointer",
          }}
        >
          + Nouvel article
        </button>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "10px 16px", borderRadius: 10, fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* ── FORMULAIRE CRÉER/ÉDITER ─────────────────────────── */}
      {showForm && (
        <form onSubmit={handleSave} className="awj-card" style={{ padding: 24, marginBottom: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 18px" }}>
            {form.id ? "Modifier l'article" : "Nouvel article"}
          </h2>

          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={labelStyle}>Titre</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={inputStyle}
                placeholder="Titre de l'article"
              />
            </div>

            <div>
              <label style={labelStyle}>Extrait (résumé affiché sur la liste)</label>
              <textarea
                required
                rows={2}
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                style={{ ...inputStyle, resize: "vertical" }}
                placeholder="Résumé court de l'article"
              />
            </div>

            <div>
              <label style={labelStyle}>Contenu complet</label>
              <textarea
                rows={8}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                style={{ ...inputStyle, resize: "vertical" }}
                placeholder="Texte complet de l'article (affiché sur la page détail)"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Catégorie</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={inputStyle}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Statut</label>
                <select
                  value={form.published ? "1" : "0"}
                  onChange={(e) => setForm({ ...form, published: e.target.value === "1" })}
                  style={inputStyle}
                >
                  <option value="1">Publié</option>
                  <option value="0">Brouillon</option>
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Image principale</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files?.[0])}
                style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}
              />
              {uploading && <p style={{ fontSize: 12, color: "#00c4b4", marginTop: 6 }}>Upload en cours…</p>}
              {form.image && (
                <img
                  src={form.image}
                  alt="Aperçu"
                  style={{ marginTop: 10, width: 200, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)" }}
                />
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <button type="submit" disabled={saving} style={{
              background: "#00c4b4", color: "#0a1628", border: "none", fontWeight: 700, fontSize: 13,
              padding: "11px 22px", borderRadius: 10, cursor: "pointer", opacity: saving ? 0.6 : 1,
            }}>
              {saving ? "Enregistrement…" : form.id ? "Enregistrer" : "Publier l'article"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{
              background: "transparent", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.15)",
              fontWeight: 600, fontSize: 13, padding: "11px 22px", borderRadius: 10, cursor: "pointer",
            }}>
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* ── LISTE DES ARTICLES ──────────────────────────────── */}
      <div className="awj-card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: "#fff" }}>Tous les articles ({posts.length})</p>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 12, padding: "40px 0" }}>Chargement…</p>
        ) : !posts.length ? (
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 12, padding: "40px 0" }}>Aucun article pour le moment.</p>
        ) : posts.map((post) => (
          <div key={post.id} className="awj-row-item" style={{ alignItems: "flex-start" }}>
            {post.image ? (
              <img src={post.image} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 10, background: "rgba(255,255,255,0.05)", flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: "#fff", display: "block" }}>{post.title}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", display: "block", marginTop: 2 }}>
                {post.category} · {fmtDate(post.created_at)} {!post.published && "· Brouillon"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={() => togglePublish(post)} style={smallBtnStyle}>
                {post.published ? "Dépublier" : "Publier"}
              </button>
              <button onClick={() => openEdit(post)} style={smallBtnStyle}>Modifier</button>
              <button onClick={() => handleDelete(post)} style={{ ...smallBtnStyle, color: "#f87171", borderColor: "rgba(239,68,68,0.25)" }}>
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}

const labelStyle = {
  display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 6,
};

const inputStyle = {
  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, boxSizing: "border-box",
  fontFamily: "inherit",
};

const smallBtnStyle = {
  background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)",
  fontSize: 11.5, fontWeight: 600, padding: "7px 12px", borderRadius: 8, cursor: "pointer",
};
