import { History, House, Trophy, UserRound, UsersRound, type LucideIcon } from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Muestra el contador de solicitudes de amistad pendientes. */
  showsFriendRequests?: boolean;
};

/**
 * Secciones principales: las usa la barra lateral (PC). La barra de pestañas
 * (móvil) muestra solo las cuatro primeras; al historial se llega desde el inicio.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Inicio", icon: House },
  { to: "/groups", label: "Grupos", icon: UsersRound },
  { to: "/friends", label: "Amigos", icon: UserRound, showsFriendRequests: true },
  { to: "/rankings", label: "Rankings", icon: Trophy },
  { to: "/history", label: "Historial", icon: History },
];
