import { describe, expect, it } from 'vitest';

import { isUsernameAllowed } from '../../../src/modules/users/username-policy';

describe('isUsernameAllowed', () => {
  it.each(['Mathieu', 'jean_moto', 'Rider42', 'Ducati_916', 'KTM_Duke', 'le_gaulois'])(
    'accepte un pseudo ordinaire : %s',
    (username) => {
      expect(isUsernameAllowed(username)).toBe(true);
    },
  );

  it.each(['Connard', 'xX_salope_Xx', 'BigFuck', 'nazi_rider'])('refuse une insulte, même au milieu : %s', (username) => {
    expect(isUsernameAllowed(username)).toBe(false);
  });

  it.each(['c0nnard', 'sal0pe', 'f_u_c_k', 'saaalope', 'FUUUCK', 'n1gger'])(
    'refuse les contournements courants : %s',
    (username) => {
      expect(isUsernameAllowed(username)).toBe(false);
    },
  );

  it.each(['con', 'le_con', 'con42', 'c0n', 'PD', 'cul_sec'])('refuse un mot court seul ou isolé : %s', (username) => {
    expect(isUsernameAllowed(username)).toBe(false);
  });

  it.each(['Concorde', 'calcul', 'Cockpit', 'technique', 'Violette', 'dispute', 'habite', 'Niger'])(
    "accepte un mot innocent qui contient un mot interdit seulement s'il est isolé : %s",
    (username) => {
      expect(isUsernameAllowed(username)).toBe(true);
    },
  );

  it.each(['admin', 'RoadTalk', 'Support', 'moderateur', 'road_talk'])('refuse un nom réservé : %s', (username) => {
    expect(isUsernameAllowed(username)).toBe(false);
  });

  it('accepte un pseudo qui contient un nom réservé sans le reprendre tel quel', () => {
    expect(isUsernameAllowed('admin_du_78')).toBe(true);
  });

  it('applique les termes ajoutés par la modération', () => {
    const blocked = { contains: ['moche'], exact: ['zut'] };

    expect(isUsernameAllowed('le_moche_du_78', blocked)).toBe(false);
    expect(isUsernameAllowed('zut', blocked)).toBe(false);
    expect(isUsernameAllowed('zut_alors', blocked)).toBe(false);
    expect(isUsernameAllowed('Zutopia', blocked)).toBe(true);
  });
});
