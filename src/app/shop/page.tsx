import { ProductCard } from "@/components/cards";
import { getProducts } from "@/lib/data";
import { siteSettings } from "@/lib/site-content";

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <main>
      <section className="page-hero art-hero shop-hero">
        <span className="eyebrow">SHOP</span>
        <h1>상점</h1>
        <p>{siteSettings.shopIntro}</p>
      </section>

      {products.length ? (
        <section className="shop-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      ) : (
        <div className="empty-state">
          <h3>등록된 상품이 없습니다</h3>
          <p>관리자 화면에서 상점 상품을 직접 추가하면 이곳에 표시됩니다.</p>
        </div>
      )}
    </main>
  );
}
