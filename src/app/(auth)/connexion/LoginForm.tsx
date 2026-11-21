"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

function sanitizeNext(raw: string | undefined | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/")) return "/dashboard";
  if (raw.startsWith("//")) return "/dashboard";
  if (raw.startsWith("/\\")) return "/dashboard";
  if (raw.includes("://")) return "/dashboard";
  return raw;
}

function mapInitialError(code?: string, detail?: string): string | null {
  if (!code) return null;
  switch (code) {
    case "otp_expired":
    case "access_denied":
      return "Le lien de connexion a expiré. Refaites une demande.";
    case "callback":
      return "Le lien de connexion est invalide. Réessayez ou reconnectez-vous par email.";
    case "profile_missing":
      return "Profil introuvable. Contactez le support.";
    default:
      return detail || "Une erreur d'authentification est survenue.";
  }
}

export default function LoginForm({
  next,
  error: initial,
  detail,
}: {
  next: string;
  error?: string;
  detail?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(mapInitialError(initial, detail));
  const [busy, setBusy] = useState(false);

  // Si l'utilisateur est déjà connecté, on le redirige
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) router.replace(sanitizeNext(next));
      })
      .catch(() => {});
  }, [router, next]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setBusy(false);

    if (error) {
      const m = error.message.toLowerCase();
      if (m.includes("email not confirmed")) {
        setError("Confirmez votre email avant de vous connecter. Vérifiez votre boîte de réception.");
      } else if (error.status === 429 || m.includes("rate limit")) {
        setError("Trop de tentatives. Réessayez dans quelques minutes.");
      } else if (m.includes("invalid") || m.includes("credentials")) {
        setError("Email ou mot de passe incorrect.");
      } else {
        setError("Connexion impossible pour le moment. Réessayez.");
      }
      return;
    }

    window.location.href = sanitizeNext(next);
  }

  return (
    <form onSubmit={submit} className="space-y-6" aria-busy={busy}>
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Connexion</h1>
        <p className="text-sm text-slate-500 mt-1">Accédez à votre espace d'apprentissage.</p>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg bg-red-50 p-3 flex items-start gap-2 border border-red-100"
        >
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1">
            Adresse email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="login-email"
              className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors"
              type="email"
              autoComplete="email"
              required
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              aria-invalid={!!error}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
              Mot de passe
            </label>
            <Link
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              href="/mot-de-passe-oublie"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="login-password"
              className="w-full rounded-lg border border-slate-300 pl-10 pr-10 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors"
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              aria-invalid={!!error}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              onClick={() => setShowPwd(!showPwd)}
              aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              tabIndex={-1}
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        disabled={busy}
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Connexion...
          </>
        ) : (
          "Se connecter"
        )}
      </button>

      <p className="text-center text-sm text-slate-600">
        Nouveau sur la plateforme ?{" "}
        <Link
          className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
          href="/inscription"
        >
          Créer un compte
        </Link>
      </p>
    </form>
  );
}