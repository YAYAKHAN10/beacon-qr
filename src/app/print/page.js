import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { getSiteUrl } from "@/lib/beacon";
import { filenameFor } from "@/lib/beacon";
import { scanUrlFor } from "@/lib/qr";
import { getSupabase } from "@/lib/supabase";
import PrintButton from "./PrintButton";
import QrImage from "./QrImage";

export const dynamic = "force-dynamic";

// The worker does ONE Supabase select here and encodes nothing — every QR on
// the sheet is rendered client-side by <QrImage> (see QrImage.js). The old
// in-request QRCode.toDataURL loop was O(N) CPU in a single invocation and
// threw Cloudflare 1102 resource-limit errors on big sheets.
async function getPrintableCodes(ids) {
  let query = getSupabase()
    .from("qr_codes")
    .select("id, label")
    .order("created_at", { ascending: false });

  if (ids && ids.length > 0) {
    query = query.in("id", ids);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export default async function PrintPage({ searchParams }) {
  await requireAdmin();
  const query = await searchParams;
  const idsParam = Array.isArray(query.ids) ? query.ids[0] : query.ids;
  const ids = idsParam
    ? idsParam
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    : null;
  const codes = await getPrintableCodes(ids);
  const baseUrl = getSiteUrl();

  return (
    <main className="shell print-shell">
      <header className="topbar print-chrome">
        <div>
          <p className="eyebrow">Print station</p>
          <h1>{ids ? `${codes.length} selected code${codes.length === 1 ? "" : "s"}` : "Blank Beacon code sheet"}</h1>
        </div>
        <nav className="nav">
          <Link href="/" className="btn btn-outline">
            Dashboard
          </Link>
          <PrintButton />
        </nav>
      </header>

      <section className="print-grid">
        {codes.map((code) => (
          <article className="qr-card" key={code.id}>
            <QrImage
              value={scanUrlFor(baseUrl, code.id)}
              alt={`QR code ${code.id}`}
            />
            <p>{code.label || code.id}</p>
            {/* High-res PNG comes from /api/qr/[id] on demand — baking
                high-res data URLs into this page blew the Worker's
                per-request CPU limit (Cloudflare error 1102). */}
            <a
              className="qr-download"
              href={`/api/qr/${code.id}`}
              download={filenameFor(code)}
            >
              Download PNG
            </a>
          </article>
        ))}
      </section>
    </main>
  );
}
