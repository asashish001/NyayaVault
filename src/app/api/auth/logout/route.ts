import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getSessionUser } from "@/lib/auth/session";
import { writeAudit, clientIp } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  await writeAudit({
    actorId: user?.id,
    role: user?.role ?? "ANONYMOUS",
    action: "LOGOUT",
    result: "SUCCESS",
    ip: clientIp(request.headers),
    userAgent: request.headers.get("user-agent"),
  });
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
