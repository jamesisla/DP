import React from "react";

export function Panel({ title, icon: Icon, children }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-soft">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded bg-slate-100 text-ink">
          <Icon size={18} />
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
