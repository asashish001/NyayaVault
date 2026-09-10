import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { env, loginSchema } from "@/lib/env";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { writeAudit, clientIp } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  const userAgent = request.headers.get("user-agent");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    await writeAudit({
      role: "ANONYMOUS",
      action: "LOGIN",
      result: "DENIED",
      ip,
      userAgent,
      reason: "Invalid login payload",
    });
    return NextResponse.json({ error: "Invalid credentials payload" }, { status: 400 });
  }

  const { email, password, otp } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    await writeAudit({
      actorId: user?.id,
      role: user?.role ?? "ANONYMOUS",
      action: "LOGIN",
      result: "DENIED",
      ip,
      userAgent,
      reason: "Invalid email or password",
    });
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (user.mfaEnabled) {
    if (!otp) {
      return NextResponse.json({
        mfaRequired: true,
        message: "Enter the demo OTP to complete login.",
      });
    }
    if (otp !== env.demoOtp) {
      await writeAudit({
        actorId: user.id,
        role: user.role,
        action: "LOGIN",
        result: "DENIED",
        ip,
        userAgent,
        reason: "Invalid MFA OTP",
      });
      return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
    }
  }

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  await setSessionCookie(token);

  await writeAudit({
    actorId: user.id,
    role: user.role,
    action: "LOGIN",
    result: "SUCCESS",
    ip,
    userAgent,
    reason: "Demo login",
  });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      station: user.station,
      department: user.department,
    },
  });
}
