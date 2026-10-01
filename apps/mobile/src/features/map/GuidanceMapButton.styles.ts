import { StyleSheet } from 'react-native';

// Sous le plancher standard de l'app (64dp) : même décision explicite que le
// bandeau cockpit (GuidanceFooter) — voir son commentaire.
const BUTTON_SIZE = 48;

export const styles = StyleSheet.create({
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(40, 42, 45, 1)',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  pressed: {
    backgroundColor: 'rgba(12, 14, 17, 1)',
  },
});
