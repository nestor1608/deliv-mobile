const { setupDriverUser, cleanupUser } = require('./utils/testData');

const uniqueSuffix = Date.now();
let driver;

beforeAll(async () => {
  driver = await setupDriverUser(uniqueSuffix);
});

afterAll(async () => {
  if (driver) {
    await cleanupUser(driver.accessToken, driver.username);
  }
});

beforeEach(async () => {
  await device.reloadReactNative();
});

describe('Mobility E2E Flow', () => {
  it('should login, go online, accept trip, start trip, and complete', async () => {
    await expect(element(by.id('driver-home-screen'))).toBeVisible();
    await element(by.id('go-online-toggle')).tap();
    await expect(element(by.id('online-status'))).toBeVisible();
    await element(by.id('available-trips-button')).tap();
    await expect(element(by.id('available-trips-list'))).toBeVisible();
    await element(by.id('accept-trip-button-0')).tap();
    await expect(element(by.id('active-trip-screen'))).toBeVisible();
    await element(by.id('start-trip-button')).tap();
    await expect(element(by.id('trip-in-progress'))).toBeVisible();
    await element(by.id('complete-trip-button')).tap();
    await expect(element(by.id('trip-complete'))).toBeVisible();
  });
});
