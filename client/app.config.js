import 'dotenv/config';

export default {
  "expo": {
    "name": "Hide and Seek",
    "slug": "hide-and-seek",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "This app uses your location to provide game functionality."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": ["ACCESS_FINE_LOCATION"]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
