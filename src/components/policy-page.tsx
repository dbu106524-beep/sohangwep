import { PageHero } from "@/components/page-hero";

export function PolicyPage({
  title,
  description,
  sections,
}: {
  title: string;
  description: string;
  sections: Array<[string, string]>;
}) {
  return (
    <main>
      <PageHero eyebrow="Policy" title={title} description={description} />
      <section className="section-shell glass-card rounded-3xl p-7 policy-readable md:p-10">
        <div className="grid gap-7">
          {sections.map(([heading, body]) => (
            <section key={heading}>
              <h2 className="text-2xl font-black text-white">{heading}</h2>
              <p className="mt-3 leading-8 text-white">{body}</p>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
