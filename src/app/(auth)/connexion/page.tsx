import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Connexion | OMBRELLE Academy",
  description: "Connectez-vous à votre espace d'apprentissage OMBRELLE Academy.",
};

function sanitizeNext(raw: string | undefined): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/")) return "/dashboard";
  if (raw.startsWith("//")) return "/dashboard";
  if (raw.startsWith("/\\")) return "/dashboard";
  if (raw.includes("://")) return "/dashboard";
  return raw;
}

export default function Page({
  searchParams,
}: {
  searchParams: { next?: string; error?: string; detail?: string };
}) {
  const safeNext = sanitizeNext(searchParams.next);
  return (
    <LoginForm
      next={safeNext}
      error={searchParams.error}
      detail={searchParams.detail}
    />
  );
}