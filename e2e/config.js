/**
 * E2E Configuration
 *
 * E2E_API_URL: URL base de la API para el test runner (setup/teardown via Node.js).
 *   Default: http://localhost:8000/api (funciona cuando el test runner corre en WSL)
 *
 * EXPO_PUBLIC_API_URL: URL base para la app APK (se inyecta via app.config.js).
 *   Default: http://localhost:8000/api
 */
const E2E_API_URL = process.env.E2E_API_URL || 'http://localhost:8000/api';

module.exports = { E2E_API_URL };
