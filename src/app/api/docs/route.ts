import { NextResponse } from "next/server";

import { getSwaggerSpec } from "@/lib/swagger/generator";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Get Swagger API documentation
 *     description: Returns the OpenAPI/Swagger specification in JSON format
 *     tags: [Docs]
 *     responses:
 *       200:
 *         description: Swagger specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
export async function GET() {
  try {
    const spec = getSwaggerSpec();
    return NextResponse.json(spec);
  } catch (error) {
    console.error("Error generating Swagger spec:", error);
    return NextResponse.json(
      { error: "Failed to generate API documentation" },
      { status: 500 }
    );
  }
}
