import swaggerJsdoc, { Options } from "swagger-jsdoc";

const options: Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Peacock App API",
      version: "1.0.0",
      description:
        "Comprehensive API documentation for Peacock App - A financial management system for clubs and members",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
        description: "Development server",
      },
      {
        url: "https://api.peacock.app",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "session",
          description: "Session cookie for authentication",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
            },
            details: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  path: { type: "string" },
                  message: { type: "string" },
                },
              },
              description: "Validation error details",
            },
          },
        },
        Account: {
          type: "object",
          properties: {
            id: { type: "string", description: "Unique account identifier" },
            firstName: { type: "string", description: "First name" },
            lastName: {
              type: "string",
              description: "Last name",
              nullable: true,
            },
            phone: {
              type: "string",
              description: "Phone number",
              nullable: true,
            },
            email: {
              type: "string",
              description: "Email address",
              nullable: true,
            },
            avatarUrl: {
              type: "string",
              description: "Avatar image URL",
              nullable: true,
            },
            username: { type: "string", description: "Unique username" },
            accessLevel: {
              type: "string",
              enum: ["ADMIN", "MEMBER"],
              description: "Access level",
            },
            role: {
              type: "string",
              enum: ["SUPER_ADMIN", "ADMIN", "MEMBER"],
              description: "User role",
            },
            type: {
              type: "string",
              enum: ["SYSTEM", "MEMBER", "VENDOR"],
              description: "Account type",
            },
            active: {
              type: "boolean",
              description: "Whether account is active",
            },
            canLogin: {
              type: "boolean",
              description: "Whether login is enabled",
            },
            lastLoginAt: {
              type: "string",
              format: "date-time",
              nullable: true,
              description: "Last login timestamp",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              nullable: true,
              description: "Account creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
              description: "Last update timestamp",
            },
          },
        },
        Transaction: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique transaction identifier",
            },
            fromId: { type: "string", description: "Source account ID" },
            toId: { type: "string", description: "Destination account ID" },
            amount: { type: "number", description: "Transaction amount" },
            type: {
              type: "string",
              enum: [
                "DEPOSIT",
                "WITHDRAWAL",
                "LOAN",
                "LOAN_REPAYMENT",
                "INTEREST",
                "FEE",
                "TRANSFER",
              ],
              description: "Transaction type",
            },
            method: {
              type: "string",
              enum: ["ACCOUNT", "CASH", "CARD", "UPI"],
              description: "Payment method",
            },
            currency: {
              type: "string",
              description: "Currency code (e.g., INR)",
            },
            occurredAt: {
              type: "string",
              format: "date-time",
              description: "Transaction timestamp",
            },
            description: {
              type: "string",
              nullable: true,
              description: "Transaction description",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Record creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
            },
          },
        },
        Summary: {
          type: "object",
          properties: {
            id: { type: "string", description: "Summary identifier" },
            monthStartDate: {
              type: "string",
              format: "date",
              description: "Start date of the month",
            },
            availableCash: {
              type: "number",
              description: "Available cash balance",
            },
            totalInvested: {
              type: "number",
              description: "Total invested amount",
            },
            pendingAmounts: {
              type: "number",
              description: "Pending amounts",
            },
            currentValue: {
              type: "number",
              description: "Current portfolio value",
            },
            totalPortfolioValue: {
              type: "number",
              description: "Total portfolio value",
            },
            currentLoanTaken: {
              type: "number",
              description: "Current loan amount",
            },
            interestBalance: {
              type: "number",
              description: "Interest balance",
            },
          },
        },
      },
    },
    tags: [
      { name: "Health", description: "Health check endpoints" },
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Profile", description: "User profile management" },
      { name: "Account", description: "Account management" },
      { name: "Transaction", description: "Transaction management" },
      { name: "Dashboard", description: "Dashboard data endpoints" },
      { name: "Admin", description: "Administrative endpoints" },
      { name: "Search", description: "Search functionality" },
      { name: "Upload", description: "File upload endpoints" },
    ],
  },
  apis: ["./src/app/api/**/*.ts", "./src/app/api/**/route.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
