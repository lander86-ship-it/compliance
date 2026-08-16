// Master-document personalization. Library documents (SecureHub-authored DOCX masters)
// are imported ready-made with [Bracketed] placeholder fields; when a buyer generates
// their copy we replace those fields inside the DOCX so the deliverable is theirs.

import JSZip from "jszip";

function xmlEsc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Replace placeholder tokens in every document part (body, headers, footers).
export async function personalizeMasterDocx(base64: string, fields: Record<string, string>): Promise<Buffer> {
  const zip = await JSZip.loadAsync(Buffer.from(base64, "base64"));
  const parts = Object.keys(zip.files).filter((n) => /^word\/(document|header\d*|footer\d*)\.xml$/.test(n));
  for (const name of parts) {
    let xml = await zip.file(name)!.async("string");
    for (const [token, value] of Object.entries(fields)) {
      if (!value) continue;
      xml = xml.split(token).join(xmlEsc(value));
    }
    zip.file(name, xml);
  }
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

// Standard placeholder set used across the SecureHub master library.
export function masterFields(org: string): Record<string, string> {
  return {
    "[Organization Name]": org,
    "[Organization name]": org,
  };
}
