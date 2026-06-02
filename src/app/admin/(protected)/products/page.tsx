import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatPrice } from "@/lib/utils";
import { Plus, Upload } from "lucide-react";
import { ProductToggle } from "./product-toggle";

export default async function ProductsPage() {
  const rows = await db
    .select({ product: products, category: categories })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.createdAt));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex gap-2">
          <Link href="/admin/products/import" className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50">
            <Upload size={15} /> CSV Import
          </Link>
          <Link href="/admin/products/new" className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700">
            <Plus size={15} /> Add Product
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Product</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Category</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Price</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Stock</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Active</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map(({ product: p, category: cat }) => (
              <tr key={p.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {(p.images as string[])[0] ? (
                        <Image src={(p.images as string[])[0]} alt={p.name} width={40} height={40} className="w-full h-full object-cover" />
                      ) : <div className="w-full h-full flex items-center justify-center text-lg">📦</div>}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.unit}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{cat?.name ?? "—"}</td>
                <td className="px-4 py-3 text-right font-medium">{formatPrice(p.price)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-semibold ${p.stock === 0 ? "text-red-500" : p.stock <= 10 ? "text-yellow-600" : "text-gray-900"}`}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <ProductToggle id={p.id} active={p.active} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/products/${p.id}/edit`} className="text-xs text-green-600 font-semibold hover:underline">Edit</Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">No products yet. Add one or import via CSV.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
