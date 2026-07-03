import {
  Tag, Home, Briefcase, Wrench, Users, Hand, MessageSquare,
  type LucideIcon,
} from 'lucide-react'

const MAP: Record<string, LucideIcon> = {
  Tag, Home, Briefcase, Wrench, Users, Hand, MessageSquare,
}

export function categoryIcon(name: string | null | undefined): LucideIcon {
  return (name && MAP[name]) || Tag
}
