import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const STORAGE = process.env.STORAGE_DIR || "./storage";
const MIME: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

// Serve a generated artifact. In production this would be a signed, expiring object-storage
// URL (FR-I-03); for the MVP we stream from the local storage dir with a filename guard.
export async function GET(_req: Request, { params }: { params: { name: string } }) {
  const name = params.name;
  // Guard against path traversal — only a bare filename is allowed.
  if (!/^[A-Za-z0-9._-]+\.(docx|pdf|xlsx)$/.test(name)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const ext = name.split(".").pop()!.toLowerCase();
  try {
    const buf = await fs.readFile(path.join(STORAGE, name));
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "content-type": MIME[ext] || "application/octet-stream",
        "content-disposition": `attachment; filename="${name}"`,
        "content-length": String(buf.length),
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
