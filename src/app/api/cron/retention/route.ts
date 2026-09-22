import { NextResponse } from "next/server";
import { runRetentionPurge } from "@/lib/retention-cron";

export async function GET(request: Request) {
  // In a production app, verify a secret token in the headers to prevent abuse.
  // Example: if (request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) ...
  
  try {
    await runRetentionPurge();
    return NextResponse.json({ success: true, message: "Retention purge scan completed successfully." });
  } catch (error: any) {
    console.error("[Retention Cron API] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
