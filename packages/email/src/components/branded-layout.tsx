import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export interface BrandedLayoutProps {
  /** Preview line shown in inbox list views */
  preview: string;
  /** Client business name shown in the footer alongside AJH */
  clientName?: string;
  /** Client logo (falls back to plain text header) */
  logoUrl?: string | null;
  /** Accent colour for buttons / highlights */
  primaryColor?: string;
  children: React.ReactNode;
}

export const AJH_NAME = "AJH Website Management";

const main = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "32px",
  borderRadius: "12px",
  maxWidth: "520px",
};

export function BrandedLayout({
  preview,
  clientName,
  logoUrl,
  children,
}: BrandedLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={{ padding: "24px 12px" }}>
          <Section style={container}>
            {logoUrl ? (
              <Img src={logoUrl} alt={clientName ?? AJH_NAME} height="40" />
            ) : (
              <Text style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
                {AJH_NAME}
              </Text>
            )}
            <Hr style={{ borderColor: "#e4e4e7", margin: "20px 0" }} />
            {children}
            <Hr style={{ borderColor: "#e4e4e7", margin: "24px 0 12px" }} />
            <Text style={{ fontSize: "12px", color: "#71717a", margin: 0 }}>
              Sent by {AJH_NAME}
              {clientName ? ` on behalf of ${clientName}` : ""}. If you weren’t
              expecting this email you can safely ignore it.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
