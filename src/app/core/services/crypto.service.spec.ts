import { describe, expect, it } from 'vitest';
import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  it('imports a PEM public key string', async () => {
    const service = new CryptoService();
    const pem = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvzOviFSW7cWkGdU6QMwf
WxoDoXyp4ODuXiJEDZUxnGIdPuBHfIwvIyQT1MIaI8lcFPeXeVYg0gyIw72XNTkv
Wg7tRgLc9fqHFA72RMkZwDNFGNAVwj2PhYeC1gXv2JZowsFA7204cTQbmzrNCuW+
NvyewuaRMudYIut0KUd2duRtE6lA5DzgYfd+0EtBRODO8/LW8psbXD3DPxs2KfAl
ndbt1CR8oEMusgIR5V0DRvCi7X0SziNaG7VJ0fCqm/nHZhg17x6WwRPYTAKMIHuH
Br719Ld5J8Lbu3O/pxTZut0nBEawakSETGIIxoO/H65w4afdQPR4UImdp3C/yHTh
owIDAQAB
-----END PUBLIC KEY-----`;

    const key = await service.importPublicKey(pem);

    expect(key.type).toBe('public');
  });

  it('generates a PEM public key string for registration', async () => {
    const service = new CryptoService();
    const pem = await service.generatePemPublicKey();

    expect(pem).toContain('-----BEGIN PUBLIC KEY-----');
    expect(pem).toContain('-----END PUBLIC KEY-----');
  });
});
