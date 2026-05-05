import { supabase } from "@/integrations/supabase/client";

export type CatalogoNombre = "arl" | "sector_economico";

export interface CatalogoOpcion {
  id: string;
  catalogo: CatalogoNombre;
  value: string;
  label: string;
  activo: boolean;
  es_base: boolean;
  orden: number;
}

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

export const catalogoService = {
  async list(catalogo: CatalogoNombre, opts: { onlyActive?: boolean } = {}): Promise<CatalogoOpcion[]> {
    let q = supabase
      .from("catalogo_opciones" as any)
      .select("*")
      .eq("catalogo", catalogo)
      .order("orden", { ascending: true })
      .order("label", { ascending: true });
    if (opts.onlyActive) q = q.eq("activo", true);
    const { data, error } = await q;
    if (error) throw error;
    return (data as unknown as CatalogoOpcion[]) ?? [];
  },

  async create(catalogo: CatalogoNombre, label: string): Promise<CatalogoOpcion> {
    const trimmed = label.trim();
    if (!trimmed) throw new Error("El nombre es obligatorio");
    const baseValue = slugify(trimmed) || `opt_${Date.now()}`;

    // Asegurar unicidad de value
    let value = baseValue;
    let suffix = 1;
    while (true) {
      const { data: existing } = await supabase
        .from("catalogo_opciones" as any)
        .select("id")
        .eq("catalogo", catalogo)
        .eq("value", value)
        .maybeSingle();
      if (!existing) break;
      suffix += 1;
      value = `${baseValue}_${suffix}`;
    }

    const { data, error } = await supabase
      .from("catalogo_opciones" as any)
      .insert({ catalogo, value, label: trimmed, activo: true, es_base: false, orden: 500 } as any)
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as CatalogoOpcion;
  },

  async updateLabel(id: string, label: string): Promise<void> {
    const trimmed = label.trim();
    if (!trimmed) throw new Error("El nombre es obligatorio");
    const { error } = await supabase
      .from("catalogo_opciones" as any)
      .update({ label: trimmed } as any)
      .eq("id", id);
    if (error) throw error;
  },

  async setActivo(id: string, activo: boolean): Promise<void> {
    const { error } = await supabase
      .from("catalogo_opciones" as any)
      .update({ activo } as any)
      .eq("id", id);
    if (error) throw error;
  },
};
