import Link from "next/link";
import type { Notice, Product } from "@/lib/types";
import { noticeTypeLabels } from "@/lib/site-content";
import { formatDate, formatWon } from "@/lib/utils";

export function NoticeCard({ notice }: { notice: Notice }) {
  return (
    <Link href={`/notices/${notice.slug}`} className="post-card notice-card">
      {notice.image_url ? (
        <div className="post-card-image">
          <img src={notice.image_url} alt="" />
        </div>
      ) : null}
      <div className="post-topline notice-card-meta">
        <span className="badge">{noticeTypeLabels[notice.category]}</span>
        <span className="notice-author">작성자 소행성</span>
        <time>{formatDate(notice.created_at)}</time>
      </div>
      <h3>{notice.title}</h3>
      <p>{notice.excerpt}</p>
    </Link>
  );
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/shop/${product.slug}`} className="product-card">
      <div className="product-image">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} />
        ) : (
          <div className="product-placeholder" aria-hidden="true">
            <span>IMG</span>
          </div>
        )}
      </div>
      <div className="product-body">
        <div className="post-topline">
          <span className="badge">{product.cash_amount.toLocaleString("ko-KR")} 스타 크레딧</span>
          <span>{product.active ? "판매중" : "비공개"}</span>
        </div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <strong className="price">{formatWon(product.price_krw)}</strong>
      </div>
    </Link>
  );
}
