"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Home as HomeIcon,
  MapPin,
  Sprout,
  ClipboardList,
  Bell,
  DollarSign,
  Lightbulb,
  Settings,
  Shield,
  Users,
  FileText,
} from "lucide-react";
import { COLORS } from "@/lib/design-system";

export default function Navigation() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  // Si está cargando o no hay usuario, no mostramos la barra para evitar saltos de rol
  if (isLoading || !user) return null;

  const isTechnician = user.type === "technician";
  const primaryColor = isTechnician ? COLORS.blue.primary : COLORS.green.primary;

  const navItems = isTechnician
    ? [
        { href: "/admin", label: "Inicio", icon: Shield },
        { href: "/admin/farmers", label: "Productores", icon: Users },
        { href: "/admin/recommendations", label: "Consejos", icon: Lightbulb },
        { href: "/admin/reports", label: "Reportes", icon: FileText },
        { href: "/settings", label: "Ajustes", icon: Settings },
      ]
    : [
        { href: "/dashboard", label: "Inicio", icon: HomeIcon },
        { href: "/parcels", label: "Parcelas", icon: MapPin },
        { href: "/data", label: "Observar", icon: Sprout },
        { href: "/costs", label: "Gastos", icon: DollarSign },
        { href: "/recommendations", label: "Consejos", icon: Lightbulb },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${
                isActive ? "" : "text-gray-400"
              }`}
              style={{ color: isActive ? primaryColor : undefined }}
            >
              <Icon size={isActive ? 24 : 20} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-bold ${isActive ? "opacity-100" : "opacity-60"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
