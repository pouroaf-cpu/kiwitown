import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/auth/confirm"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // API routes authenticate themselves and return JSON errors, so they must
  // never be redirected to the HTML login page. The matcher's `api` exclusion
  // is not reliable here, so guard explicitly. Each route's own getViewer()
  // call still refreshes the session cookie when needed.
  if (pathname.startsWith("/api")) {
    return NextResponse.next({ request });
  }

  // Fast path: with no Supabase auth cookie the user can't be signed in, so
  // skip the network round-trip to the Auth server entirely. This keeps
  // logged-out traffic (login page, first visit) from paying for an auth call.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes("-auth-token"));

  if (!hasAuthCookie) {
    if (!isPublic) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  // Bound the auth fetch so a slow/unreachable Supabase backend can't hang the
  // middleware until Vercel kills the invocation (which 504s the whole site).
  // The signal aborts the underlying request, not just our await.
  const controller = new AbortController();
  const authTimeout = setTimeout(() => controller.abort(), 5000);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, signal: controller.signal }),
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and getClaims() — getClaims()
  // both refreshes the session cookie and validates the JWT locally against
  // the project's published ES256 key (no Auth-server round trip).
  let user: unknown = null;
  try {
    const { data } = await supabase.auth.getClaims();
    user = data?.claims ?? null;
  } catch {
    // Supabase unreachable or timed out. Fail closed: keep protected routes
    // behind the login page rather than throwing a 504. Data access stays
    // protected server-side (RLS + getViewer), so this is routing only.
    clearTimeout(authTimeout);
    if (!isPublic) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next({ request });
  }
  clearTimeout(authTimeout);

  // Not logged in → redirect to login
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logged in + on login page → redirect to /
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // API routes self-authenticate (each returns its own 401), so middleware
    // would only add a redundant auth round-trip — and would redirect
    // expired-session requests to the HTML login page instead of returning
    // JSON. Excluding `api` here keeps the auth check on page navigations only.
    "/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|swe-worker.*|worker-.*|workbox-.*|.*\\.png$|.*\\.svg$).*)",
  ],
};
