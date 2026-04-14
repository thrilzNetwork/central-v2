import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "centralbolivia.com";

// Routes that belong to the platform (not tenant-facing)
const PLATFORM_PATHS = [
  "/dashboard",
  "/admin",
  "/portal",
  "/api",
  "/(auth)",
  "/login",
  "/registro",
  "/(onboarding)",
  "/bienvenido",
  "/_next",
  "/favicon",
  "/robots",
  "/sitemap",
];

function isPlatformPath(pathname: string): boolean {
  return PLATFORM_PATHS.some((p) => pathname.startsWith(p));
}

async function refreshSession(request: NextRequest): Promise<NextResponse> {
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

  // Refresh session (do not remove this line)
  await supabase.auth.getUser();

  return supabaseResponse;
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";
  const host = hostname
    .replace(":3000", "")
    .replace(":3001", "")
    .replace(":8080", "");

  const pathname = url.pathname;

  // ── Detect request type ──────────────────────────────
  const isLocalDev =
    host === "localhost" || host.endsWith(".localhost");
  const isMainDomain =
    host === ROOT_DOMAIN ||
    host === `www.${ROOT_DOMAIN}` ||
    host === "localhost";
  const isSubdomain =
    !isMainDomain &&
    (host.endsWith(`.${ROOT_DOMAIN}`) ||
      (isLocalDev && host.includes(".")));
  const isCustomDomain = !isMainDomain && !isSubdomain && !isLocalDev;

  // ── Always refresh auth session for platform routes ──
  if (isMainDomain || isPlatformPath(pathname)) {
    return refreshSession(request);
  }

  // ── Resolve tenant slug ──────────────────────────────
  let tenantSlug: string | null = null;

  if (isSubdomain) {
    tenantSlug = host.split(".")[0];
  } else if (isLocalDev && host.includes(".")) {
    tenantSlug = host.split(".")[0];
  } else if (isCustomDomain) {
    // Inline fetch to avoid importing Node-only resolver in edge runtime
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      }
    );

    const { data: mapping } = await supabase
      .from("domain_mappings")
      .select("profile_id")
      .eq("domain", host)
      .eq("verified", true)
      .maybeSingle();

    if (mapping) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("slug")
        .eq("id", mapping.profile_id)
        .single();
      tenantSlug = profile?.slug ?? null;
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("slug")
        .eq("custom_domain", host)
        .maybeSingle();
      tenantSlug = profile?.slug ?? null;
    }
  }

  if (!tenantSlug) {
    return NextResponse.next();
  }

  // ── Rewrite to tenant route group ───────────────────
  const rewriteUrl = url.clone();
  // Pass tenant slug via REQUEST headers so server components can read via headers()
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-slug", tenantSlug);
  requestHeaders.set("x-tenant-host", host);

  const response = NextResponse.rewrite(rewriteUrl, {
    request: { headers: requestHeaders },
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     * - public files (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
