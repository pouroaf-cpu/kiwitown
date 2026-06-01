import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/auth/confirm"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
