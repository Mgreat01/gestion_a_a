import { Injectable } from '@angular/core';

type KeyStorageName = 'privateKey' | 'publicKey' | 'recipientPublicKey';

@Injectable({ providedIn: 'root' })
export class KeyStorageService {
  private readonly databaseName = 'alert-security-keys';
  private readonly storeName = 'keys';
  private readonly databaseVersion = 1;

  savePrivateKey(privateKey: JsonWebKey): Promise<void> {
    return this.set('privateKey', privateKey);
  }

  getPrivateKey(): Promise<JsonWebKey | null> {
    return this.get('privateKey');
  }

  savePublicKey(publicKey: JsonWebKey): Promise<void> {
    return this.set('publicKey', publicKey);
  }

  getPublicKey(): Promise<JsonWebKey | null> {
    return this.get('publicKey');
  }

  saveRecipientPublicKey(publicKey: JsonWebKey): Promise<void> {
    return this.set('recipientPublicKey', publicKey);
  }

  getRecipientPublicKey(): Promise<JsonWebKey | null> {
    return this.get('recipientPublicKey');
  }

  private async set(name: KeyStorageName, value: JsonWebKey): Promise<void> {
    const database = await this.openDatabase();

    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(this.storeName, 'readwrite');
      transaction.objectStore(this.storeName).put(value, name);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    database.close();
  }

  private async get(name: KeyStorageName): Promise<JsonWebKey | null> {
    const database = await this.openDatabase();

    const value = await new Promise<JsonWebKey | null>((resolve, reject) => {
      const transaction = database.transaction(this.storeName, 'readonly');
      const request = transaction.objectStore(this.storeName).get(name);

      request.onsuccess = () => resolve((request.result as JsonWebKey | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });

    database.close();
    return value;
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, this.databaseVersion);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(this.storeName)) {
          database.createObjectStore(this.storeName);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
