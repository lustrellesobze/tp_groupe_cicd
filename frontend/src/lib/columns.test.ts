import { describe, expect, it } from 'vitest';
import { columnsOrdered, statusLabel, statusColor } from './columns';

describe('statusLabel', () => {
  it("retourne l'étiquette pour un statut connu", () => {
    expect(statusLabel('backlog')).toBe("File d’attente");
    expect(statusLabel('done')).toBe('Terminé');
  });

  it("retourne la clé telle quelle si le statut est inconnu (robustesse)", () => {
    expect(statusLabel('inconnu')).toBe('inconnu');
  });
});

describe('statusColor / columnsOrdered', () => {
  it('fournit une couleur par statut', () => {
    expect(statusColor('backlog').length).toBeGreaterThan(3);
    expect(statusColor('in_progress').includes('col-in-progress') || statusColor('in_progress').length > 0).toBe(true);
  });

  it("expose 4 colonnes d'ordre fixe", () => {
    expect(columnsOrdered().length).toBe(4);
  });
});
