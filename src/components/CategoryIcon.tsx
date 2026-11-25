import React from 'react';
import {
  Utensils,
  Bike,
  Wifi,
  Home,
  Gamepad2,
  GraduationCap,
  ShoppingBag,
  CircleEllipsis,
  Tag,
  Coffee,
  Car,
  Book,
  Heart,
  Briefcase,
  Music,
  Smartphone,
  Zap,
  Gift,
  Film,
  Plane,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  Utensils,
  Bike,
  Wifi,
  Home,
  Gamepad2,
  GraduationCap,
  ShoppingBag,
  CircleEllipsis,
  Tag,
  Coffee,
  Car,
  Book,
  Heart,
  Briefcase,
  Music,
  Smartphone,
  Zap,
  Gift,
  Film,
  Plane,
};

interface Props {
  name: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<Props> = ({ name, className = 'w-5 h-5', size = 20 }) => {
  const IconComponent = ICON_MAP[name] || Tag;
  return <IconComponent className={className} size={size} />;
};
