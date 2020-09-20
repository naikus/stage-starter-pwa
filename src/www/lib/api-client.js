/* global console, Promise fetch Request */
/* jshint eqnull:true */
require("whatwg-fetch");

const ObjectToString = Object.prototype.toString,
    /**
     * Determines if a given object is an array
     * @param {Object} that The object to check
     * @return {boolean} true if 'that' is an array
     */
    isArray = that => {
      return ObjectToString.call(that) === "[object Array]";
    },
    /**
     * Gets the type of a specified object 'that'
     * @param {Any} that The object to check
     * @return {String} The type of 'that'
     */
    getTypeOf = that => {
      return ObjectToString.call(that).slice(8, -1);
    },
    /**
     * Collects the key val into collector. Checks if the value is an array or and object
     * and recursively calls collectParams for the object and array. The collected params
     * are used in a URL's querystring.
     * @param {String} key or the param name
     * @param {Any} val The value of the param
     * @param {Array} collector The array into which to push the collected params
     */
    collectParams = (key, val, collector) => {
      if(isArray(val)) {
        encodeArray(key, val, collector);
      }else if(getTypeOf(val) === "Object") {
        encodeObject(key, val, collector);
      }else {
        let k = key ? encodeURIComponent(key) + "=" : "";
        collector.push(k + encodeURIComponent(val));
      }
    },
    /**
     * Encodes an object into params by drilling down object properties. The keys are encoded
     * with dot notation: e.g. Given an object:
     * {
     *   a: {
     *     c: "Hello",
     *     d: {
     *       e: "World"
     *     }
     *   }
     * }
     * The object is encoded as:
     * [a.c=Hello, a.d.e=World]
     * into the collector
     * @param {String} key The param name
     * @param {Object} objVal The object to encode
     * @param {Array} collector The collector array
     */
    encodeObject = (key, objVal, collector) => {
      Object.keys(objVal).forEach(k => {
        const v = objVal[k],
            newKey = key ? key + "." + k : k;
        collectParams(newKey, v, collector);
      });
    },
    /**
     * Encodes an array into a URL querystring friendly array. e.g Given a key 'name'
     * and value as ["A", "B", "C", "D"], is encoded as:
     * [name=A, name=B, name=C, name=D] into the collector
     * @param {String} key The name of the parameter
     * @param {Array} arrVals The array containing values
     * @param {Array} collector The collector array
     */
    encodeArray = (key, arrVals, collector) => {
      arrVals.forEach(v => {
        collectParams(key, v, collector);
      });
    },
    /**
     * Builds a parameter array with each component as key=value from the specified object
     * @param {Object} objParams The parameters as object
     * @return {Array} The array representation of query parameters that can be then
     *                 joined by join("&")
     */
    asQueryParameters = (objParams = {}) => {
      if(!objParams) {
        return "";
      }
      const collector = [];
      collectParams(null, objParams, collector);
      return collector.join("&");
    },


    /**
     * ApiClient prototype object used in create function
     */
    ApiClientProto = {
      /**
       * Requests (http) the given 'path' with specified opts.
       * @param {String} path The path to request to
       * @param {Object} opts The options object similar to http fetch API
       * @return {Promise} a Promise that resolves on successfull request.
       */
      call(path, opts) {
        const url = (opts.apiUrl || this.options.apiUrl) + path,
            xdr = url.indexOf("http://") === 0 || url.indexOf("https://") === 0,
            headers = Object.assign({}, this.options.headers, opts.headers || {}),
            options = Object.assign({}, this.options, {
              method: "GET",
              mode: xdr ? "cors" : "same-origin"
            }, opts);
        options.headers = headers;

        if("FormData" in window && opts.body instanceof window.FormData) {
          delete options.headers["Content-Type"];
          delete options.headers["content-type"];
        }
        const request = new Request(url, options), context = {path, options, request, response: null};

        let promise = Promise.resolve(context);
        promise.catch(err => {
          console.log(err);
          throw err;
        });
        this.interceptors.reduce((promise, interceptor) => {
          // here interceptors can modify request headers, etc.
          return promise.then(ctx => {
            const ret = interceptor(ctx) || ctx;
            return (typeof ret.then === "function") ? ret : Promise.resolve(ret);
          });
        }, promise);

        return promise.then(ctx => {
          ctx = ctx || context;
          return fetch(request)
              .then(response => {
                let resPromise = Promise.resolve(response);
                resPromise.catch(err => {
                  console.log(err);
                  throw err;
                });

                // const context = {path, options, request, response: resPromise};
                ctx.response = resPromise;
                this.interceptors.forEach(interceptor => {
                  const promise = interceptor(ctx);
                  // console.log("Interceptor returned", promise);
                  if(promise) {
                    ctx.response = promise;
                  }
                });
                return ctx.response;
              });
        });
      },

      setOption(name, value) {
        this.options[name] = value;
      },

      setHeader(name, value) {
        this.options.headers[name] = value;
      },

      /**
       * Adds a global interceptor to this API client. Every interceptor is called twice: before a
       * request is sent and after the response is received, before eventually the promise is handed
       * to the caller. This allows you to modify requests and responses. Send transparent requests
       * in case of failures, etc.
       * The interceptor function receives following object as options:
       * {
       *   path: The path to which the request is send or response was received
       *   options: The options passed to the fetch request
       *   request: The Request object of the fetch api
       *   response: The Response object (if available) of the fetch api
       * }
       * @param {Function} func The interceptor function
       */
      interceptor(func) {
        if(typeof func === "function") {
          // console.log("Adding interceptor", func);
          this.interceptors.push(func);
        }else {
          console.warn("[ApiClient] Interceptor expected function but found " + typeof(func));
        }
      }
    };

// Add convenience functions for get, put, post, delete http methods
["get", "post", "put", "delete"].forEach(function(m) {
  ApiClientProto[m] = function(path, opts) {
    const callOpts = opts || {};
    callOpts.method = m.toUpperCase();
    return this.call(path, callOpts);
  };
});

/**
 * A factory function to create and instance of ApiClient
 * @param {Object} opts The options for ApiClient. This can contain all the fetch api options.
 * In addition you can specify following options:
 * apiUrl The base URL for ApiClient. The path option is then appended to it to form the complete
 * URL
 * @return {ApiClient} and instance of ApiClient
 */
const createApiClient = opts => {
  return Object.create(ApiClientProto, {
    options: {
      value: Object.assign(
        {
          apiUrl: "",
          redirect: "follow"
        },
        {headers: {"Content-Type": "application/json"}},
        opts
      )
    },
    interceptors: {
      value: []
    }
  });
};

module.exports = {
  create: createApiClient,
  asQueryParameters,
  asJson(response) {
    if(response.status >= 200 && response.status < 400) {
      return response.json();
    }else {
      return Promise.reject(response);
    }
  }
};

