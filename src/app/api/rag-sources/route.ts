import { EMBEDDING_MODEL_ID, databaseUrl, getSql, guardAskRequest, publicError } from "@/lib/rag";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const blocked = guardAskRequest(request);
  if (blocked) return blocked;

  if (!databaseUrl()) {
    return Response.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503 },
    );
  }

  try {
    const sql = getSql();
    const rows = await sql`
      SELECT DISTINCT source_path
      FROM rag_chunks
      WHERE embedding_model = ${EMBEDDING_MODEL_ID}
      ORDER BY source_path
    `;
    return Response.json({
      files: rows.map((row) => String(row.source_path)),
      embedding_model: EMBEDDING_MODEL_ID,
    });
  } catch (error) {
    return Response.json({ error: publicError(error) }, { status: 500 });
  }
}
