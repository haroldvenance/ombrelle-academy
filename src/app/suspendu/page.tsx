import SignOutButton from "@/components/SignOutButton";
export default function Suspended() {
  return <main className="mx-auto mt-24 max-w-md card space-y-3 text-center"><h1 className="text-xl font-bold">Compte suspendu</h1><p className="text-sm text-slate-600">Ton accès est temporairement suspendu. Contacte l&apos;équipe OMBRELLE.</p><SignOutButton /></main>;
}
