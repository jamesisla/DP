import type { ReactNode } from "react";
import { X } from "lucide-react";

type FormModalProps = {
  title: string;
  open: boolean;
  saving?: boolean;
  children: ReactNode;
  onClose: () => void;
  onSubmit: () => void;
};

export function FormModal({ title, open, saving = false, children, onClose, onSubmit }: FormModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <button className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 text-slate-600" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="max-h-[65vh] overflow-y-auto px-5 py-5">{children}</div>
          <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
            <button className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700" onClick={onClose} type="button">
              Cancelar
            </button>
            <button className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} type="submit">
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
