const { getDefaultConfig } = require("expo/metro-config");
const exclusionList = require("metro-config/src/defaults/exclusionList");

const config = getDefaultConfig(__dirname);

config.resolver.blockList = exclusionList([
  /ios\/Pods\/.*/,
  /\.git\/.*/,
  /node_modules\/\.cache\/.*/,
]);

module.exports = config;
