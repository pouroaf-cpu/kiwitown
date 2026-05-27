export const preferredRegion = "syd1";

import { NextResponse } from "next/server";
import { getViewer, hasRole } from "@/lib/authorization";

function pdfEscape(text: string) {
  return text.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function simplePdf(lines: string[]) {
  const content = lines.map((line, index) => `BT /F1 11 Tf 48 ${790 - index * 18} Td (${pdfEscape(line)}) Tj ET`).join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  return `${pdf}trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
}

export async function GET(request: Request) {
  const { supabase, user, profile } = await getViewer();
  if (!user || !hasRole(profile, ["coo", "super_admin"])) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(request.url);
  const month = Number(url.searchParams.get("month") || new Date().getMonth() + 1);
  const year = Number(url.searchParams.get("year") || new Date().getFullYear());
  const format = url.searchParams.get("format") || "csv";
  const { data, error } = await supabase.from("kpi_entries")
    .select("score,bonus_earned,sparky_id,profiles!kpi_entries_sparky_id_fkey(name)")
    .eq("month", month).eq("year", year).eq("archived", false);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []).map((entry) => ({
    name: (entry.profiles as unknown as { name?: string } | null)?.name || entry.sparky_id,
    score: Number(entry.score),
    bonus: Number(entry.bonus_earned),
  }));
  if (format === "pdf") {
    const lines = [
      "Kiwitown Electrical - Bonus Reconciliation",
      `Reporting month: ${month}/${year}`,
      "",
      ...rows.map((row) => `${row.name}   Score: ${row.score.toFixed(2)}   Bonus: $${row.bonus.toFixed(2)}`),
      "",
      `Total bonus: $${rows.reduce((sum, row) => sum + row.bonus, 0).toFixed(2)}`,
    ];
    return new Response(simplePdf(lines), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="kiwitown-bonus-${year}-${month}.pdf"` },
    });
  }
  const csv = ["Name,Score,Bonus", ...rows.map((row) => `"${row.name.replaceAll("\"", "\"\"")}",${row.score},${row.bonus}`)].join("\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="kiwitown-bonus-${year}-${month}.csv"` },
  });
}
