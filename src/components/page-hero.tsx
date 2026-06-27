import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="section-shell py-14 md:py-20">
      <div className="cosmic-gradient overflow-hidden rounded-[2rem] p-6 text-white shadow-2xl shadow-violet-200 md:p-10">
        <div className="max-w-3xl">
          {eyebrow ? <p className="mb-3 text-sm font-black text-[#ffd36e]">{eyebrow}</p> : null}
          <h1 className="text-4xl font-black leading-tight md:text-6xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/82 md:text-lg">{description}</p>
        </div>
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}
