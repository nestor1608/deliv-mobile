const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000/api';

async function registerUser(role, uniqueSuffix) {
  const payload = {
    username: `e2e_${role}_${uniqueSuffix}`,
    email: `e2e_${role}_${uniqueSuffix}@test.com`,
    password: 'TestPass123!',
    password_confirm: 'TestPass123!',
    first_name: `E2E${role.charAt(0).toUpperCase() + role.slice(1)}`,
    last_name: 'Test',
    phone_number: `+5493644${String(uniqueSuffix).padStart(6, '0')}`,
    role: role,
  };

  const response = await axios.post(`${API_BASE_URL}/auth/register/`, payload);
  return response.data;
}

async function loginUser(username, password) {
  let user_type = 'customer';
  if (username.includes('_vendor_')) user_type = 'vendor';
  else if (username.includes('_delivery_') || username.includes('_driver_')) user_type = 'delivery';

  const response = await axios.post(`${API_BASE_URL}/auth/token/`, {
    username_or_email: username,
    password: password,
    user_type: user_type,
  });
  return response.data;
}

async function createVendorProfile(token, businessName) {
  const response = await axios.post(
    `${API_BASE_URL}/vendors/vendors/`,
    {
      business_name: businessName || 'E2E Test Vendor',
      category: 1,
      business_license: `LIC-E2E-${Date.now()}`,
      tax_id: `30-${String(Date.now()).slice(-8)}-9`,
      address: 'Calle E2E 123',
      latitude: -34.603,
      longitude: -58.381,
      description: 'E2E test vendor',
      delivery_fee: 5.00,
      minimum_order: 10.00,
      delivery_time: 30,
      delivery_radius: 10,
      opening_time: '09:00',
      closing_time: '22:00',
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

async function createDeliveryProfile(token, licenseNumber) {
  const response = await axios.post(
    `${API_BASE_URL}/delivery/delivery-persons/`,
    {
      license_number: licenseNumber || `LIC-${Date.now()}`,
      vehicle_type: 'Moto',
      vehicle_plate: `E2E${String(Date.now()).slice(-4)}`,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

async function createDriverProfile(token) {
  const response = await axios.post(
    `${API_BASE_URL}/mobility/drivers/`,
    {
      license_number: `DRV-E2E-${Date.now()}`,
      vehicle_type: 'car',
      vehicle_brand: 'Toyota',
      vehicle_model: 'Corolla',
      vehicle_year: 2022,
      vehicle_plate: `DRV${String(Date.now()).slice(-4)}`,
      vehicle_color: 'Blanco',
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

async function setupCustomerUser(uniqueSuffix) {
  const regData = await registerUser('customer', uniqueSuffix);
  const loginData = await loginUser(`e2e_customer_${uniqueSuffix}`, 'TestPass123!');
  return {
    username: `e2e_customer_${uniqueSuffix}`,
    password: 'TestPass123!',
    accessToken: loginData.access,
    refreshToken: loginData.refresh,
    userData: regData.user,
  };
}

async function setupVendorUser(uniqueSuffix) {
  const regData = await registerUser('vendor', uniqueSuffix);
  const loginData = await loginUser(`e2e_vendor_${uniqueSuffix}`, 'TestPass123!');
  const vendor = await createVendorProfile(loginData.access, `Vendor E2E ${uniqueSuffix}`);
  return {
    username: `e2e_vendor_${uniqueSuffix}`,
    password: 'TestPass123!',
    accessToken: loginData.access,
    refreshToken: loginData.refresh,
    userData: regData.user,
    vendorData: vendor,
  };
}

async function setupDeliveryUser(uniqueSuffix) {
  const regData = await registerUser('delivery', uniqueSuffix);
  const loginData = await loginUser(`e2e_delivery_${uniqueSuffix}`, 'TestPass123!');
  const delivery = await createDeliveryProfile(loginData.access);
  return {
    username: `e2e_delivery_${uniqueSuffix}`,
    password: 'TestPass123!',
    accessToken: loginData.access,
    refreshToken: loginData.refresh,
    userData: regData.user,
    deliveryData: delivery,
  };
}

async function setupDriverUser(uniqueSuffix) {
  const regData = await registerUser('delivery', uniqueSuffix);
  const loginData = await loginUser(`e2e_driver_${uniqueSuffix}`, 'TestPass123!');
  const driver = await createDriverProfile(loginData.access);
  return {
    username: `e2e_driver_${uniqueSuffix}`,
    password: 'TestPass123!',
    accessToken: loginData.access,
    refreshToken: loginData.refresh,
    userData: regData.user,
    driverData: driver,
  };
}

async function cleanupUser(token, username) {
  try {
    await axios.delete(`${API_BASE_URL}/auth/profile/`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { username },
    });
  } catch (e) {
    // Best-effort cleanup
  }
}

module.exports = {
  setupCustomerUser,
  setupVendorUser,
  setupDeliveryUser,
  setupDriverUser,
  cleanupUser,
  registerUser,
  loginUser,
};
