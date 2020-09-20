/* global module require */
const config = require("./build.config");

module.exports = {
  name: "ui-tests",
  verbose: true,
  bail: false,
  roots: [config.src],

  // setupTestFrameworkScriptFile: "<rootDir>/setupTests",
  collectCoverage: true,
  coverageDirectory: config.testOutputDir + "ui-coverage/",
  reporters: [
    "default",
    ["jest-junit", {outputDirectory: config.test}]
  ],
  collectCoverageFrom: [
    "**/*.{js,jsx}",
    "!**/node_modules/**",
    "!**/vendor/**"
  ]
};
