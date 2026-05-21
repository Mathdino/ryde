import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { name, email, amount } = await request.json();

    if (!name || !email || !amount) {
      return Response.json(
        { error: "Campos obrigatórios ausentes" },
        { status: 400 },
      );
    }

    // Busca cliente existente ou cria um novo
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    const customer =
      existingCustomers.data.length > 0
        ? existingCustomers.data[0]
        : await stripe.customers.create({ name, email });

    // Cria o PaymentIntent sem confirmar — o SDK do Stripe confirma client-side
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(amount) * 100),
      currency: "brl",
      customer: customer.id,
      description: "Pagamento de corrida com Ryde",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
    });

    return Response.json({ paymentIntent, customer: customer.id });
  } catch (error) {
    console.error("Stripe create error:", error);
    return Response.json({ error }, { status: 500 });
  }
}
