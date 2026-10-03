// Identifiant de balade (UUID v4), généré côté mobile. `crypto.randomUUID`
// n'est pas garanti sur Hermes, et ce n'est pas un secret : seulement une clé
// d'unicité pour qu'un envoi rejoué ne crée pas deux balades. Math.random
// suffit — 122 bits tirés au hasard, une collision est hors de portée.
export function createRideId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    return (char === 'x' ? random : (random % 4) + 8).toString(16);
  });
}
