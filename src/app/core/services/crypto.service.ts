import { Injectable } from '@angular/core';

import { CryptoPayload, JsonWebKeyPair } from '../../models/alert';

@Injectable({ providedIn: 'root' })
export class CryptoService {
  private readonly encoder = new TextEncoder();
  private readonly decoder = new TextDecoder();

  async generateKeyPair(): Promise<CryptoKeyPair> {
    return crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt'],
    );
  }

  async exportPublicKey(publicKey: CryptoKey): Promise<JsonWebKey> {
    return crypto.subtle.exportKey('jwk', publicKey);
  }

  async exportPrivateKey(privateKey: CryptoKey): Promise<JsonWebKey> {
    return crypto.subtle.exportKey('jwk', privateKey);
  }

  async exportKeyPair(keyPair: CryptoKeyPair): Promise<JsonWebKeyPair> {
    const [publicKey, privateKey] = await Promise.all([
      this.exportPublicKey(keyPair.publicKey),
      this.exportPrivateKey(keyPair.privateKey),
    ]);

    return { publicKey, privateKey };
  }

  importPublicKey(publicKey: JsonWebKey): Promise<CryptoKey> {
    return crypto.subtle.importKey(
      'jwk',
      publicKey,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['encrypt'],
    );
  }

  importPrivateKey(privateKey: JsonWebKey): Promise<CryptoKey> {
    return crypto.subtle.importKey(
      'jwk',
      privateKey,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['decrypt'],
    );
  }

  async generateAesKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  }

  async encryptAesGcm(plainText: string, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      this.encoder.encode(plainText),
    );

    return this.encodePayload(iv, new Uint8Array(encrypted));
  }

  async decryptAesGcm(payload: string, key: CryptoKey): Promise<string> {
    const { iv, data } = this.decodePayload(payload);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return this.decoder.decode(decrypted);
  }

  async encryptAesKeyWithPublicKey(aesKey: CryptoKey, publicKey: CryptoKey): Promise<string> {
    const rawKey = await crypto.subtle.exportKey('raw', aesKey);
    const encryptedKey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, rawKey);
    return this.arrayBufferToBase64(encryptedKey);
  }

  async decryptAesKeyWithPrivateKey(encryptedKey: string, privateKey: CryptoKey): Promise<CryptoKey> {
    const rawKey = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      this.base64ToArrayBuffer(encryptedKey),
    );

    return crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
  }

  async encryptForRecipient(message: string, recipientPublicKey: JsonWebKey): Promise<CryptoPayload> {
    const publicKey = await this.importPublicKey(recipientPublicKey);
    const aesKey = await this.generateAesKey();
    const [encryptedContent, encryptedKey] = await Promise.all([
      this.encryptAesGcm(message, aesKey),
      this.encryptAesKeyWithPublicKey(aesKey, publicKey),
    ]);

    return {
      encrypted_content: encryptedContent,
      encrypted_key: encryptedKey,
    };
  }

  async decryptFromRecipient(
    encryptedContent: string,
    encryptedKey: string,
    privateKeyJwk: JsonWebKey,
  ): Promise<string> {
    const privateKey = await this.importPrivateKey(privateKeyJwk);
    const aesKey = await this.decryptAesKeyWithPrivateKey(encryptedKey, privateKey);
    return this.decryptAesGcm(encryptedContent, aesKey);
  }

  private encodePayload(iv: Uint8Array, data: Uint8Array): string {
    return JSON.stringify({
      alg: 'AES-GCM',
      iv: this.arrayBufferToBase64(iv),
      data: this.arrayBufferToBase64(data),
    });
  }

  private decodePayload(payload: string): { iv: Uint8Array<ArrayBuffer>; data: Uint8Array<ArrayBuffer> } {
    const parsed = JSON.parse(payload) as { iv: string; data: string };
    return {
      iv: new Uint8Array(this.base64ToArrayBuffer(parsed.iv)),
      data: new Uint8Array(this.base64ToArrayBuffer(parsed.data)),
    };
  }

  private arrayBufferToBase64(value: ArrayBuffer | Uint8Array): string {
    const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
    let binary = '';

    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });

    return btoa(binary);
  }

  private base64ToArrayBuffer(value: string): ArrayBuffer {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  }
}
