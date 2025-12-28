declare module "swagger-jsdoc" {
  export interface Options {
    definition: Record<string, any>;
    apis: string[];
  }

  export default function swaggerJsdoc(options: Options): any;
}
