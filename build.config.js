/* global module process require */
const cliargs = require("yargs").argv,
    builddir = cliargs.builddir || "./build",
    pkg = require("./package.json"),
    env = {
      NODE_ENV: cliargs.node_env || process.env.NODE_ENV || "development",
      BRANDING: cliargs.branding || process.env.BRANDING || "default",
      API_SERVER: cliargs.server || process.env.API_SERVER || "http://localhost",
      PWA: cliargs.pwa === "true" || process.env.PWA === "true",
      APP_VERSION: pkg.version
    };

module.exports = {
  src_dir: "./src/www",
  views_dir: "views",
  build_dir: builddir,
  test_output_dir: `${builddir}/test-results`,

  assets: [
    "manifest.json",
    "*.{html, css, png, jpg}",
    "css/**/*",
    "font/**/*",
    "images/**/*",
    "views/**/*",
    "!views/**/*.js",
    "!views/**/*.less",
    "branding/**/*",
    "!branding/**/*.less",
    "!less"
  ],

  libs: [
    // add libraries here that you want to 'require'
    {name: "@lib/activables", path: "lib/activables"},
    {name: "@lib/clazz", path: "lib/clazz"},
    {name: "@lib/touch", path: "lib/touch"},
    {name: "@lib/api-client", path: "lib/api-client"},
    // {name: "@lib/router", path: "lib/router"},

    // Components
    {name: "@components/actionbar", path: "components/actionbar"},
    {name: "@components/form", path: "components/form"},
    {name: "@components/list", path: "components/list"},
    {name: "@components/overlay", path: "components/overlay"},
    {name: "@components/tabs", path: "components/tabs"},
    {name: "@components/portal", path: "components/portal"},
    {name: "@components/touchable", path: "components/touchable"},
    {name: "@components/notification", path: "components/notification"},
    {name: "@components/loading-indicator", path: "components/loading-indicator"},

    // Services
    {name: "@app/config", path: "config"},
    {name: "@services/storage", path: "services/storage"}
  ],

  serviceworkers: [
    "sw.js",
    "sw-config.js"
  ],

  env: env,

  browserify: {
    // prelude: null,
    debug: true,
    extensions: [".js", ".json", "!**/__tests__/*.js"],
    transform: [
      ["envify", {
        global: true,
        _: "purge",
        ...env
      }],
      "babelify",
      "browserify-shim"
    ],
    sourceMaps: true,
    cache: {},
    packageCache: {},
    plugin: [/* watchify */]
  }
};
