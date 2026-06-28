import { notFound } from "next/navigation";
import { ImageLightbox } from "@/components/image-lightbox";
import { PurchaseButton } from "@/components/purchase-button";
import { getProduct } from "@/lib/data";
import { formatWon, getDiscountedPrice, getImageUrls, normalizeDiscountPercent } from "@/lib/utils";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }
  const imageUrls = getImageUrls(product);
  const discountPercent = normalizeDiscountPercent(product.discount_percent);
  const finalPrice = getDiscountedPrice(product.price_krw, discountPercent);
  const isGoods = product.product_kind === "goods";

  return (
    <main>
      <section className="page-hero art-hero shop-hero">
        <span className="eyebrow">SHOP</span>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
      </section>
      <section className="split-section">
        <div className="product-card">
          {imageUrls.length ? (
            <ImageLightbox images={imageUrls} alt={product.name} className={imageUrls.length > 1 ? "product-image-gallery" : "product-image"} />
          ) : (
            <div className="product-image">
              <div className="product-placeholder" aria-hidden="true">
                <span>IMG</span>
              </div>
            </div>
          )}
        </div>
        <div className="glass-card">
          <span className="badge">
            {isGoods ? "굿즈 배송 상품" : `${product.cash_amount.toLocaleString("ko-KR")} 스타 크레딧 지급`}
          </span>
          <div className="shop-price-block">
            {discountPercent > 0 ? <span className="discount-badge large">{discountPercent}% 할인중</span> : null}
            {discountPercent > 0 ? <span className="original-price detail">{formatWon(product.price_krw)}</span> : null}
            <h2>{formatWon(finalPrice)}</h2>
          </div>
          <p>{product.details}</p>
          <div className="notice-box">
            테스트 모드에서는 실제 결제가 발생하지 않습니다. 결제 준비 API, 후원, 지급 요청 구조만 확인합니다.
          </div>
          <PurchaseButton productId={product.id} productKind={product.product_kind ?? "credit"} />
        </div>
      </section>
    </main>
  );
}
