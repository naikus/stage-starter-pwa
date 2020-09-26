/* global require process */
// All new customer configs MUST be imported first
require("./branding/default/config");
require("./branding/night/config");

const brandConfig = require(`./branding/${process.env.BRANDING || "default"}/config`);


module.exports = Object.assign({}, {
  appName: "Stage Starter",
  appNamespace: "starterapp",
  appVersion: process.env.APP_VERSION,

  apiServerUrl: "",
  apiServerPort: 7001,
  apiBasePath: "/api",
  branding: process.env.BRANDING,

  views: {
    "/main": {
      view: "main",
      template: "views/main/view.js"
    },
    "/settings": {
      view: "settings",
      template: "views/settings/view.js"
    },
    "/about": {
      view: "about",
      template: "views/about/view.js"
    }
  }
}, brandConfig);
