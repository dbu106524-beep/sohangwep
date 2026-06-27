"use client";

import { useMemo, useState } from "react";
import type { GuideCategory, GuideDoc } from "@/lib/site-content";

function paragraphs(content: string) {
  return content.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
}

export function GuideTabs({ categories, guides }: { categories: GuideCategory[]; guides: GuideDoc[] }) {
  const [activeId, setActiveId] = useState(categories[0]?.id ?? "");
  const activeCategory = categories.find((category) => category.id === activeId) ?? categories[0];
  const visibleGuides = useMemo(
    () => guides.filter((guide) => guide.categoryId === activeCategory?.id),
    [activeCategory?.id, guides],
  );

  if (!activeCategory) {
    return <div className="empty-state">등록된 가이드가 없습니다.</div>;
  }

  return (
    <section className="guide-layout">
      <aside className="guide-sidebar" aria-label="가이드 카테고리">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`guide-tab ${category.id === activeCategory.id ? "active" : ""}`}
            onClick={() => setActiveId(category.id)}
          >
            <strong>{category.title}</strong>
            <small>{category.description}</small>
          </button>
        ))}
      </aside>

      <div className="guide-content">
        <div className="section-head left">
          <span className="eyebrow">{activeCategory.title}</span>
          <h2>{activeCategory.description}</h2>
        </div>
        {visibleGuides.length ? (
          visibleGuides.map((guide) => (
            <article key={guide.id} className="guide-article">
              <div className="guide-meta">
                {[guide.badge, guide.location, guide.keyHint].filter(Boolean).map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <h3>{guide.title}</h3>
              <p className="muted">{guide.summary}</p>
              <div className="article-body">
                {paragraphs(guide.content).map((block) => (
                  <p key={block}>{block}</p>
                ))}
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <h3>문서가 없습니다</h3>
            <p>이 카테고리에 공개된 가이드가 없습니다.</p>
          </div>
        )}
      </div>
    </section>
  );
}
