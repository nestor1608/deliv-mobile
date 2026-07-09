import Constants from 'expo-constants';

function getApiBaseUrl() {
  const extra = Constants.expoConfig?.extra;
  if (__DEV__) {
    return extra?.devApiUrl || 'http://localhost:8000/api';
  }
  return extra?.prodApiUrl || 'https://api.deliv.com/api';
}

function getProjectId() {
  return Constants.expoConfig?.extra?.eas?.projectId || 'e6568834-4db0-4483-9d6b-37d1279ef112';
}

export { getApiBaseUrl, getProjectId };
