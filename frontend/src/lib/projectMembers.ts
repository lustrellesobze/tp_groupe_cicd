import type { Project, User } from '../types/api';

/** Membres + propriétaire, sans doublon, tri par nom. */
export function projectAssignable(p: Project): User[] {
  const map = new Map<number, User>();
  (p.members ?? []).forEach((m) => map.set(m.id, m));
  if (p.owner && !map.has(p.owner.id)) {
    map.set(p.owner.id, p.owner);
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
}
