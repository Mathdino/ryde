import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { name, email, amount, paymentMethodId } = await request.json();

    if (!name || !email || !amount || !paymentMethodId) {
      return Response.json(
        { error: "Campos obrigatórios ausentes" },
        { status: 400 },
      );
    }

    // Busca cliente existente ou cria um novo
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    let customer =
      existingCustomers.data.length > 0
        ? existingCustomers.data[0]
        : await stripe.customers.create({ name, email });

    // Vincula o método de pagamento ao cliente
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });

    // Cria o PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(amount) * 100),
      currency: "usd",
      customer: customer.id,
      payment_method: paymentMethodId,
    });

    return Response.json({ paymentIntent, customer: customer.id });
  } catch (error) {
    console.error("Stripe create error:", error);
    return Response.json({ error }, { status: 500 });
  }
}
