import { NextResponse, type NextRequest } from "next/server";
import { appUrl } from "@/lib/env";
import { safeInternalPath } from "@/lib/safe-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Handles PKCE code exchange (magic-link logins from /login). */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeInternalPath(searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, appUrl()));
    }
  }

  return NextResponse.redirect(new URL("/login?error=link", appUrl()));
}
