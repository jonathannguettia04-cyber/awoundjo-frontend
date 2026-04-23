// src/pages/business/BizAuthProvider.jsx
// ─────────────────────────────────────────────────────────────
//  Re-export isolé de BizAuthProvider depuis BizAuthContext.
//  Permet d'importer BizAuthProvider de façon STATIQUE dans App.jsx
//  sans créer de conflit avec les imports dynamiques (lazy) du
//  même fichier BusinessPages — évite le warning Vite :
//  [INEFFECTIVE_DYNAMIC_IMPORT]
// ─────────────────────────────────────────────────────────────
export { BizAuthProvider } from "./BizAuthContext";
