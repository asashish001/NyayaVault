import { NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { writeAudit, clientIp } from "@/lib/audit";

export async function requireSession(): Promise<
  { user: SessionUser } | { response: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) {
    return {
      response: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
    };
  }
  return { user };
}

export async function denyUnauthenticated(request: Request) {
  await writeAudit({
    role: "ANONYMOUS",
    action: "ACCESS_DENIED",
    result: "DENIED",
    ip: clientIp(request.headers),
    userAgent: request.headers.get("user-agent"),
    reason: "No session",
  });
}
