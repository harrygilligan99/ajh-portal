import { NextResponse } from "next/server";
import { appUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", appUrl()), { status: 303 });
}
