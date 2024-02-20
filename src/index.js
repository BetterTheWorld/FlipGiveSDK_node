import JweHelper from './jwe-helper';

/**
 * @typedef UserData
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {string} country
 * @property {string} [city]
 * @property {string} [state]
 * @property {string} [postal_code]
 * @property {number} [latitude]
 * @property {number} [longitude]
 * @property {string} [image_url]
 */

/**
 * @typedef CampaignData
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {string} country
 * @property {UserData} admin_data
 * @property {string} [city]
 * @property {string} [state]
 * @property {string} [postal_code]
 * @property {number} [latitude]
 * @property {number} [longitude]
 * @property {string} [image_url]
 */

/**
 * @typedef GroupData
 * @property {string} name
 * @property {string} [player_number]
 */

/**
 * @typedef OrganizationData
 * @property {string} id
 * @property {string} name
 * @property {UserData} admin_data
 */

/**
 * @typedef UtmData
 * @property {string} utm_medium
 * @property {string} utm_campaign
 * @property {string} utm_term
 * @property {string} utm_content
 * @property {string} utm_channel
 */

/**
 * @typedef Payload
 * @property {CampaignData} [campaign_data]
 * @property {GroupData} [group_data]
 * @property {OrganizationData} [organization_data]
 * @property {UserData} [user_data]
 * @property {UtmData} [utm_data]
 * @property {string} [type]
 * @property {number} [expires]
 */

const COUNTRIES = ['CAN', 'USA'];
const PARTNER_TOKEN_TTL = 3600; // seconds

/**
 * @param {string} cloudShopId
 * @param {string} secret
 */
const Rewards = async (cloudShopId, secret) => {
  secret = secret.replace(/^sk_/, '');

  /**
   * @type Array<Object.<string, string>>
   */
  let errors = [];
  const jweHelper = await JweHelper(secret);

  const getErrors = () => errors;

  /**
   * @param {string} token
   * @returns {Promise<Payload>}
   */
  const readToken = (token) => {
    const [encryptedString, shopId] = token.split('@');

    if (shopId != cloudShopId) {
      throw new Error('Invalid token');
    }

    return jweHelper.decrypt(encryptedString);
  };

  /**
   * @param {Payload} payload
   */
  const identifiedToken = async (payload) => {
    if (!validIdentified(payload)) {
      throw new Error('Invalid payload');
    }

    const token = await jweHelper.encrypt(payload);

    return [token, cloudShopId].join('@');
  };

  const getPartnerToken = async () => {
    const expires = new Date();
    expires.setSeconds(expires.getSeconds() + PARTNER_TOKEN_TTL);

    const payload = {
      type: 'partner',
      expires: expires.getMilliseconds()
    };

    const token = await jweHelper.encrypt(payload);

    return [token, cloudShopId].join('@');
  };

  /**
   * @param {Payload} payload
   */
  const validIdentified = payload => {
    errors = [];

    validatePayload(payload);

    if (payload.user_data) {
      validatePersonData('user_data', payload.user_data);
    }

    if (payload.campaign_data) {
      validateCampaignData('campaign_data', payload.campaign_data);
    }

    if (payload.group_data) {
      validateGroupnData(payload.group_data);
    }

    if (payload.organization_data) {
      validateOrganizationData('organization_data', payload.organization_data);
    }

    return Object.keys(errors).length === 0;
  };

  /**
   * @param {Payload} payload
   */
  const validatePayload = payload => {
    validateFormat(payload);
    validateMinimumData(payload);
  };

  /**
   * @param {Payload} payload
   */
  const validateFormat = payload => {
    if (!(payload instanceof Object)) {
      errors.push({ payload: 'Payload must be an object' });
    }
  };

  /**
   * @param {Payload} payload
   */
  const validateMinimumData = payload => {
    if (!payload || (!payload.user_data && !payload.campaign_data)) {
      errors.push({ payload: 'At least must contain user_data or campaign_data.' });
    }
  };

  /**
   * @param {string} key
   * @param {UserData} data
   */
  const validatePersonData = (key, data) => {
    validatePresence(key, data, 'id');
    validatePresence(key, data, 'name');
    validatePresence(key, data, 'email');
    validateInclusion(key, COUNTRIES, data, 'country');
  };

  /**
   * @param {string} key
   * @param {CampaignData} data
   */
  const validateCampaignData = (key, data) => {
    validatePresence(key, data, 'id');
    validatePresence(key, data, 'name');
    validatePresence(key, data, 'category');
    validateInclusion(key, COUNTRIES, data, 'country');
    validatePersonData('campaign_admin_data', data.admin_data ?? {});
  };

  /**
   * @param {GroupData} data
   */
  const validateGroupnData = data => {
    if (!data.name) {
      errors.push({ group_data: 'name missing.' });
    }
  };

  /**
   * @param {string} key
   * @param {OrganizationData} data
   */
  const validateOrganizationData = (key, data) => {
    validatePresence(key, data, 'id');
    validatePresence(key, data, 'name');
    validatePersonData('organization_admin_data', data.admin_data ?? {});
  };

  /**
   * @param {string} dataKey
   * @param {Object.<string, any>} data
   * @param {string} key
   */
  const validatePresence = (dataKey, data, key) => {
    if (!data[key]) {
      errors.push({ [dataKey]: `${key} missing.` });
    }
  };

  /**
   * @param {string} dataKey
   * @param {Object.<string, any>} group
   * @param {Object.<string, any>} data
   * @param {string} key
   */
  const validateInclusion = (dataKey, group, data, key) => {
    if (!data[key]) {
      errors.push({ [dataKey]: `${key} must be one of '${group.join(', ')}'.` });
    }
  };

  return {
    getPartnerToken,
    identifiedToken,
    readToken,
    getErrors,
    validIdentified
  }
};

export default Rewards;
