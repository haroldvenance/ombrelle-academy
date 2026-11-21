"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, CheckCircle2, AlertCircle, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "pdf"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo

const PAYMENT_OPTIONS = [
  { value: "orange_money", label: "Orange Money" },
  { value: "mtn_momo", label: "MTN MoMo" },
  { value: "bank_transfer", label: "Virement bancaire" },
  { value: "cash", label: "Espèces" },
  { value: "other", label: "Autre" },
] as const;

type PaymentMethod = (typeof PAYMENT_OPTIONS)[number]["value"];

function validateFile(file: File): string | null {
  if (file.size > MAX_SIZE) return "Fichier trop volumineux (5 Mo maximum).";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.includes(ext)) {
    return "Format non supporté. Utilisez JPG, PNG, WEBP ou PDF.";
  }
  return null;
}

export default function PaymentForm({
  enrollmentId,
  userId,
  defaultAmount,
}: {
  enrollmentId: string;
  userId: string;
  defaultAmount: number;
}) {
  const router = useRouter();
  const [f, setF] = useState({
    amount: String(defaultAmount),
    method: "orange_money" as PaymentMethod,
    reference: "",
    paid_on: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMsg(null);

    const amount = Number(f.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setBusy(false);
      setMsg({ ok: false, text: "Montant invalide." });
      return;
    }

    const supabase = createClient();
    let proof: string | null = null;

    if (file) {
      const vErr = validateFile(file);
      if (vErr) {
        setBusy(false);
        setMsg({ ok: false, text: vErr });
        return;
      }
      const ext = file.name.split(".").pop()!.toLowerCase();
      proof = `${userId}/${Date.now()}.${ext}`;
      const up = await supabase.storage.from("payment-proofs").upload(proof, file);
      if (up.error) {
        setBusy(false);
        setMsg({ ok: false, text: up.error.message });
        return;
      }
    }

    const { error } = await supabase.rpc("submit_payment", {
      p_enrollment: enrollmentId,
      p_amount: amount,
      p_method: f.method,
      p_reference: f.reference.trim(),
      p_paid_on: f.paid_on || null,
      p_proof_url: proof,
    });

    if (error) {
      // Nettoyage du fichier orphelin (la ligne payments n'a pas été créée)
      if (proof) {
        await supabase.storage.from("payment-proofs").remove([proof]);
      }
      setBusy(false);
      setMsg({ ok: false, text: error.message });
      return;
    }

    setBusy(false);
    setMsg({ ok: true, text: "Paiement soumis. Un administrateur va le vérifier." });
    setF({ ...f, reference: "" });
    setFile(null);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4" aria-busy={busy}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="pay-amount" className="label">
            Montant payé
          </label>
          <input
            id="pay-amount"
            className="input"
            type="number"
            min="1"
            required
            value={f.amount}
            onChange={(e) => setF({ ...f, amount: e.target.value })}
            disabled={busy}
          />
        </div>
        <div>
          <label htmlFor="pay-method" className="label">
            Moyen de paiement
          </label>
          <select
            id="pay-method"
            className="input"
            value={f.method}
            onChange={(e) => setF({ ...f, method: e.target.value as PaymentMethod })}
            disabled={busy}
          >
            {PAYMENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pay-ref" className="label">
            Référence de transaction
          </label>
          <input
            id="pay-ref"
            className="input"
            required
            value={f.reference}
            onChange={(e) => setF({ ...f, reference: e.target.value })}
            placeholder="Ex : MP240101.1234.A56789"
            disabled={busy}
          />
        </div>
        <div>
          <label htmlFor="pay-date" className="label">
            Date du paiement
          </label>
          <input
            id="pay-date"
            className="input"
            type="date"
            value={f.paid_on}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setF({ ...f, paid_on: e.target.value })}
            disabled={busy}
          />
        </div>
      </div>

      <div>
        <label htmlFor="pay-file" className="label">
          Capture d&apos;écran (optionnel, 5 Mo max)
        </label>
        <label
          htmlFor="pay-file"
          className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          <span className="truncate">
            {file ? file.name : "Choisir un fichier (JPG, PNG, WEBP ou PDF)"}
          </span>
        </label>
        <input
          id="pay-file"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => {
            const next = e.target.files?.[0] ?? null;
            if (next) {
              const vErr = validateFile(next);
              if (vErr) {
                setMsg({ ok: false, text: vErr });
                e.target.value = "";
                setFile(null);
                return;
              }
            }
            setMsg(null);
            setFile(next);
          }}
          disabled={busy}
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Envoi…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" aria-hidden="true" /> Soumettre ma preuve de paiement
          </>
        )}
      </button>

      {msg && (
        <p
          role="alert"
          aria-live="polite"
          className={`flex items-center gap-1.5 text-sm ${
            msg.ok ? "text-emerald-700" : "text-red-600"
          }`}
        >
          {msg.ok ? (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
          )}
          {msg.text}
        </p>
      )}
    </form>
  );
}