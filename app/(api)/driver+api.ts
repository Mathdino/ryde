import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const response = await sql`
      SELECT
        id AS driver_id,
        first_name,
        last_name,
        profile_image_url,
        car_image_url,
        car_seats,
        rating
      FROM drivers
    `;

    return Response.json({ data: response });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
