import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";

const PUBLIC_PATHS    = ["/login", "/auth"];
const IDLE_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours
const ACTIVITY_COOKIE = "rime_last_active";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // ── Idle timeout ────────────────────────────────────────────────────────────
  if (user && !isPublic) {
    const lastActive = request.cookies.get(ACTIVITY_COOKIE)?.value;
    const now        = Date.now();

    if (lastActive && now - Number(lastActive) > IDLE_TIMEOUT_MS) {
      // Session idle too long — sign out and redirect
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search   = "";
      url.searchParams.set("reason", "idle");
      const redirect = NextResponse.redirect(url);
      redirect.cookies.delete(ACTIVITY_COOKIE);
      return redirect;
    }

    // Refresh last-active timestamp on every authenticated request
    supabaseResponse.cookies.set(ACTIVITY_COOKIE, String(now), {
      httpOnly: true,
      sameSite: "lax",
      path:     "/",
      maxAge:   IDLE_TIMEOUT_MS / 1000,
    });
  }

  // ── Route guards ────────────────────────────────────────────────────────────
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search   = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
