"use client";

import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { ReactNode } from "react";

interface ScreenshotAreaProps {
  title: string;
  children: ReactNode;
  capturedAt?: Date;
  identifier?: string;
}

const TIMEZONE = "Asia/Kolkata";

export function ScreenshotArea({
  title,
  children,
  capturedAt,
  identifier,
}: ScreenshotAreaProps) {
  const captured = capturedAt || new Date();
  const zonedDate = toZonedTime(captured, TIMEZONE);
  const capturedAtLabel = `${format(zonedDate, "dd MMM yyyy")} • ${format(
    zonedDate,
    "HH:mm"
  )} IST`;

  return (
    <div
      id="export-root"
      style={{
        background: "#F6F7FB",
        padding: 48,
        position: "absolute",
        left: "-9999px",
        top: 0,
        minWidth: 1200,
        width: "max-content",
        zIndex: -1,
        opacity: 0,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 28,
          boxShadow: "0 16px 50px rgba(16,24,40,0.18)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "40px 56px 28px 56px",
            borderBottom: "2px solid #EBEDF4",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 24,
            }}
          >
            {/* Left: Logo + Title */}
            <div
              style={{
                display: "flex",
                gap: 18,
                alignItems: "flex-start",
              }}
            >
              {/* Logo Badge */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  background: "#172030",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/peacock.svg"
                  alt="Peacock Club"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    padding: 8,
                  }}
                />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#172030",
                    lineHeight: 1.2,
                  }}
                >
                  Peacock Club
                </div>
                <div
                  style={{
                    fontSize: 44,
                    fontWeight: 900,
                    color: "#172030",
                    lineHeight: 1.1,
                    marginTop: 4,
                  }}
                >
                  {title} Snapshot
                </div>
              </div>
            </div>

            {/* Right: Timestamp */}
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 18,
                  color: "#5C667A",
                  lineHeight: 1.4,
                }}
              >
                Captured: {capturedAtLabel}
              </div>
              {identifier && (
                <div
                  style={{
                    fontSize: 14,
                    color: "#8B95A7",
                    marginTop: 4,
                  }}
                >
                  {identifier}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 34 }}>
          <div
            style={{
              border: "3px solid #E1E5EF",
              borderRadius: 18,
              overflow: "hidden",
              background: "#fff",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
