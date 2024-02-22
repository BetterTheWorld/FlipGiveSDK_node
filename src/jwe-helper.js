import { Buffer } from 'node:buffer';
import * as jose from 'jose';

/**
 * @typedef {import('./index.js').Payload} Payload
 */

/**
 * @param {string} secret
 */
const JweHelper = async (secret) => {
  const key = await jose.importJWK({
    kty: 'oct',
    k: Buffer.from(secret).toString('base64')
  });

  /**
   * @param {Payload} payload
   */
  const encrypt = async (payload) => {
    const jwe = new jose.CompactEncrypt(
      new TextEncoder().encode(JSON.stringify(payload))
    );

    return jwe.setProtectedHeader({ alg: 'dir', enc: 'A128GCM' })
      .setInitializationVector(new Uint8Array([0xA6, 0x4D, 0x0F, 0x12, 0x02, 0xBC, 0x14, 0xEA, 0x2E, 0xCC, 0x91, 0x8B]))
      .encrypt(key);
  };

  /**
   * @param {string} token
   * @returns {Promise<Payload>}
   */
  const decrypt = async (token) => {
    const { plaintext } = await jose.compactDecrypt(token, key);

    return JSON.parse(new TextDecoder().decode(plaintext));
  };

  return {
    decrypt,
    encrypt
  };
};

export default JweHelper;
