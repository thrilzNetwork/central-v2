import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      listingId,
      profileId,
      visitorName,
      visitorEmail,
      visitorPhone,
      message,
      type = "heart",
    } = body;

    if (!profileId) {
      return NextResponse.json({ error: "profileId required" }, { status: 400 });
    }

    // listingId is required only for heart actions
    if (type === "heart" && !listingId) {
      return NextResponse.json({ error: "listingId required for heart" }, { status: 400 });
    }

    const admin = createAdminClient();

    const insertPayload: Record<string, unknown> = {
      profile_id: profileId,
      visitor_name: visitorName ?? null,
      visitor_email: visitorEmail ?? null,
      visitor_phone: visitorPhone ?? null,
      status: "nuevo",
    };

    // listing_id is optional (contact_form can come from homepage)
    if (listingId) insertPayload.listing_id = listingId;
    // Store message in notes field
    if (message) insertPayload.notes = message;

    const { data: lead, error: leadError } = await admin
      .from("leads")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(insertPayload as any)
      .select()
      .single();

    if (leadError) {
      if (leadError.code === "23505") {
        return NextResponse.json({ success: true, duplicate: true });
      }
      return NextResponse.json({ error: leadError.message }, { status: 500 });
    }

    // Increment hearts on listing via RPC
    if (type === "heart" && listingId) {
      const { error: rpcError } = await admin.rpc("increment_listing_hearts", { listing_id: listingId });
      if (rpcError) console.error("increment_listing_hearts failed:", rpcError.message);
    }

    // Notify realtor
    await admin.from("notifications").insert({
      profile_id: profileId,
      lead_id: lead.id,
      type: type === "heart" ? "new_lead" : "contact_form",
      title:
        type === "heart"
          ? "Nueva persona guardó una propiedad"
          : "Nuevo mensaje de contacto",
      body: visitorEmail
        ? `${visitorName ?? "Visitante"} (${visitorEmail})`
        : (visitorName ?? "Visitante anónimo"),
    });

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (err) {
    console.error("leads route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get("profileId");
  if (!profileId) return NextResponse.json({ error: "profileId required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("leads")
    .select("*, listings(title, slug)")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
