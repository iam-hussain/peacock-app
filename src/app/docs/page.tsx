"use client";

import { useEffect, useState } from "react";
import SwaggerUI from "swagger-ui-react";

import "swagger-ui-react/swagger-ui.css";

export default function DocsPage() {
  const [spec, setSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSpec() {
      try {
        const response = await fetch("/api/docs");
        if (!response.ok) {
          throw new Error("Failed to fetch API documentation");
        }
        const data = await response.json();
        setSpec(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchSpec();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">
          Loading API documentation...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  if (!spec) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <SwaggerUI spec={spec} />
    </div>
  );
}
