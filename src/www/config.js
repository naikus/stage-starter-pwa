/* global require process */
// All new customer configs MUST be imported first
require("./branding/default/config");
require("./branding/night/config");

const brandConfig = require(`./branding/${process.env.BRANDING || "default"}/config`);


module.exports = Object.assign({}, {
  appName: "Stage Starter",
  appNamespace: "starterapp",
  appVersion: process.env.APP_VERSION,

  apiServerUrl: process.env.API_SERVER || "",
  apiServerPort: 7001,
  apiBasePath: "/api",
  branding: process.env.BRANDING,
  pwa: process.env.PWA,

  views: {
    "/main": {
      view: "main",
      path: "views/main/index.js"
    },
    "/settings": {
      view: "settings",
      path: "views/settings/index.js"
    },
    "/about": {
      view: "about",
      path: "views/about/index.js",
      config: {
        actionbar: false,
        fullscreen: true
      }
    }
  }
}, brandConfig);
