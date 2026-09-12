const tseslint = require('typescript-eslint');
const eslintConfigPrettier = require('eslint-config-prettier');
const simpleImportSort = require('eslint-plugin-simple-import-sort');

/**
 * @param {{ tsconfigRootDir: string }} options
 */
module.exports = function baseConfig({ tsconfigRootDir }) {
  return tseslint.config(
    {
      ignores: ['dist/**', '.turbo/**', 'node_modules/**', '.expo/**'],
    },
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
      },
      rules: {
        // Idiome NestJS/Angular : une classe vide portant seulement @Module()/@Injectable()
        // est normale, ce n'est pas un signe de sur-conception.
        '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
      },
    },
    {
      // Ordre des imports normé plutôt que laissé à la discipline de chacun —
      // groupes triés alphabétiquement, autofix disponible via `eslint --fix`.
      plugins: { 'simple-import-sort': simpleImportSort },
      rules: {
        'simple-import-sort/imports': 'error',
        'simple-import-sort/exports': 'error',
      },
    },
    {
      // Fichiers de config à la racine des apps et scripts d'outillage : hors
      // périmètre du tsconfig applicatif, donc pas de type-checking dessus
      // (sinon "not found by the project service"). Ce sont aussi des fichiers
      // chargés directement par Node, pas empaquetés avec l'app.
      files: ['**/*.config.js', '**/*.config.cjs', 'eslint.config.js', 'scripts/**'],
      ...tseslint.configs.disableTypeChecked,
      rules: {
        ...tseslint.configs.disableTypeChecked.rules,
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
    eslintConfigPrettier,
  );
};
