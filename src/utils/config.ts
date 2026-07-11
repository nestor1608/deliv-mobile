// src/utils/config.ts

function getApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
}

function getProjectId(): string {
  return process.env.EXPO_PUBLIC_PROJECT_ID || 'e6568834-4db0-4483-9d6b-37d1279ef112';
}

export { getApiBaseUrl, getProjectId };
