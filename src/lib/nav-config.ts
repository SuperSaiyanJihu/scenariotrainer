export type NavIconKey = "home" | "practice" | "team" | "manage" | "settings";

export interface NavItem {
  href: string;
  label: string;
  icon: NavIconKey;
  roles?: string[];
}

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/practice-lab", label: "Practice", icon: "practice" },
  {
    href: "/supervisor/practice-lab",
    label: "Team",
    icon: "team",
    roles: ["SUPERVISOR", "ADMINISTRATOR", "SUPERADMIN"],
  },
  {
    href: "/admin/practice-lab",
    label: "Manage",
    icon: "manage",
    roles: ["ADMINISTRATOR", "SUPERADMIN"],
  },
  {
    href: "/admin/practice-lab/settings",
    label: "Settings",
    icon: "settings",
    roles: ["ADMINISTRATOR", "SUPERADMIN"],
  },
];
