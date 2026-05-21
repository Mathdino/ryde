import { neon } from "@neondatabase/serverless";

/*
  Execute no banco antes de usar o perfil:

  ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name  VARCHAR(100);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS phone      VARCHAR(20);
*/

// GET /api/user?clerk_id=xxx
export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { searchParams } = new URL(request.url);
    const clerkId = searchParams.get("clerk_id");

    if (!clerkId) {
      return Response.json({ error: "Missing clerk_id" }, { status: 400 });
    }

    const result = await sql`
      SELECT id, name, email, clerk_id, first_name, last_name, phone
      FROM users
      WHERE clerk_id = ${clerkId}
    `;

    return Response.json({ data: result[0] ?? null });
  } catch (error) {
    console.error("Error fetching user:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST — cria usuário no cadastro
export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { name, email, clerkId } = await request.json();

    if (!name || !email || !clerkId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const response = await sql`
      INSERT INTO users (name, email, clerk_id)
      VALUES (${name}, ${email}, ${clerkId})
    `;

    return new Response(JSON.stringify({ data: response }), { status: 201 });
  } catch (error) {
    return Response.json({ error: error }, { status: 500 });
  }
}

// PATCH — atualiza perfil
export async function PATCH(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { clerkId, firstName, lastName, phone } = await request.json();

    if (!clerkId) {
      return Response.json({ error: "Missing clerkId" }, { status: 400 });
    }

    const fullName = [firstName, lastName].filter(Boolean).join(" ") || null;

    const response = await sql`
      UPDATE users
      SET
        first_name = ${firstName ?? null},
        last_name  = ${lastName  ?? null},
        phone      = ${phone     ?? null},
        name       = COALESCE(${fullName}, name)
      WHERE clerk_id = ${clerkId}
      RETURNING *
    `;

    return Response.json({ data: response[0] });
  } catch (error) {
    console.error("Error updating user:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
