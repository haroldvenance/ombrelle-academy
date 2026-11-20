import Link from "next/link";
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10"><Link href="/" className="mb-6 text-center text-2xl font-extrabold text-brand-800">☂️ OMBRELLE <span className="text-accent-600">Academy</span></Link><div className="card">{children}</div></main>;
}
