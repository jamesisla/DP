type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {eyebrow ? <p className="text-sm font-semibold uppercase tracking-wide text-[#0f8f61]">{eyebrow}</p> : null}
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[32px]">{title}</h1>
      {description ? <p className="mt-2 max-w-3xl text-[15px] leading-6 text-slate-600">{description}</p> : null}
    </div>
  );
}
