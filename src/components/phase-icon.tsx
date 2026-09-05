import {
  DoorOpen,
  IdCard,
  EyeOff,
  Home,
  DoorClosed,
  Calculator,
  FileText,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

const PHASE_ICONS: Record<string, LucideIcon> = {
  "door-open": DoorOpen,
  "id-card": IdCard,
  "eye-off": EyeOff,
  home: Home,
  "door-closed": DoorClosed,
  calculator: Calculator,
  "file-text": FileText,
  "triangle-alert": TriangleAlert,
};

export function PhaseIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = PHASE_ICONS[icon] ?? TriangleAlert;
  return <Icon className={className} />;
}
