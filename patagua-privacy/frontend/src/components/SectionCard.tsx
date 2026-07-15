import type { ReactNode } from "react";

type SectionCardProps = {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SectionCard({ title, action, children, className = "" }: SectionCardProps) {
  return (
    <section className={`rounded-2xl border border-black/10 bg-white p-5 shadow-soft ${className}`}>
      {title || action ? (
        <div className="mb-5 flex items-center justify-between gap-4">
          {title ? <h2 className="text-base font-semibold tracking-tight text-slate-950">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
