import { ProductCard } from "@/components/cards";
import { getProducts } from "@/lib/data";

export default async function ShopPage() {
  const products = await getProducts();
  const creditProducts = products.filter((product) => (product.product_kind ?? "credit") === "credit");
  const goodsProducts = products.filter((product) => product.product_kind === "goods");

  return (
    <main>
      <section className="page-hero art-hero shop-hero">
        <span className="eyebrow">SHOP</span>
        <h1>상점</h1>
        <p>소행성에서 사용할 수 있는 상품과 후원 아이템을 둘러보세요.</p>
      </section>

      {products.length ? (
        <section className="shop-sections">
          <div className="shop-tab-row" aria-label="상점 분류">
            <a href="#star-credit" className="chip active">스타 크레딧</a>
            <a href="#goods" className="chip">굿즈</a>
          </div>

          <div id="star-credit" className="shop-category">
            <div className="section-head compact">
              <span className="eyebrow">STAR CREDIT</span>
              <h2>스타 크레딧</h2>
            </div>
            {creditProducts.length ? (
              <div className="shop-grid">
                {creditProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>등록된 스타 크레딧 상품이 없습니다</h3>
              </div>
            )}
          </div>

          <div id="goods" className="shop-category">
            <div className="section-head compact">
              <span className="eyebrow">GOODS</span>
              <h2>굿즈</h2>
            </div>
            {goodsProducts.length ? (
              <div className="shop-grid">
                {goodsProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>등록된 굿즈가 없습니다</h3>
                <p>관리자 페이지에서 굿즈 상품을 추가하면 이곳에 표시됩니다.</p>
              </div>
            )}
          </div>
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
