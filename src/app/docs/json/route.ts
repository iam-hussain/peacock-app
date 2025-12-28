import { NextResponse } from "next/server";

import { getSwaggerSpec } from "@/lib/swagger/generator";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /docs/json:
 *   get:
 *     summary: Get Swagger API documentation in JSON format
 *     description: Returns the OpenAPI/Swagger specification in JSON format
 *     tags: [Docs]
 *     responses:
 *       200:
 *         description: Swagger specification in JSON format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
export async function GET() {
  try {
    const spec = getSwaggerSpec();
    return NextResponse.json(spec, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error generating Swagger spec:", error);
    return NextResponse.json(
      { error: "Failed to generate API documentation" },
      { status: 500 }
    );
  }
}
