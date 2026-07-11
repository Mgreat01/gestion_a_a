import { Injectable } from '@angular/core';
import { CryptoPayload, JsonWebKeyPair } from '../../models/alert';

export type PublicKeyInput = JsonWebKey | string;

@Injectable({
  providedIn:'root'
})
export class CryptoService {


private readonly encoder = new TextEncoder();

private readonly decoder = new TextDecoder();



async generateKeyPair():Promise<CryptoKeyPair>{

return crypto.subtle.generateKey(

{
name:'RSA-OAEP',
modulusLength:4096,
publicExponent:new Uint8Array([1,0,1]),
hash:'SHA-256'
},

true,

[
'encrypt',
'decrypt'
]

);

}



async exportKeyPair(
keyPair:CryptoKeyPair
):Promise<JsonWebKeyPair>{

const [
publicKey,
privateKey
]=await Promise.all([

crypto.subtle.exportKey(
'jwk',
keyPair.publicKey
),

crypto.subtle.exportKey(
'jwk',
keyPair.privateKey
)

]);


return {
publicKey,
privateKey
};

}




async importPublicKey(
key:PublicKeyInput
):Promise<CryptoKey>{

if (typeof key === 'string') {
  return this.importPemPublicKey(key);
}

return crypto.subtle.importKey(

'jwk',

key,

{
name:'RSA-OAEP',
hash:'SHA-256'
},

true,

[
'encrypt'
]

);

}

private async importPemPublicKey(pem:string):Promise<CryptoKey>{
  const normalizedPem = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s+/g, '');

  const binaryDer = this.base64ToArrayBuffer(normalizedPem);

  return crypto.subtle.importKey(
    'spki',
    binaryDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );
}

async generatePemPublicKey(): Promise<string> {
  const keyPair = await this.generateKeyPair();
  const exported = await this.exportKeyPair(keyPair);

  const publicKeyJwk = exported.publicKey;
  const publicKeyPem = await this.exportPublicKeyToPem(publicKeyJwk);

  return publicKeyPem;
}

private async exportPublicKeyToPem(publicKey: JsonWebKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('spki', await crypto.subtle.importKey('jwk', publicKey, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['encrypt']));
  const bytes = new Uint8Array(exported);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return `-----BEGIN PUBLIC KEY-----\n${btoa(binary).match(/.{1,64}/g)?.join('\n') ?? btoa(binary)}\n-----END PUBLIC KEY-----`;
}




async generateAesKey(){

return crypto.subtle.generateKey(

{
name:'AES-GCM',
length:256
},

true,

[
'encrypt',
'decrypt'
]

);

}





async encryptForRecipient(
message:string,
recipientPublicKey:JsonWebKey
):Promise<CryptoPayload>{



const rsaPublic =
await this.importPublicKey(recipientPublicKey);



const aesKey =
await this.generateAesKey();



const nonce =
crypto.getRandomValues(
new Uint8Array(12)
);



const encrypted =
await crypto.subtle.encrypt(

{
name:'AES-GCM',
iv:nonce
},

aesKey,

this.encoder.encode(message)

);



// AES-GCM ajoute le tag à la fin
const encryptedBytes =
new Uint8Array(encrypted);


const tag =
encryptedBytes.slice(
encryptedBytes.length-16
);



const content =
encryptedBytes.slice(
0,
encryptedBytes.length-16
);





const rawAes =
await crypto.subtle.exportKey(
'raw',
aesKey
);




const encryptedKey =
await crypto.subtle.encrypt(

{
name:'RSA-OAEP'
},

rsaPublic,

rawAes

);




return {


encrypted_content:
this.arrayToBase64(content),



encrypted_key:
this.arrayToBase64(
new Uint8Array(encryptedKey)
),



encryption_algorithm:
'AES-256-GCM',



encrypted_content_nonce:
this.arrayToBase64(nonce),



encrypted_content_tag:
this.arrayToBase64(tag),



key_encryption_algorithm:
'RSA-OAEP-SHA256'


};



}







private base64ToArrayBuffer(base64:string):ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

private arrayToBase64(
data:Uint8Array
):string{


let binary='';


data.forEach(
b=>binary+=String.fromCharCode(b)
);


return btoa(binary);

}


}