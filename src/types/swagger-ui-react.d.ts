declare module "swagger-ui-react" {
  import { Component } from "react";

  interface SwaggerUIProps {
    spec?: any;
    url?: string;
    onComplete?: (system: any) => void;
    requestInterceptor?: (request: any) => any;
    responseInterceptor?: (response: any) => any;
    docExpansion?: "list" | "full" | "none";
    defaultModelsExpandDepth?: number;
    defaultModelExpandDepth?: number;
    persistAuthorization?: boolean;
    deepLinking?: boolean;
    showExtensions?: boolean;
    showCommonExtensions?: boolean;
    filter?: boolean | string;
    tryItOutEnabled?: boolean;
    requestSnippetsEnabled?: boolean;
    requestSnippets?: {
      generators?: {
        [key: string]: {
          [key: string]: any;
        };
      };
      defaultExpanded?: boolean;
      languages?: string[];
    };
    displayOperationId?: boolean;
    displayRequestDuration?: boolean;
    defaultModelRendering?: "example" | "model";
    presets?: any[];
    plugins?: any[];
    layout?: string;
    supportedSubmitMethods?: string[];
    validatorUrl?: string | null;
    withCredentials?: boolean;
    oauth2RedirectUrl?: string;
    showMutatedRequest?: boolean;
    [key: string]: any;
  }

  export default class SwaggerUI extends Component<SwaggerUIProps> {}
}

declare module "swagger-ui-react/swagger-ui.css" {
  const content: string;
  export default content;
}
