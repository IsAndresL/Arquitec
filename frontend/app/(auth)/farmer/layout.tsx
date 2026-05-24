import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campesino Smart Farming",
  description: "Acceso exclusivo para productores agrícolas",
  manifest: "/manifest-farmer.json",
};

export default function FarmerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
