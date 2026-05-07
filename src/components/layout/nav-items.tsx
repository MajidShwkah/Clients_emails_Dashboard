import {
  LayoutDashboard,
  Building2,
  Globe2,
  Send,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  matchPrefix?: string;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Brands", href: "/brands", icon: Building2, matchPrefix: "/brands" },
  { label: "Globals", href: "/globals", icon: Globe2 },
  { label: "Sends", href: "/sends", icon: Send },
  { label: "Missing Deliveries", href: "/missing", icon: AlertTriangle },
];
