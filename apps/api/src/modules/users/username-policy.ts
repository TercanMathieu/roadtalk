// Filtre des pseudos (ADR-003). Fonction pure, sans NestJS ni base : c'est la
// règle "ce texte peut-il servir de pseudo public ?", testable seule.
//
// Aucun filtre automatique n'est complet — celui-ci écarte l'évident et ses
// contournements courants (chiffres à la place des lettres, lettres répétées,
// séparateurs). Le reste relèvera du signalement, quand les profils seront
// visibles par d'autres.

// Interdits même à l'intérieur d'un pseudo. N'y mettre que des mots qui
// n'apparaissent pas par hasard dans un mot innocent — sinon voir EXACT_WORDS.
const SUBSTRING_WORDS: readonly string[] = [
  // Haine, racisme, homophobie
  'nigger', 'nigga', 'negro', 'negre', 'bougnoul', 'bicot', 'youpin', 'chinetoque', 'faggot',
  'tapette', 'tarlouze', 'tarlouse', 'gouine', 'nazi', 'hitler', 'daesh', 'jihad', 'terroris',
  // Insultes
  'salope', 'salaud', 'connard', 'connasse', 'conard', 'encule', 'enfoire', 'batard', 'petasse',
  'pouffiasse', 'poufiasse', 'merde', 'couille', 'branleur', 'branleuse', 'fuck', 'bitch', 'asshole',
  'cunt', 'whore', 'slut', 'wanker', 'pussy', 'shit',
  // Sexuel
  'porn', 'pedophil', 'hentai', 'penis', 'vagin', 'nichon', 'blowjob', 'handjob',
];

// Interdits seulement quand ils forment le pseudo entier ou l'un de ses
// morceaux (séparés par un underscore ou des chiffres) : ils se cachent dans
// trop de mots innocents pour être cherchés partout ("cul" dans "calcul",
// "con" dans "concorde", "cock" dans "cockpit", "nique" dans "technique").
const EXACT_WORDS: readonly string[] = [
  'con', 'cul', 'pute', 'putes', 'bite', 'bites', 'nique', 'niquer', 'pd', 'pede', 'fdp', 'ntm', 'viol',
  'violeur', 'chatte', 'sexe', 'sex', 'anus', 'suce', 'pedo', 'kkk', 'isis', 'rape', 'rapist', 'dick',
  'cock', 'kike', 'spic', 'chink', 'milf', 'cum',
];

// Noms qui feraient passer un compte pour officiel.
const RESERVED_NAMES: readonly string[] = [
  'admin', 'administrateur', 'administrator', 'roadtalk', 'support', 'moderateur', 'moderator', 'modo',
  'staff', 'officiel', 'official', 'system', 'systeme',
];

const LEET_SUBSTITUTIONS: Readonly<Record<string, string>> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '8': 'b',
  '9': 'g',
};

function hasDoubledLetter(word: string): boolean {
  return /(.)\1/.test(word);
}

// Deux formes "collées" du pseudo, chiffres ramenés aux lettres et
// underscores retirés :
//   - `squeezed` : les lettres répétées 3 fois ou plus réduites à 2 ;
//   - `flattened` : toute répétition réduite à 1 ("saaalope" → "salope").
// La seconde n'est comparée qu'aux mots sans lettre doublée : aplatir
// "nigger" donnerait "niger", et bloquerait un nom de pays.
function joinedForms(username: string): { squeezed: string; flattened: string } {
  const joined = username
    .toLowerCase()
    .replace(/[0-9]/g, (digit) => LEET_SUBSTITUTIONS[digit] ?? '')
    .replace(/_/g, '');

  return {
    squeezed: joined.replace(/(.)\1{2,}/g, '$1$1'),
    flattened: joined.replace(/(.)\1+/g, '$1'),
  };
}

function containsWord(forms: { squeezed: string; flattened: string }, word: string): boolean {
  return forms.squeezed.includes(word) || (!hasDoubledLetter(word) && forms.flattened.includes(word));
}

function equalsWord(forms: { squeezed: string; flattened: string }, word: string): boolean {
  return forms.squeezed === word || (!hasDoubledLetter(word) && forms.flattened === word);
}

// Termes ajoutés par la modération (table blocked_username_terms), même
// sémantique que les deux listes ci-dessus.
export interface BlockedTerms {
  readonly contains: readonly string[];
  readonly exact: readonly string[];
}

const NO_BLOCKED_TERMS: BlockedTerms = { contains: [], exact: [] };

// Forme sous laquelle un terme de modération est stocké et comparé : même
// conversion que le pseudo lui-même, pour que "C0nnard" bloque "connard".
export function normalizeBlockedTerm(term: string): string {
  return joinedForms(term).squeezed;
}

// Le format (longueur, caractères) est déjà garanti par usernameSchema avant
// d'arriver ici ; cette fonction ne juge que le contenu.
export function isUsernameAllowed(username: string, blocked: BlockedTerms = NO_BLOCKED_TERMS): boolean {
  const forms = joinedForms(username);
  const substringWords = [...SUBSTRING_WORDS, ...blocked.contains];
  const exactWords = [...EXACT_WORDS, ...blocked.exact];

  if (substringWords.some((word) => containsWord(forms, word))) {
    return false;
  }

  if ([...exactWords, ...RESERVED_NAMES].some((word) => equalsWord(forms, word))) {
    return false;
  }

  // Morceaux du pseudo tel que saisi ("le_con", "con42") : chacun est comparé
  // seul aux mots courts, sans la conversion chiffres → lettres qui, sur un
  // morceau, n'a plus de sens.
  const tokens = username
    .toLowerCase()
    .split(/[_0-9]+/)
    .filter((token) => token.length > 0);

  return !tokens.some((token) => exactWords.includes(token));
}
