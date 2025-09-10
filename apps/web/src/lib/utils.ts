import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiBaseUrl() {
  // Prefer Vite env; fallback to relative proxy (same origin)
  const base = import.meta.env.VITE_SERVER_URL as string | undefined;
  return base?.replace(/\/$/, "") ?? "";
}
