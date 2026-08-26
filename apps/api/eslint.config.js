const boundaries = require('eslint-plugin-boundaries');
const baseConfig = require('@roadtalk/config/eslint.base');

module.exports = [
  ...baseConfig({ tsconfigRootDir: __dirname }),
  {
    // ADR-001 : dépendances en couches par contexte (Ride, Route, Navigation).
    // domain -> rien, application -> domain, infrastructure/presentation -> domain+application.
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'domain', pattern: 'src/modules/*/domain/**' },
        { type: 'application', pattern: 'src/modules/*/application/**' },
        { type: 'infrastructure', pattern: 'src/modules/*/infrastructure/**' },
        { type: 'presentation', pattern: 'src/modules/*/presentation/**' },
      ],
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'domain', allow: [] },
            { from: 'application', allow: ['domain'] },
            { from: 'infrastructure', allow: ['domain', 'application'] },
            { from: 'presentation', allow: ['domain', 'application'] },
          ],
        },
      ],
    },
  },
  {
    // Le domaine est en TypeScript pur : aucun framework, aucune infrastructure.
    files: ['src/modules/*/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@nestjs/*'],
              message: 'Le domaine ne dépend d’aucun framework (voir ADR-001).',
            },
            {
              group: ['drizzle-orm', 'drizzle-orm/*'],
              message: 'Le domaine ne dépend d’aucune infrastructure (voir ADR-001).',
            },
            {
              group: ['fastify'],
              message: 'Le domaine ne dépend d’aucun framework HTTP (voir ADR-001).',
            },
          ],
        },
      ],
    },
  },
];
