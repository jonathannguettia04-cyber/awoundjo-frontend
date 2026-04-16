// ═══════════════════════════════════════════════════════════════
//  3. RÉSEAU  — remplace l'export AffilieReseau dans AffiliePages.jsx
// ═══════════════════════════════════════════════════════════════
export function AffilieReseau() {
  const [network, setNetwork] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("ALL");

  useEffect(() => {
    apiFetch(`${BASE}/api/affilie/network`)
      .then(r => r?.json())
      .then(d => { setNetwork(d?.data?.network || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const roles    = ["ALL", "LEADER_AFF", "SUPERVISEUR_AFF", "RECRUTEUR_AFF"];
  const filtered = filter === "ALL" ? network : network.filter(m => m.role === filter);
  const counts   = {};
  network.forEach(m => { counts[m.role] = (counts[m.role] || 0) + 1; });

  return (
    <div>
      <PageTitle>🌐 Mon réseau</PageTitle>

      {/* Stats par rôle */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        {["LEADER_AFF", "SUPERVISEUR_AFF", "RECRUTEUR_AFF"].map(r => (
          <StatCard key={r}
            icon={ROLE_LABELS[r].split(" ")[0]}
            label={ROLE_LABELS[r].split(" ").slice(1).join(" ")}
            value={counts[r] || 0}
            color={C.primary}
          />
        ))}
        <StatCard icon="🌐" label="Total réseau" value={network.length} color={C.primaryD} />
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {roles.map(r => (
          <button key={r} onClick={() => setFilter(r)} style={{
            padding: "7px 14px", borderRadius: 20,
            border: `1.5px solid ${filter === r ? C.primary : C.border}`,
            background: filter === r ? C.primaryL : "#fff",
            color: filter === r ? C.primary : C.slate,
            fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>
            {r === "ALL" ? "Tous" : ROLE_LABELS[r]?.split(" ").slice(1).join(" ") || r}
            <span style={{ marginLeft: 5, opacity: .7 }}>
              ({r === "ALL" ? network.length : counts[r] || 0})
            </span>
          </button>
        ))}
      </div>

      {/* Liste */}
      <div style={{ background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <EmptyState icon="🌱" text="Aucun membre dans votre réseau" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.bg, fontSize: 12, color: C.slate, fontWeight: 700 }}>
                  {["Nom", "Rôle", "Niveau", "Statut", "Inscrit le"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={m.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? "#fff" : C.bg }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: C.dark, fontSize: 14 }}>{m.name}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge text={ROLE_LABELS[m.role] || m.role} color={C.primary} bg={C.primaryL} />
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: C.slate }}>N+{m.depth}</td>
                    <td style={{ padding: "12px 16px" }}><StatusBadge status={m.status} /></td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.slate, whiteSpace: "nowrap" }}>
                      {new Date(m.created_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
