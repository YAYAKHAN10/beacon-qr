"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QR_IMAGE_OPTIONS } from "@/lib/qr";

// Encodes the QR in the visitor's browser. Encoding hundreds of PNGs inside
// one Worker request is the Cloudflare 1102 failure class (see CLAUDE.md) —
// client-side rendering costs the worker zero CPU regardless of sheet size.
export default function QrImage({ value, alt }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, QR_IMAGE_OPTIONS).then(
      (url) => {
        if (!cancelled) {
          setSrc(url);
        }
      },
      () => {
        // Encoding a valid URL can't realistically fail; keep the placeholder.
      }
    );
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!src) {
    return <div className="qr-pending" aria-label={`${alt} (rendering)`} />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} />;
}
