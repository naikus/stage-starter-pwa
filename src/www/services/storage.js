const store2 = require("store2"),
    config = require("@app/config");

module.exports = store2.namespace(config.appNamespace);
