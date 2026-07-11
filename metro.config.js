const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
// Add .ttf to the asset extensions so Metro can bundle font files
config.resolver.assetExts = [...config.resolver.assetExts, 'ttf'];
module.exports = config;
