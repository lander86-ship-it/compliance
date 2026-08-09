import { NextResponse } from "next/server";
import { z } from "zod";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import { getSessionUser, canManageCatalog } from "@/lib/auth";
import { resolveNarrative } from "@/lib/policyNarrative";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORAGE = process.env.STORAGE_DIR || "./storage";
const schema = z.object({ url: z.string().url(), download: z.boolean().optional() });

function stripTags(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
}
function extractTitle(html: string): string {
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "";
  return stripTags(t).slice(0, 160) || "Imported standard";
}
function extractHeadings(html: string): string[] {
  const out: string[] = [];
  const re = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < 60) {
    const t = stripTags(m[2]);
    if (t && t.length > 2 && t.length < 140) out.push(t);
  }
  return [...new Set(out)];
}
function guessPlatform(title: string): string {
  const t = title.toLowerCase();
  for (const [k, v] of [["windows", "Windows"], ["ubuntu", "Ubuntu Linux"], ["red hat", "Red Hat Enterprise Linux"], ["rhel", "Red Hat Enterprise Linux"], ["kubernetes", "Kubernetes"], ["docker", "Docker"], ["aws", "Amazon Web Services"], ["azure", "Microsoft Azure"], ["oracle", "Oracle Database"], ["mysql", "MySQL"], ["mongodb", "MongoDB"], ["apache", "Apache"], ["cisco", "Cisco"], ["vmware", "VMware"], ["macos", "Apple macOS"]] as const) {
    if (t.includes(k)) return v;
  }
  return "the referenced technology";
}

// Admin AI Standard Generator: fetch a source URL and draft an original,
// framework-mapped standard from it. AI-assisted when ANTHROPIC_API_KEY is set,
// with a deterministic structured fallback otherwise.
export async function POST(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user || !canManageCatalog(user.role)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid URL." }, { status: 400 });
  const { url, download } = parsed.data;

  let html = "";
  try {
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 HardenHubBot", accept: "text/html,*/*" }, signal: AbortSignal.timeout(30000) });
    if (!res.ok) return NextResponse.json({ error: `Could not fetch the source (HTTP ${res.status}).` }, { status: 502 });
    html = await res.text();
  } catch (e) {
    return NextResponse.json({ error: `Could not reach the source: ${e instanceof Error ? e.message : "network error"}` }, { status: 502 });
  }

  const title = extractTitle(html);
  const sections = extractHeadings(html);
  const platform = guessPlatform(title);
  const { narrative, aiUsed } = await resolveNarrative({
    org: "your organisation",
    platform,
    benchTitle: title,
    benchVersion: "",
    controlCount: sections.length,
    sectionTitles: sections,
  });

  if (download) {
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
          new Paragraph({ children: [new TextRun({ text: `Source: ${url}`, italics: true, size: 18, color: "6b6b6b" })] }),
          new Paragraph({ text: "1. Purpose", heading: HeadingLevel.HEADING_1 }),
          new Paragraph(narrative.purposeIntro),
          ...narrative.purposeAims.map((a) => new Paragraph({ text: a, bullet: { level: 0 } })),
          new Paragraph({ text: "2. Scope", heading: HeadingLevel.HEADING_1 }),
          new Paragraph(narrative.scopeIntro),
          ...narrative.scopeCovers.map((a) => new Paragraph({ text: a, bullet: { level: 0 } })),
          new Paragraph({ text: "3. Roles & responsibilities", heading: HeadingLevel.HEADING_1 }),
          ...narrative.roles.flatMap((r) => [new Paragraph({ children: [new TextRun({ text: r.role, bold: true })] }), ...r.responsibilities.map((x) => new Paragraph({ text: x, bullet: { level: 0 } }))]),
          new Paragraph({ text: "4. Control sections (from source)", heading: HeadingLevel.HEADING_1 }),
          ...sections.map((sname) => new Paragraph({ text: sname, bullet: { level: 0 } })),
          new Paragraph({ text: "5. Compliance", heading: HeadingLevel.HEADING_1 }),
          new Paragraph(narrative.complianceIntro),
          new Paragraph(narrative.complianceEnforcement),
        ],
      }],
    });
    const buf = await Packer.toBuffer(doc);
    await fs.mkdir(STORAGE, { recursive: true });
    const fileName = `standard-${Date.now()}.docx`;
    await fs.writeFile(path.join(STORAGE, fileName), buf);
    return NextResponse.json({ title, aiUsed, sections, url: `/api/artifact/${fileName}` });
  }

  return NextResponse.json({ title, aiUsed, platform, sections, narrative });
}
