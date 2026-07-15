type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({ open, title, description, confirming = false, onCancel, onConfirm }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700" onClick={onCancel} type="button">
            Cancelar
          </button>
          <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={confirming} onClick={onConfirm} type="button">
            {confirming ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
