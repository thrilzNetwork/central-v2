import { NextResponse, type NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (_err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const profileId = session.metadata?.profileId;
      const plan = session.metadata?.plan as 'basico' | 'profesional' | 'broker';
      const organizationId = session.metadata?.organizationId;

      if (profileId && plan) {
        await admin.from("profiles").update({
          stripe_customer_id: session.customer as string,
        }).eq("id", profileId);

        let orgId: string | undefined = organizationId;
        if (!orgId) {
           const { data: profile } = await admin.from("profiles").select("organization_id").eq("id", profileId).single();
           orgId = profile?.organization_id ?? undefined;
        }

        if (orgId) {
          await admin.from("organizations").update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            plan: plan,
            subscription_status: 'active'
          }).eq("id", orgId);
        }

        await admin.from("notifications").insert({
          profile_id: profileId,
          type: "plan_upgraded",
          title: `Plan ${plan} activado`,
          body: "Tu suscripción fue activada exitosamente.",
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const profileId = sub.metadata?.profileId;
      const organizationId = sub.metadata?.organizationId;

      let orgId: string | undefined = organizationId;
      if (!orgId && profileId) {
         const { data: profile } = await admin.from("profiles").select("organization_id").eq("id", profileId).single();
         orgId = profile?.organization_id ?? undefined;
      }

      if (orgId) {
        await admin.from("organizations").update({
           plan: 'basico',
           subscription_status: 'canceled'
        }).eq("id", orgId);
      }

      if (profileId) {
        await admin.from("notifications").insert({
          profile_id: profileId,
          type: "plan_cancelled",
          title: "Suscripción cancelada",
          body: "Tu suscripción fue cancelada. Tu portal o equipo ha regresado al plan básico.",
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      if (profile) {
        await admin.from("notifications").insert({
          profile_id: profile.id,
          type: "payment_failed",
          title: "Fallo en el pago",
          body: "No pudimos procesar tu pago. Por favor actualiza tu método de pago.",
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
