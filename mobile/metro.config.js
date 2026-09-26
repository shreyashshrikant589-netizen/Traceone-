const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Allow Metro to resolve modules from the root maps/ directory
config.watchFolders = [path.resolve(monorepoRoot, 'maps')];

// Map the @maps alias so imports like '@maps/location/coordinates' resolve correctly
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@maps': path.resolve(monorepoRoot, 'maps'),
};

// Ensure modules in watchFolders (e.g., maps/) resolve third-party packages from mobile/node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

module.exports = withNativeWind(config, { input: './global.css' });
