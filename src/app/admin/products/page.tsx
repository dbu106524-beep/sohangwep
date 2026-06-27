import { createProductAction, deleteProductAction, updateProductAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";
import { getProducts } from "@/lib/data";
import type { Product } from "@/lib/types";

export default async function AdminProductsPage() {
  const { allowed } = await requireAdmin("/admin/products");
  const products = await getProducts({ includeInactive: true });

  if (!allowed) {
    return (
      <main>
        <section className="article-view">
          <span className="eyebrow">ADMIN</span>
          <h1>접근 권한이 없습니다</h1>
          <p className="lead">관리자만 상품을 관리할 수 있습니다.</p>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="page-hero art-hero shop-hero">
        <span className="eyebrow">ADMIN SHOP</span>
        <h1>상품 관리</h1>
        <p>상점 상품을 등록하고 이미지를 업로드합니다.</p>
      </section>

      <section className="split-section">
        <ProductForm action={createProductAction} title="새 상품 등록" submitLabel="등록" />
        <div className="admin-list">
          {products.length ? (
            products.map((product) => (
              <ProductForm
                key={product.id}
                action={updateProductAction}
                deleteAction={deleteProductAction}
                title={product.name}
                submitLabel="수정"
                values={product}
              />
            ))
          ) : (
            <div className="empty-state">
              <h3>등록된 상품이 없습니다</h3>
              <p>왼쪽 폼에서 첫 상품을 추가하세요.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function ProductForm({
  action,
  deleteAction,
  title,
  submitLabel,
  values,
}: {
  action: (formData: FormData) => Promise<void>;
  deleteAction?: (formData: FormData) => Promise<void>;
  title: string;
  submitLabel: string;
  values?: Product;
}) {
  return (
    <form action={action} className="glass-card">
      {values ? <input type="hidden" name="id" value={values.id} /> : null}
      {values?.image_url ? <input type="hidden" name="current_image_url" value={values.image_url} /> : null}
      <h2>{title}</h2>
      <AdminInput name="name" label="상품명" defaultValue={values?.name} required />
      <AdminInput name="description" label="짧은 설명" defaultValue={values?.description} required />
      <AdminTextarea name="details" label="상세 설명" defaultValue={values?.details} required />
      <div className="admin-grid">
        <AdminInput name="price_krw" label="가격" type="number" defaultValue={String(values?.price_krw ?? "")} required />
        <AdminInput name="cash_amount" label="스타 크레딧 지급량" type="number" defaultValue={String(values?.cash_amount ?? "")} required />
      </div>
      <AdminInput name="minecraft_item_key" label="마인크래프트 지급 키" defaultValue={values?.minecraft_item_key} required />
      <AdminInput name="image_url" label="이미지 URL 또는 Storage URL" defaultValue={values?.image_url ?? ""} />
      <label className="admin-field">
        <span>이미지 파일 업로드</span>
        <input className="file-input" name="image_file" type="file" accept="image/*" />
      </label>
      <label className="checkbox-row">
        <input name="active" type="checkbox" defaultChecked={values?.active ?? true} /> 판매중
      </label>
      <div className="admin-actions">
        <button className="button primary">{submitLabel}</button>
        {deleteAction ? (
          <button formAction={deleteAction} className="button danger">
            삭제
          </button>
        ) : null}
      </div>
    </form>
  );
}

function AdminInput(props: {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
}) {
  const { label, ...inputProps } = props;
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input className="admin-input" {...inputProps} />
    </label>
  );
}

function AdminTextarea(props: { name: string; label: string; defaultValue?: string; required?: boolean }) {
  const { label, ...textareaProps } = props;
  return (
    <label className="admin-field">
      <span>{label}</span>
      <textarea rows={7} className="admin-textarea" {...textareaProps} />
    </label>
  );
}
