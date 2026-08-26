import { createUserId } from '@roadtalk/domain-shared';
import { describe, expect, it } from 'vitest';

import { AccessTokenService } from '../../../src/infrastructure/auth/access-token.service';

describe('AccessTokenService', () => {
  it('émet un token que verify() décode vers le même userId', async () => {
    const service = new AccessTokenService();
    const userId = createUserId();

    const token = await service.issue(userId);
    const verified = await service.verify(token);

    expect(verified).toBe(userId);
  });

  it('rejette un token dont le payload a été altéré', async () => {
    const service = new AccessTokenService();
    const token = await service.issue(createUserId());
    const parts = token.split('.');
    const [header, payload, signature] = parts;
    if (header === undefined || payload === undefined || signature === undefined) {
      throw new Error('JWT mal formé, 3 segments attendus');
    }
    // Modifier un caractère au milieu du payload (pas le dernier octet, dont
    // le bit de padding base64url peut ne rien changer au décodage).
    const mid = Math.floor(payload.length / 2);
    const tamperedChar = payload[mid] === 'a' ? 'b' : 'a';
    const tamperedPayload = `${payload.slice(0, mid)}${tamperedChar}${payload.slice(mid + 1)}`;
    const tampered = `${header}.${tamperedPayload}.${signature}`;

    await expect(service.verify(tampered)).rejects.toThrow();
  });

  it('rejette un token vide', async () => {
    const service = new AccessTokenService();

    await expect(service.verify('')).rejects.toThrow();
  });
});
