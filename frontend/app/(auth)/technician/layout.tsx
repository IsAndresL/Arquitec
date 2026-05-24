import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Técnico Smart Farming",
  description: "Acceso exclusivo para ingenieros y asesores",
  manifest: "/manifest-technician.json",
};

export default function TechnicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
