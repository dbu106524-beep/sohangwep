import { PageHero } from "@/components/page-hero";

export function PolicyPage({
  title,
  description,
  content,
  sections,
}: {
  title: string;
  description: string;
  content?: string;
  sections?: Array<[string, string]>;
}) {
  const blocks =
    content
      ?.split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean) ?? [];

  return (
    <main>
      <PageHero eyebrow="Policy" title={title} description={description} />
      <section className="section-shell glass-card rounded-3xl p-7 policy-readable md:p-10">
        <div className="grid gap-7">
          {blocks.length
            ? blocks.map((block) => {
                const [heading, ...bodyLines] = block.split("\n");
                const body = bodyLines.join("\n").trim();

                return (
                  <section key={block}>
                    <h2 className="text-2xl font-black text-white">{heading}</h2>
                    {body ? <p className="mt-3 whitespace-pre-wrap leading-8 text-white">{body}</p> : null}
                  </section>
                );
              })
            : sections?.map(([heading, body]) => (
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
