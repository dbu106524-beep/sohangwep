import Link from "next/link";
import type { Notice, Product } from "@/lib/types";
import { noticeTypeLabels } from "@/lib/site-content";
import { formatDate, formatWon, getDiscountedPrice, normalizeDiscountPercent } from "@/lib/utils";

export function getNoticeHref(notice: Pick<Notice, "id" | "slug">) {
  return `/notices/${encodeURIComponent(notice.slug || notice.id)}`;
}

export function NoticeCard({ notice }: { notice: Notice }) {
  return (
    <Link href={getNoticeHref(notice)} className="post-card notice-card">
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
  const discountPercent = normalizeDiscountPercent(product.discount_percent);
  const finalPrice = getDiscountedPrice(product.price_krw, discountPercent);
  const isGoods = product.product_kind === "goods";

  return (
    <Link href={`/shop/${product.slug}`} className={`product-card${isGoods ? " goods-product-card" : ""}`}>
      <div className={`product-image${isGoods ? " goods-product-image" : ""}`}>
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
          <span className="badge">
            {isGoods ? "굿즈" : `${product.cash_amount.toLocaleString("ko-KR")} 스타 크레딧`}
          </span>
          <span>{product.active ? "판매중" : "비공개"}</span>
        </div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        {discountPercent > 0 ? <span className="discount-badge">{discountPercent}% 할인중</span> : null}
        <div className="price-row">
          {discountPercent > 0 ? <span className="original-price">{formatWon(product.price_krw)}</span> : null}
          <strong className="price">{formatWon(finalPrice)}</strong>
        </div>
      </div>
    </Link>
  );
}
