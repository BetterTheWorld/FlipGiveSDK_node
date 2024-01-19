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
