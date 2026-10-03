import { describe, expect, it } from 'vitest';

import { parsePlanJson } from '../../../src/modules/ai-routes/claude-route-planner';

const validPlan = {
  title: 'Balcons du Vercors',
  summary: 'Une boucle en corniche au-dessus de Grenoble.',
  waypoints: [
    { name: 'Saint-Nizier-du-Moucherotte', region: 'Isère', note: 'Vue sur Grenoble' },
    { name: 'Villard-de-Lans', region: 'Isère', note: 'Halte café' },
  ],
};

describe('parsePlanJson', () => {
  it('lit une réponse conforme', () => {
    expect(parsePlanJson(JSON.stringify(validPlan))).toEqual(validPlan);
  });

  it('rejette un JSON tronqué', () => {
    expect(parsePlanJson(JSON.stringify(validPlan).slice(0, 40))).toBeUndefined();
  });

  it('rejette une proposition sans lieu ou avec un lieu sans nom', () => {
    expect(parsePlanJson(JSON.stringify({ ...validPlan, waypoints: [] }))).toBeUndefined();
    expect(
      parsePlanJson(
        JSON.stringify({ ...validPlan, waypoints: [{ name: '  ', region: 'Isère', note: '' }] }),
      ),
    ).toBeUndefined();
  });

  it('rejette une proposition avec trop de lieux', () => {
    const waypoints = Array.from({ length: 9 }, (_, index) => ({
      name: `Lieu ${String(index)}`,
      region: 'Isère',
      note: '',
    }));

    expect(parsePlanJson(JSON.stringify({ ...validPlan, waypoints }))).toBeUndefined();
  });
});
