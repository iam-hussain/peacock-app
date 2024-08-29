import { calculateReturnsHandler } from "@/passbook/returns-middleware";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  calculateReturnsHandler();
  return NextResponse.json({
    success: true,
  });
}
