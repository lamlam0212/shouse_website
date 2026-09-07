import { NextResponse } from "next/server";

const allowedTypes = new Set(["web-vital", "client-error", "client-rejection"]);

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 2048) return NextResponse.json({ ok: false }, { status: 413 });
  try {
    const event = await request.json() as Record<string, unknown>;
    if (!allowedTypes.has(String(event.type)) || typeof event.path !== "string") return NextResponse.json({ ok: false }, { status: 400 });
    console.info(JSON.stringify({ level: "info", source: "browser", ...event, path: event.path.slice(0, 300) }));
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
