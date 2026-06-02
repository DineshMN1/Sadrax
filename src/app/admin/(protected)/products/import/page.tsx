"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, Upload, Download } from "lucide-react";
import { toast } from "sonner";

interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

export default function CsvImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/products/import", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        toast.success(`Imported ${data.created} products`);
      } else {
        toast.error(data.error ?? "Import failed");
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50">
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">CSV Import</h1>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-blue-800 mb-2">CSV Format</p>
        <p className="text-xs text-blue-600 font-mono">name, slug, price, mrp, unit, stock, category, description, featured</p>
        <p className="text-xs text-blue-500 mt-1">Prices in rupees (e.g. 49.99). Category should match existing category name.</p>
        <a
          href="/sample-products.csv"
          download
          className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-700 font-semibold hover:underline"
        >
          <Download size={12} /> Download sample CSV
        </a>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${file ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-green-400"}`}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={28} className="mx-auto text-gray-400 mb-3" />
          {file ? (
            <>
              <p className="font-semibold text-green-700">{file.name}</p>
              <p className="text-xs text-green-600 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-gray-700">Click to upload CSV</p>
              <p className="text-xs text-gray-400 mt-1">or drag and drop</p>
            </>
          )}
          <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); }} />
        </div>

        {file && (
          <button onClick={handleImport} disabled={importing}
            className="mt-4 w-full h-11 bg-green-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50">
            {importing ? "Importing..." : `Import ${file.name}`}
          </button>
        )}
      </div>

      {result && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2">
          <h2 className="font-semibold text-gray-900">Import Result</h2>
          <p className="text-sm text-green-600">✓ {result.created} products created</p>
          {result.skipped > 0 && <p className="text-sm text-yellow-600">⚠ {result.skipped} skipped (duplicates)</p>}
          {result.errors.length > 0 && (
            <div>
              <p className="text-sm text-red-500 mb-1">Errors:</p>
              {result.errors.map((e, i) => <p key={i} className="text-xs text-red-400">{e}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
