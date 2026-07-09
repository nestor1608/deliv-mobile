const { setupCustomerUser, cleanupUser } = require('./utils/testData');

const uniqueSuffix = Date.now();
let customer;

beforeAll(async () => {
  customer = await setupCustomerUser(uniqueSuffix);
});

afterAll(async () => {
  if (customer) {
    await cleanupUser(customer.accessToken, customer.username);
  }
});

beforeEach(async () => {
  await device.reloadReactNative();
});

describe('Customer E2E Flow', () => {
  it('should register, browse vendors, add to cart, and checkout with cash', async () => {
    await expect(element(by.id('home-screen'))).toBeVisible();
    await element(by.id('browse-vendors-button')).tap();
    await expect(element(by.id('vendors-list'))).toBeVisible();
    await element(by.id('vendor-card-0')).tap();
    await expect(element(by.id('vendor-detail-screen'))).toBeVisible();
    await element(by.id('product-item-0')).tap();
    await element(by.id('add-to-cart-button')).tap();
    await element(by.id('cart-tab')).tap();
    await expect(element(by.id('cart-screen'))).toBeVisible();
    await expect(element(by.id('cart-item-0'))).toBeVisible();
    await element(by.id('checkout-button')).tap();
    await expect(element(by.id('checkout-screen'))).toBeVisible();
    await element(by.id('payment-method-cash')).tap();
    await element(by.id('place-order-button')).tap();
    await expect(element(by.id('order-confirmation'))).toBeVisible();
  });
});
