// app.config.js
const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

module.exports = {
  expo: {
    name: 'deliv_project',
    slug: 'deliv',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    extra: {
      eas: {
        projectId: 'e6568834-4db0-4483-9d6b-37d1279ef112',
      },
      devApiUrl: apiUrl,
      prodApiUrl: 'https://api.deliv.com/api',
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      permissions: [
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_BACKGROUND_LOCATION',
      ],
      package: 'com.nestor_admin.deliv_project',
    },
    scheme: 'deliv',
    web: {
      favicon: './assets/favicon.png',
    },
    owner: 'nestor_admin',
    plugins: [
      [
        'expo-dev-client',
        {
          launchMode: 'most-recent',
          addGeneratedScheme: true,
          android: {
            defaultLaunchURL: 'http://localhost:8081',
          },
        },
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: 'Allow $(PRODUCT_NAME) to use your location.',
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true,
        },
      ],
      'expo-secure-store',
    ],
  },
};
