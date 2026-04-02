// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.warn("⚠️ Variables Supabase manquantes — l'upload de fichiers ne fonctionnera pas");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

const BUCKET = "dependents-files";

/**
 * Upload un fichier (File ou Blob) vers Supabase Storage
 * Retourne l'URL publique ou null en cas d'erreur
 */
export async function uploadFile(file, folder = "photos") {
  if (!file) return null;
  try {
    const ext  = file.name?.split(".").pop() || "jpg";
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false, contentType: file.type });

    if (error) {
      console.error("❌ Upload Supabase:", error.message);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.error("❌ uploadFile:", e.message);
    return null;
  }
}
