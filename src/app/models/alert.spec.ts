import { normalizeAlertSeverity, normalizeCreateAlertPayload } from './alert';

describe('alert payload normalization', () => {
  it('builds a payload aligned with the encrypted alert contract', () => {
    const payload = normalizeCreateAlertPayload({
      encrypted_content: 'enc-content',
      encrypted_key: 'enc-key',
      encrypted_content_nonce: 'nonce',
      encrypted_content_tag: 'tag',
      recipient_keys: [
        {
          recipient_user_id: 'user-1',
          encrypted_key: 'enc-key',
          key_encryption_algorithm: 'RSA-OAEP-SHA256',
        },
      ],
      severity: 'high',
    });

    expect(payload.encryption_algorithm).toBe('AES-256-GCM');
    expect(payload.key_encryption_algorithm).toBe('RSA-OAEP-SHA256');
    expect(payload.recipient_keys[0].recipient_user_id).toBe('user-1');
    expect(payload.severity).toBe('high');
  });

  it('normalizes unsupported severity values to high', () => {
    expect(normalizeAlertSeverity('critical' as never)).toBe('high');
    expect(normalizeAlertSeverity('medium')).toBe('medium');
  });
});
