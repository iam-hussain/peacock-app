import { swaggerSpec } from "./config";

export function getSwaggerSpec() {
  // swaggerJsdoc is synchronous, but we keep it as a function for consistency
  return swaggerSpec;
}
