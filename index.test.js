import { expect, test } from 'vitest';
import { faker } from '@faker-js/faker';
import ShopCloud from './index.js';

const getCampaignData = () => ({
  id: Math.floor(Math.random() * 1000).toString(),
  name: faker.person.fullName(),
  category: 'Running',
  country: 'CAN',
  admin_data: getPersonData()
});

const getGroupData = () => ({
  name: faker.word.noun()
});

const getOrganizationData = () => ({
  id: Math.floor(Math.random() * 1000000).toString(),
  name: faker.word.noun(),
  admin_data: getPersonData()
});

const getPersonData = () => ({
  id: Math.floor(Math.random() * 1000000).toString(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  country: 'CAN',
});

const CLOUD_SHOP_ID = 'A2DE537C';
const SECRET = 'sk_61c394cf3346077b';
const shopCloud = await ShopCloud(CLOUD_SHOP_ID, SECRET);

test('token is generated and cloud shop ID is appended', async () => {
  const token = await shopCloud.identifiedToken({
    user_data: getPersonData(),
    campaign_data: getCampaignData()
  });

  expect(token).toContain(CLOUD_SHOP_ID);
});

test('exception is thrown if token does not match cloud store id', async () => {
  const token = (await shopCloud.identifiedToken({
    user_data: getPersonData(),
    campaign_data: getCampaignData()
  })).replace(CLOUD_SHOP_ID, 'foobar');

  expect(() => shopCloud.readToken(token)).toThrowError();
});

test('exception is thrown for invalid payload', () => {
  expect(() => shopCloud.identifiedToken({})).rejects.toThrowError();
});

test('errors in user data are caught', async () => {
  await shopCloud
     // @ts-ignore
    .identifiedToken({ user_data: {} })
    .catch(() => {
      const errors = shopCloud.getErrors();

      expect(Object.values(errors)).toHaveLength(4);
      expect(errors[0].user_data).toEqual('id missing.');
      expect(errors[1].user_data).toEqual('name missing.');
      expect(errors[2].user_data).toEqual('email missing.');
      expect(errors[3].user_data).toEqual('country must be one of \'CAN, USA\'.');
    });
});

test('errors in campaign data are caught', async () => {
  await shopCloud
     // @ts-ignore
    .identifiedToken({ campaign_data: {} })
    .catch(() => {
      const errors = shopCloud.getErrors();

      expect(Object.values(errors)).toHaveLength(8);
      expect(errors[0].campaign_data).toEqual('id missing.');
      expect(errors[1].campaign_data).toEqual('name missing.');
      expect(errors[2].campaign_data).toEqual('category missing.');
      expect(errors[3].campaign_data).toEqual('country must be one of \'CAN, USA\'.');
      expect(errors[4].campaign_admin_data).toEqual('id missing.');
      expect(errors[5].campaign_admin_data).toEqual('name missing.');
      expect(errors[6].campaign_admin_data).toEqual('email missing.');
      expect(errors[7].campaign_admin_data).toEqual('country must be one of \'CAN, USA\'.');
    });
});

test('token is decoded successfully', async () => {
  const initialPayload = {
    user_data: getPersonData(),
    campaign_data: getCampaignData()
  };
  const token = await shopCloud.identifiedToken(initialPayload);

  const decodedPayload = await shopCloud.readToken(token);

  expect(decodedPayload).toEqual(initialPayload);
});

test('partner token has partner token type', async () => {
  const token = await shopCloud.getPartnerToken();

  const payload = await shopCloud.readToken(token);

  expect(payload.type).toEqual('partner');
});

test('token with group data is successfully decoded', async () => {
  const initialPayload = {
    user_data: getPersonData(),
    campaign_data: getCampaignData(),
    group_data: getGroupData()
  };

  const token = await shopCloud.identifiedToken(initialPayload);

  const decodedPayload = await shopCloud.readToken(token);

  expect(decodedPayload).toEqual(initialPayload);
});
