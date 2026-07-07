import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'perros-de-la-calle',
  slug: 'perros-de-la-calle',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'perrosdelacalle',
  userInterfaceStyle: 'automatic',
  ios: {
    icon: './assets/expo.icon',
    config: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Usamos tu ubicación para mostrar avisos cercanos y ubicar el aviso que publicás.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Usamos tu galería para elegir la foto del perro.',
        cameraPermission: 'Usamos la cámara para sacarle una foto al perro.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: '57c2f0c3-556a-42db-9264-22d89dc20fe3',
    },
  },
});
