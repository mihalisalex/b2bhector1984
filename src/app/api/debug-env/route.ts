import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return NextResponse.json({
    hasUrl: !!url,
    urlLength: url?.length ?? 0,
    urlPreview: url ? `${url.slice(0, 12)}...${url.slice(-12)}` : null,
    hasKey: !!key,
    keyLength: key?.length ?? 0,
  });
}
