import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getSessionUser, isBackOffice } from "@/lib/auth";
import { purchaseById } from "@/lib/purchases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// pdf-lib standard fonts are WinAnsi — strip characters they can't encode.
function ascii(s: string): string {
  return (s || "").replace(/[—–]/g, "-").replace(/[“”]/g, '"').replace(/[’]/g, "'").replace(/[^\x20-\x7E]/g, "");
}

function money(cents: number, currency: string): string {
  const sym = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${sym}${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Download a purchase as a PDF invoice. Buyers can fetch their own; admins any.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in to view invoices." }, { status: 401 });
  const p = await purchaseById(params.id);
  if (!p) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  if (p.userId !== user.id && !isBackOffice(user.role)) return NextResponse.json({ error: "This invoice belongs to another account." }, { status: 403 });

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const brand = rgb(0.06, 0.3, 0.61);
  const ink = rgb(0.11, 0.1, 0.09);
  const muted = rgb(0.4, 0.39, 0.37);
  const M = 54;
  let y = 788;
  const text = (s: string, x: number, size: number, f = font, color = ink) => page.drawText(ascii(s), { x, y, size, font: f, color });

  // Header
  page.drawRectangle({ x: M, y: y - 4, width: 30, height: 30, color: brand });
  text("HardenHub", M + 40, 20, bold, brand);
  text("INVOICE", 595 - M - bold.widthOfTextAtSize("INVOICE", 20), 20, bold, ink);
  y -= 30;
  text("Compliance guide generation platform", M + 40, 9, font, muted);
  y -= 40;

  // Meta
  text(`Invoice ${p.invoiceNumber}`, M, 11, bold);
  text(`Date: ${new Date(p.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`, 595 - M - 160, 11, font, muted);
  y -= 16;
  text(`Status: ${p.status.toUpperCase()}   Method: ${p.method}`, M, 10, font, muted);
  y -= 28;
  text("Billed to", M, 9, bold, muted);
  y -= 14;
  text(p.userEmail || user.email, M, 11, font);
  y -= 34;

  // Table header
  page.drawLine({ start: { x: M, y }, end: { x: 595 - M, y }, thickness: 1, color: rgb(0.85, 0.84, 0.82) });
  y -= 16;
  text("Description", M, 9, bold, muted);
  text("Amount", 595 - M - 80, 9, bold, muted);
  y -= 18;

  // Line items (bundle list prices)
  for (const b of p.bundles) {
    text(b.name, M, 11, font);
    const src = b.sources.length ? `Access: ${b.sources.map((s) => s.toUpperCase()).join(" + ")}` : "";
    if (src) { y -= 13; text(src, M, 8.5, font, muted); }
    const amt = b.price || "";
    page.drawText(ascii(amt), { x: 595 - M - font.widthOfTextAtSize(ascii(amt), 11), y: y + (src ? 13 : 0), size: 11, font, color: ink });
    y -= 22;
  }

  // Total
  y -= 6;
  page.drawLine({ start: { x: M, y }, end: { x: 595 - M, y }, thickness: 1, color: rgb(0.85, 0.84, 0.82) });
  y -= 22;
  text("Total", M, 13, bold);
  const total = money(p.amountCents, p.currency);
  page.drawText(ascii(total), { x: 595 - M - bold.widthOfTextAtSize(total, 13), y, size: 13, font: bold, color: brand });
  y -= 40;

  text(p.method === "demo" || p.method === "stub" ? "Simulated transaction (no charge) — demo/pre-Stripe checkout." : "Thank you for your purchase.", M, 9, font, muted);
  y -= 40;
  text("HardenHub  ·  Generated compliance documentation  ·  This invoice was produced automatically.", M, 8, font, muted);

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${p.invoiceNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
