import { MaterialIcons } from '@expo/vector-icons';
import type { ManeuverDto } from '@roadtalk/contracts';
import type React from 'react';
import { View } from 'react-native';

import { Text } from '../../ui';
import { getManeuverIcon } from './maneuver-icons';
import { styles } from './ManeuverIcon.styles';

// En dessous, le numéro de sortie ne serait plus lisible dans l'anneau : le
// pictogramme générique de rond-point prend le relais.
const MIN_SIZE_FOR_EXIT_NUMBER = 28;

// Proportions du rond-point dessiné, relatives à `size`.
const RING_DIAMETER_RATIO = 0.76;
const STROKE_RATIO = 0.11;
const EXIT_NUMBER_FONT_RATIO = 0.4;

interface Props {
  readonly maneuver: ManeuverDto;
  readonly size: number;
  readonly color: string;
}

// Pictogramme d'une manœuvre. Cas particulier : l'entrée dans un rond-point,
// dessinée comme un anneau avec sa voie d'arrivée et le numéro de la sortie
// à prendre au centre — c'est ce numéro qu'on compte en roulant. L'angle
// réel de la sortie n'est pas dessiné : le moteur de routage ne donne que
// son rang, et une branche placée au hasard induirait en erreur.
export function ManeuverIcon({ maneuver, size, color }: Props): React.JSX.Element {
  const exitNumber = maneuver.roundaboutExitNumber;

  if (exitNumber === undefined || size < MIN_SIZE_FOR_EXIT_NUMBER) {
    return <MaterialIcons name={getManeuverIcon(maneuver.type)} size={size} color={color} />;
  }

  const ringDiameter = size * RING_DIAMETER_RATIO;
  const stroke = Math.max(2, size * STROKE_RATIO);

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.entryLane,
          { width: stroke, height: size - ringDiameter + stroke, left: (size - stroke) / 2, backgroundColor: color },
        ]}
      />
      <View
        style={[
          styles.ring,
          {
            width: ringDiameter,
            height: ringDiameter,
            borderRadius: ringDiameter / 2,
            borderWidth: stroke,
            borderColor: color,
            left: (size - ringDiameter) / 2,
          },
        ]}
      >
        <Text
          variant="captionStrong"
          style={[styles.exitNumber, { fontSize: size * EXIT_NUMBER_FONT_RATIO, lineHeight: size * EXIT_NUMBER_FONT_RATIO * 1.15 }]}
        >
          {exitNumber}
        </Text>
      </View>
    </View>
  );
}
