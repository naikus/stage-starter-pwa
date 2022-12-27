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

  routes: [
    {
      path: "/",
      controller() {
        return {
          redirect: "/main"
        };
      }
    },
    {
      path: "/main",
      view: {
        id: "main",
        src: "views/main/index.js",
        config: {}
      }
    },
    {
      path: "/settings",
      view: {
        id: "settings",
        src: "views/settings/index.js"
      }
    },
    {
      path: "/about",
      view: {
        id: "about",
        src: "views/about/index.js",
        config: {
          actionbar: false,
          fullscreen: true
        }
      }
    }
  ]
}, brandConfig);
