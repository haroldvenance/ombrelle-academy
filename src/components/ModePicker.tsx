"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MODE_LABEL } from "@/lib/utils";

export default function ModePicker({ enrollmentId, current }: { enrollmentId: string; current: string }) {
  const router = useRouter();
  const [mode, setMode] = useState(current);
  async function change(m: string) {
    setMode(m);
    await createClient().rpc("set_learning_mode", { p_enrollment: enrollmentId, p_mode: m });
    router.refresh();
  }
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-slate-500">Mode :</span>
      {(["classic", "interactive", "intensive"] as const).map((m) => (
        <button key={m} onClick={() => change(m)} className={`chip ${mode === m ? "!bg-brand-700 !text-white" : ""}`}>{MODE_LABEL[m]}</button>
      ))}
    </div>
  );
}
