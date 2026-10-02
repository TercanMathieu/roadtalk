import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Voie d'arrivée : part du bas du pictogramme et rejoint l'anneau.
  entryLane: {
    position: 'absolute',
    bottom: 0,
  },
  exitNumber: {
    fontWeight: '800',
  },
});
