// Compares an order's current line items against the pre-edit snapshot
// (orders.originalItems) to produce a display diff: unchanged / added / removed /
// quantity-changed. Used on the customer order page and the cord card.

export interface DiffItem {
  productId: number | null;
  productName: string;
  productUnit?: string | null;
  price: number;
  quantity: number;
  total?: number;
}

export interface DiffLine extends DiffItem {
  state: "same" | "added" | "removed" | "changed";
  oldQuantity?: number;
}

export function computeOrderDiff(current: DiffItem[], original: DiffItem[] | null | undefined): DiffLine[] {
  if (!original || original.length === 0) {
    return current.map(c => ({ ...c, state: "same" as const }));
  }
  const origMap = new Map(original.map(o => [o.productId, o]));
  const curIds = new Set(current.map(c => c.productId));
  const lines: DiffLine[] = [];

  for (const c of current) {
    const o = origMap.get(c.productId);
    if (!o) lines.push({ ...c, state: "added" });
    else if (o.quantity !== c.quantity) lines.push({ ...c, state: "changed", oldQuantity: o.quantity });
    else lines.push({ ...c, state: "same" });
  }
  // items that were in the original but no longer present = removed
  for (const o of original) {
    if (!curIds.has(o.productId)) lines.push({ ...o, state: "removed" });
  }
  return lines;
}
