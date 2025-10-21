import type { ClassValue } from "clsx";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names conditionally and intelligently.
 * Example:
 * cn("p-2", open && "bg-blue-500") 
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
