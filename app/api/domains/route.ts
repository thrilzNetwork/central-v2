import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { addDomain, removeDomain } from "@/lib/vercel-domains/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { domain, action } = await request.json();
    if (!domain) return NextResponse.json({ error: "Domain required" }, { status: 400 });

    const admin = createAdminClient();

    if (action === "remove") {
      await removeDomain(domain);
      await admin.from("domain_mappings").delete().eq("profile_id", user.id).eq("domain", domain);
      await admin.from("profiles").update({ custom_domain: null }).eq("id", user.id).eq("custom_domain", domain);
      return NextResponse.json({ success: true });
    }

    // Add domain
    const result = await addDomain(domain);

    // Build DNS instructions
    const dnsInstructions = result.verification?.length
      ? result.verification
      : [
          {
            type: "CNAME",
            domain: domain.startsWith("www.") ? domain : `www.${domain}`,
            value: "cname.vercel-dns.com",
            reason: "Point your domain to Vercel",
          },
          {
            type: "A",
            domain: domain.replace(/^www\./, ""),
            value: "76.76.21.21",
            reason: "Root domain A record",
          },
        ];

    // Save to DB
    await admin.from("domain_mappings").upsert({
      profile_id: user.id,
      domain,
      verified: result.verified,
      dns_instructions: dnsInstructions,
    });

    if (result.verified) {
      await admin.from("profiles").update({ custom_domain: domain }).eq("id", user.id);
    }

    return NextResponse.json({
      success: true,
      verified: result.verified,
      dnsInstructions,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Domain operation failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("domain_mappings")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json(data ?? []);
}
