/* global process */
module.exports = {
  appnamespace: "starterapp",
  apiServerUrl: "",
  apiBasePath: "/api",
  // baseDir: "app",
  appVersion: process.env.APP_VERSION,

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
};
