import type { GenerateAiRouteRequestDto } from '@roadtalk/contracts';
import { describe, expect, it } from 'vitest';

import { buildRetryFeedback, buildRouteBrief } from '../../../src/modules/ai-routes/route-brief';

const request: GenerateAiRouteRequestDto = {
  origin: { latitude: 45.1885, longitude: 5.7245 },
  tripType: 'loop',
  durationMinutes: 150,
  sinuosity: 'winding',
  roadPreferences: ['avoidHighways'],
  stopKinds: ['passes', 'coffee'],
};

const grenoble = { start: 'Grenoble', destination: undefined };

const toBriancon: GenerateAiRouteRequestDto = {
  ...request,
  tripType: 'one-way',
  destination: { latitude: 44.8986, longitude: 6.6435 },
};

describe('buildRouteBrief', () => {
  it('situe le départ et l’arrivée par leur commune, jamais par leurs coordonnées (C4)', () => {
    const brief = buildRouteBrief(toBriancon, {
      start: 'Grenoble, Auvergne-Rhône-Alpes, France',
      destination: 'Briançon, Provence-Alpes-Côte d’Azur, France',
    });

    expect(brief).toContain('Départ : Grenoble, Auvergne-Rhône-Alpes, France.');
    expect(brief).toContain('arrivée imposée : Briançon, Provence-Alpes-Côte d’Azur, France.');
    for (const coordinate of ['45.1885', '5.7245', '44.8986', '6.6435']) {
      expect(brief).not.toContain(coordinate);
    }
  });

  it('demande de ne pas proposer l’arrivée quand elle est imposée', () => {
    expect(buildRouteBrief(toBriancon, { start: 'Grenoble', destination: 'Briançon' })).toContain(
      'ne la propose pas',
    );
  });

  it('laisse le modèle choisir l’arrivée d’un aller simple sans arrivée imposée', () => {
    expect(buildRouteBrief({ ...request, tripType: 'one-way' }, grenoble)).toContain(
      'le dernier lieu proposé est l’arrivée',
    );
  });

  it('traduit les choix du formulaire en consignes lisibles', () => {
    const brief = buildRouteBrief(request, grenoble);

    expect(brief).toContain('boucle');
    expect(brief).toContain('2 h 30');
    expect(brief).toContain('Éviter autoroutes');
    expect(brief).toContain('un ou plusieurs cols, une halte pour un café');
  });

  it('cite les précisions du motard entre guillemets, et seulement si présentes', () => {
    expect(buildRouteBrief(request, grenoble)).not.toContain('Précisions');
    expect(buildRouteBrief({ ...request, notes: 'Passer par le Vercors' }, grenoble)).toContain(
      'Précisions du motard : « Passer par le Vercors »',
    );
  });

  it('ajoute la correction demandée pour la seconde tentative', () => {
    const brief = buildRouteBrief(request, grenoble, 'Élargis nettement le parcours.');

    expect(brief.endsWith('Correction : Élargis nettement le parcours.')).toBe(true);
  });
});

describe('buildRetryFeedback', () => {
  it('rappelle la proposition précédente et sa durée réelle quand elle est mal calibrée', () => {
    const feedback = buildRetryFeedback(
      { kind: 'too-short', placeNames: ['Vizille', 'Col de Porte'], actualSeconds: 3_600 },
      request,
    );

    expect(feedback).toContain('Vizille → Col de Porte');
    expect(feedback).toContain('1 h 00 de route pour 2 h 30 visées');
    expect(feedback).toContain('Élargis');
  });

  it('demande de resserrer une boucle trop longue autour du départ', () => {
    const feedback = buildRetryFeedback(
      { kind: 'too-long', placeNames: ['Briançon'], actualSeconds: 18_000 },
      request,
    );

    expect(feedback).toContain('autour du départ');
  });

  it('parle de détours entre départ et arrivée quand l’arrivée est imposée', () => {
    const tooShort = buildRetryFeedback(
      { kind: 'too-short', placeNames: ['Vizille'], actualSeconds: 3_600 },
      toBriancon,
    );
    const tooLong = buildRetryFeedback(
      { kind: 'too-long', placeNames: ['Vizille'], actualSeconds: 18_000 },
      toBriancon,
    );

    expect(tooShort).toContain('Ajoute des détours');
    expect(tooLong).toContain('Réduis nettement les détours');
  });
});
