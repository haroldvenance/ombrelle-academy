"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { Save, ArrowLeft, Image as ImageIcon, CreditCard } from "lucide-react";
import Link from "next/link";

export default function NewFormation() {
  const router = useRouter();
  const [f, setF] = useState({ 
    title: "", category: "Finance", price: "0", difficulty: "beginner", 
    duration_days: "14", description: "", cover_url: "" 
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase.from("formations").insert({
      title: f.title, 
      slug: slugify(f.title), 
      category: f.category, 
      price: Number(f.price), 
      difficulty: f.difficulty,
      duration_days: Number(f.duration_days), 
      description: f.description, 
      cover_url: f.cover_url,
      created_by: user?.id,
    }).select("id").single();

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(`/admin/formations/${data.id}`);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/formations" className="text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Nouvelle formation</h1>
          <p className="text-sm text-slate-500 mt-1">Créez la structure de base de votre formation.</p>
        </div>
      </div>

      <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Titre de la formation</label>
              <input 
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" 
                required 
                value={f.title} 
                onChange={(e) => setF({ ...f, title: e.target.value })} 
                placeholder="Ex: Maîtriser la Bourse BRVM"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-slate-400" />
                URL de l'image de couverture
              </label>
              <input 
                type="url"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" 
                value={f.cover_url} 
                onChange={(e) => setF({ ...f, cover_url: e.target.value })} 
                placeholder="https://exemple.com/image.jpg"
              />
              <p className="text-xs text-slate-500 mt-1">L'envoi direct de fichiers sera bientôt disponible.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Catégorie</label>
                <input 
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" 
                  value={f.category} 
                  onChange={(e) => setF({ ...f, category: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Prix de base (FCFA)</label>
                <input 
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" 
                  type="number" min="0" 
                  value={f.price} 
                  onChange={(e) => setF({ ...f, price: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Niveau requis</label>
                <select 
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" 
                  value={f.difficulty} 
                  onChange={(e) => setF({ ...f, difficulty: e.target.value })}
                >
                  <option value="beginner">Débutant</option>
                  <option value="intermediate">Intermédiaire</option>
                  <option value="advanced">Avancé</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Durée estimée (jours)</label>
                <input 
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" 
                  type="number" min="1" 
                  value={f.duration_days} 
                  onChange={(e) => setF({ ...f, duration_days: e.target.value })} 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea 
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" 
                rows={4} 
                value={f.description} 
                onChange={(e) => setF({ ...f, description: e.target.value })} 
              />
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-medium text-slate-900">Plans de paiement fractionné</h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">Vous pourrez configurer les options de paiement en plusieurs fois après la création de la formation.</p>
              <button type="button" disabled className="text-xs font-medium text-slate-400 bg-slate-200 px-3 py-1.5 rounded-md cursor-not-allowed">
                Configurer les plans (Bientôt)
              </button>
            </div>
          </div>
          
          {error && (
            <div className="rounded-lg bg-red-50 p-3 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
        
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-end gap-3">
          <Link href="/admin/formations" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
            Annuler
          </Link>
          <button 
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            {loading ? "Création..." : "Créer la formation"}
          </button>
        </div>
      </form>
    </div>
  );
}