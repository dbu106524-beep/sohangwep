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
      <section className={`split-section product-detail-section${isGoods ? " goods-detail-section" : ""}`}>
        <div className={`product-card product-detail-media${isGoods ? " goods-detail-media" : ""}`}>
          {imageUrls.length ? (
            <ImageLightbox
              images={imageUrls}
              alt={product.name}
              className={`product-image${isGoods ? " goods-product-image" : ""}`}
              mode="slider"
            />
          ) : (
            <div className="product-image">
              <div className="product-placeholder" aria-hidden="true">
                <span>IMG</span>
              </div>
            </div>
          )}
        </div>
        <div className="glass-card product-detail-info">
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
            {isGoods
              ? "배송 정보를 입력하고 주문하면 디스코드 결제 확인 채널이 열립니다. 채널 안내에 따라 입금 완료를 눌러 주세요."
              : "무통장 입금 구매 신청 후 디스코드 결제 확인 채널에서 계좌 안내와 입금 확인 절차를 확인할 수 있습니다."}
          </div>
          <PurchaseButton productId={product.id} productKind={product.product_kind ?? "credit"} />
        </div>
      </section>
    </main>
  );
}
