import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { payment_method_id, payment_intent_id, customer_id } =
      await request.json();

    if (!payment_method_id || !payment_intent_id || !customer_id) {
      return Response.json(
        { error: "Campos obrigatórios ausentes" },
        { status: 400 },
      );
    }

    const result = await stripe.paymentIntents.confirm(payment_intent_id, {
      payment_method: payment_method_id,
    });

    return Response.json({ result });
  } catch (error) {
    console.error("Stripe pay error:", error);
    return Response.json({ error }, { status: 500 });
  }
}
