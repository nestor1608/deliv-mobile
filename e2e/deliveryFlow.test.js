const { setupDeliveryUser, cleanupUser } = require('./utils/testData');

const uniqueSuffix = Date.now();
let delivery;

beforeAll(async () => {
  delivery = await setupDeliveryUser(uniqueSuffix);
});

afterAll(async () => {
  if (delivery) {
    await cleanupUser(delivery.accessToken, delivery.username);
  }
});

beforeEach(async () => {
  await device.reloadReactNative();
});

describe('Delivery E2E Flow', () => {
  it('should login, toggle available, accept order, update location, and mark delivered', async () => {
    await expect(element(by.id('delivery-home-screen'))).toBeVisible();
    await element(by.id('availability-toggle')).tap();
    await expect(element(by.id('availability-on'))).toBeVisible();
    await element(by.id('available-orders-button')).tap();
    await expect(element(by.id('available-orders-list'))).toBeVisible();
    await element(by.id('accept-order-button-0')).tap();
    await expect(element(by.id('active-delivery-screen'))).toBeVisible();
    await element(by.id('update-location-button')).tap();
    await element(by.id('mark-delivered-button')).tap();
    await expect(element(by.id('delivery-complete'))).toBeVisible();
  });
});
