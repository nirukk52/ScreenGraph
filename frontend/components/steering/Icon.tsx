import { LucideIcon } from "lucide-react";

interface IconProps {
  icon: LucideIcon;
  className?: string;
}

export function Icon({ icon: IconComponent, className }: IconProps) {
  return <IconComponent className={className} /> as any;
}
