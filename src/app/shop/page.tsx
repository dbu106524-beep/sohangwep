import { ProductCard } from "@/components/cards";
import { getProducts } from "@/lib/data";

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <main>
      <section className="page-hero art-hero shop-hero">
        <span className="eyebrow">SHOP</span>
        <h1>상점</h1>
        <p>소행성에서 사용할 수 있는 상품과 후원 아이템을 둘러보세요.</p>
      </section>

      {products.length ? (
        <section className="shop-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      ) : (
        <div className="empty-state">
          <h3>상점 준비 중입니다</h3>
          <p>곧 새로운 상품과 후원 아이템을 만나볼 수 있어요.</p>
        </div>
      )}
    </main>
  );
}
