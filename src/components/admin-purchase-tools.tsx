"use client";

import { useMemo, useState } from "react";
import type { Purchase } from "@/lib/types";

type ExportRow = {
  id: string;
  createdAt: string;
  productKind: Purchase["product_kind"];
  productName: string;
  amountKrw: number;
  status: Purchase["status"];
  paymentReference: string;
  userName: string;
  discordId: string;
  minecraftName: string;
  depositor: string;
  shippingRecipient: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingMessage: string;
  trackingCarrier: string;
  trackingNumber: string;
  note: string;
};

const filterOptions = [
  { value: "all", label: "전체" },
  { value: "unfinished", label: "미완료" },
  { value: "done", label: "완료" },
  { value: "pending", label: "입금대기" },
  { value: "paid", label: "입금확인중" },
  { value: "fulfilled", label: "지급완료" },
  { value: "shipped", label: "배송중" },
  { value: "delivered", label: "배송완료" },
  { value: "failed", label: "오류" },
  { value: "refunded", label: "환불/거절" },
  { value: "goods", label: "굿즈" },
  { value: "credit", label: "스타 크레딧" },
] as const;

export function AdminPurchaseTools({ rows }: { rows: ExportRow[] }) {
  const [filter, setFilter] = useState<(typeof filterOptions)[number]["value"]>("all");

  const visibleRows = useMemo(() => rows.filter((row) => matchesFilter(row, filter)), [rows, filter]);

  function applyFilter(value: typeof filter) {
    setFilter(value);
    document.querySelectorAll<HTMLElement>("[data-purchase-card]").forEach((card) => {
      const status = card.dataset.status ?? "";
      const kind = card.dataset.kind ?? "";
      const visible = matchesRawFilter(status, kind, value);
      card.hidden = !visible;
      const checkbox = card.querySelector<HTMLInputElement>(".purchase-row-check");
      if (checkbox && !visible) checkbox.checked = false;
    });
  }

  function setAllVisible(checked: boolean) {
    document.querySelectorAll<HTMLInputElement>(".purchase-row-check").forEach((checkbox) => {
      const card = checkbox.closest<HTMLElement>("[data-purchase-card]");
      if (card && !card.hidden) {
        checkbox.checked = checked;
      }
    });
  }

  function exportCsv() {
    const header = [
      "주문번호",
      "일시",
      "종류",
      "상품명",
      "금액",
      "상태",
      "결제참조",
      "유저명",
      "디스코드ID",
      "마인크래프트닉네임",
      "입금자명",
      "받는사람",
      "연락처",
      "배송지",
      "배송메시지",
      "택배사",
      "송장번호",
      "비고",
    ];
    const csv = [header, ...visibleRows.map(toCsvRow)].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const month = new Date().toISOString().slice(0, 7);
    link.href = url;
    link.download = `sohang-purchases-${month}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-purchase-toolbar glass-card">
      <div className="admin-filter-row">
        <label>
          <span>필터</span>
          <select value={filter} onChange={(event) => applyFilter(event.target.value as typeof filter)} className="admin-select">
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <strong>{visibleRows.length.toLocaleString("ko-KR")}건 표시중</strong>
      </div>
      <div className="admin-purchase-actions">
        <button type="button" className="button ghost" onClick={() => setAllVisible(true)}>
          전체 체크
        </button>
        <button type="button" className="button ghost" onClick={() => setAllVisible(false)}>
          전체 체크해제
        </button>
        <button type="button" className="button ghost" onClick={exportCsv}>
          엑셀로 다운로드
        </button>
        <button type="submit" form="bulk-delete-purchases" className="button danger" onClick={(event) => {
          if (!window.confirm("선택한 구매내역을 삭제할까요? 삭제 후에는 복구하기 어렵습니다.")) {
            event.preventDefault();
          }
        }}>
          선택 삭제
        </button>
      </div>
    </div>
  );
}

function matchesFilter(row: ExportRow, filter: string) {
  return matchesRawFilter(row.status, row.productKind, filter);
}

function matchesRawFilter(status: string, kind: string, filter: string) {
  if (filter === "all") return true;
  if (filter === "goods" || filter === "credit") return kind === filter;
  if (filter === "done") return status === "fulfilled" || status === "shipped" || status === "delivered";
  if (filter === "unfinished") return status === "pending" || status === "paid" || status === "failed";
  return status === filter;
}

function toCsvRow(row: ExportRow) {
  return [
    row.id,
    row.createdAt,
    row.productKind === "goods" ? "굿즈" : "스타 크레딧",
    row.productName,
    String(row.amountKrw),
    row.status,
    row.paymentReference,
    row.userName,
    row.discordId,
    row.minecraftName,
    row.depositor,
    row.shippingRecipient,
    row.shippingPhone,
    row.shippingAddress,
    row.shippingMessage,
    row.trackingCarrier,
    row.trackingNumber,
    row.note,
  ];
}

function csvCell(value: string) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}
