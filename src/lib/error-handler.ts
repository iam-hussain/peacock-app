import { NextResponse } from "next/server";

export type AuthError = "UNAUTHORIZED" | "FORBIDDEN_WRITE" | "FORBIDDEN_ADMIN";

/**
 * Handles authentication and authorization errors
 * Returns appropriate NextResponse with user-friendly messages
 */
export function handleAuthError(error: Error): NextResponse {
  const message = error.message;

  if (message === "UNAUTHORIZED") {
    return NextResponse.json(
      { error: "Please log in to access the dashboard." },
      { status: 401 }
    );
  }

  if (message === "FORBIDDEN_WRITE") {
    return NextResponse.json(
      { error: "You don't have permission to modify transactions." },
      { status: 403 }
    );
  }

  if (message === "FORBIDDEN_ADMIN") {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 }
    );
  }

  // Generic error
  return NextResponse.json(
    { error: error.message || "An unexpected error occurred" },
    { status: 500 }
  );
}

/**
 * Client-side error message mapping
 */
export function getClientErrorMessage(error: string): string {
  if (error === "UNAUTHORIZED") {
    return "Please log in to access the dashboard.";
  }
  if (error === "FORBIDDEN_WRITE") {
    return "You don't have permission to modify transactions.";
  }
  if (error === "FORBIDDEN_ADMIN") {
    return "Admin access required.";
  }
  return error || "An unexpected error occurred";
}
