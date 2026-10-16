import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente seguro de Supabase para el backend.
 * Nunca exportar claves de servicio con prefijo NEXT_PUBLIC_ ni al navegador.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://mock-supabase.agrochain.local";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "mock-anon-key";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";

/**
 * Determina si hay una instancia real y alcanzable de Supabase configurada en las variables de entorno.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  return Boolean(
    url &&
    !url.includes("mock-supabase") &&
    !url.includes("your-project") &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

/**
 * Cliente estándar que opera con la identidad y permisos RLS del usuario autenticado.
 * Acepta el token JWT enviado en el header Authorization.
 */
export function createAuthenticatedServerClient(authHeader?: string | null) {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}

/**
 * Cliente administrativo (Service Role) con privilegios de backend.
 * EXCLUSIVO DEL SERVIDOR.
 * Utilizado para persistir estados verificados de blockchain, hashes de transacciones y saldos sincronizados.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("FATAL SECURITY VIOLATION: createAdminClient can only be invoked within server environments!");
  }

  // Si no hay clave real configurada en el entorno actual de demo, permitimos fallback seguro controlado
  const key = supabaseServiceRoleKey || supabaseAnonKey;

  return createSupabaseClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
