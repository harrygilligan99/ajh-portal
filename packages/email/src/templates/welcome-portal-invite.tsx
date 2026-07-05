import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { BrandedLayout } from "../components/branded-layout";

export interface WelcomePortalInviteProps {
  recipientName?: string | null;
  clientName: string;
  inviteUrl: string;
  primaryColor?: string;
}

export function WelcomePortalInvite({
  recipientName,
  clientName,
  inviteUrl,
  primaryColor = "#0f172a",
}: WelcomePortalInviteProps) {
  return (
    <BrandedLayout
      preview={`Your ${clientName} client portal is ready`}
      clientName={clientName}
      primaryColor={primaryColor}
    >
      <Heading as="h2" style={{ fontSize: "20px", margin: "0 0 12px" }}>
        Welcome to your client portal
      </Heading>
      <Text style={{ fontSize: "14px", lineHeight: "22px", color: "#3f3f46" }}>
        Hi{recipientName ? ` ${recipientName}` : ""},
      </Text>
      <Text style={{ fontSize: "14px", lineHeight: "22px", color: "#3f3f46" }}>
        We’ve set up a portal for <strong>{clientName}</strong> where you can
        track your website, raise update requests, message us and see your
        invoices — all in one place.
      </Text>
      <Text style={{ fontSize: "14px", lineHeight: "22px", color: "#3f3f46" }}>
        Click below to sign in. No password needed — we’ll always email you a
        secure sign-in link.
      </Text>
      <Button
        href={inviteUrl}
        style={{
          backgroundColor: primaryColor,
          color: "#ffffff",
          borderRadius: "8px",
          padding: "12px 20px",
          fontSize: "14px",
          fontWeight: 600,
          display: "inline-block",
          marginTop: "8px",
        }}
      >
        Open your portal
      </Button>
      <Text style={{ fontSize: "12px", color: "#71717a", marginTop: "20px" }}>
        This link is personal to you — please don’t forward it.
      </Text>
    </BrandedLayout>
  );
}

export default WelcomePortalInvite;
