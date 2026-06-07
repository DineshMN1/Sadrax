"use client";

import { FileText } from "lucide-react";
import { toast } from "sonner";
import { buildInvoiceHtml, type InvoiceData } from "@/lib/invoice";

export function InvoiceButton(props: { orderId: number } & Omit<InvoiceData, "id">) {
  const print = () => {
    const w = window.open("", "_blank", "width=460,height=720");
    if (!w) { toast.error("Allow pop-ups to view the invoice"); return; }
    w.document.write(buildInvoiceHtml({ ...props, id: props.orderId }));
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  return (
    <button
      onClick={print}
      className="w-full flex items-center justify-center gap-2 h-11 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-2xl hover:bg-gray-50 transition-colors"
    >
      <FileText size={15} /> Download invoice
    </button>
  );
}
