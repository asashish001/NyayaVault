import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, classification, firNumber, jurisdiction } = body;

  if (!title || !classification || !firNumber || !jurisdiction) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Generate a random Case Number
  const caseNumber = `CR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

  try {
    const newCase = await prisma.caseRecord.create({
      data: {
        caseNumber,
        title,
        status: "OPEN",
        classification,
        firNumber,
        station: jurisdiction,
        summary: `Manually created case: ${title}`,
        cctnsRef: `CCTNS-${Math.floor(Math.random() * 1000000)}`,
        // Automatically assign the creator to the new case so they can view it
        assignments: {
          create: {
            userId: user.id
          }
        }
      }
    });

    return NextResponse.json({ success: true, case: newCase });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
