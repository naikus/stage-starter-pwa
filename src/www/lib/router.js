/* global URL */
const {pathToRegexp} = require("path-to-regexp"),
    isPromise = type => type && (typeof type.then) === "function",
    identity = arg => arg,
    EventEmitterProto = {
      on(event, handler) {
        const handlers = this.handlers[event] || (this.handlers[event] = []), h = {event, handler};
        handlers.push(h);
        return {
          dispose() {
            const index = handlers.indexOf(h);
            if(index !== -1) {
              handlers.splice(index, 1);
            }
          }
        };
      },
      once(event, handler) {
        let subs;
        subs = this.on(event, (...args) => {
          subs.dispose();
          handler(event, ...args);
        });
      },
      emit(event, ...args) {
        let handlers = this.handlers[event] || [];
        handlers.forEach(h => h.handler(event, ...args));
      }
    },

    createEventEmitter = () => {
      return Object.create(EventEmitterProto, {
        handlers: {
          value: {}
        }
      });
    },

    createHistory = options => {
      const noop = () => {};
      let linkClicked = null,
          listener = noop,
          // running = true,
          stack = [],
          ignoreHashChange = false;

      const hashListener = event => {
            if(ignoreHashChange) {
              console.debug("ignoring hash change", event);
              ignoreHashChange = false;
              return;
            }
            const hash = event ? new URL(event.newURL).hash : window.location.hash;
            // Only handle hash changes that start with #/
            if(!hash || hash.indexOf("#/") !== 0) {
              return;
            }
            const route = hash.substring(1);
            if(linkClicked) {
              linkClicked = null;
              stack.push(hash);
              listener({route}, "PUSH");
            }else {
              // Back forward buttons were used
              const index = stack.lastIndexOf(hash);
              if(index !== -1) {
                stack.splice(index + 1, stack.length - index);
                listener({route}, "POP");
              }else {
                stack.push(hash);
                listener({route}, "PUSH");
              }
            }
            // console.log(stack);
          },
          clickListener = event => {
            // console.log(event);
            const {target: {href}} = event, current = stack[stack.length - 1];
            if(href !== current) {
              linkClicked = href;
            }
          };

      return {
        getSize() {
          return stack.length;
        },
        listen(listnr) {
          listener = listnr;
          document.addEventListener("click", clickListener, true);
          window.addEventListener("hashchange", hashListener);
          return () => {
            listener = noop;
            window.removeEventListener("click", clickListener, true);
            window.removeEventListener("hashchange", hashListener);
          };
        },
        push(path) {
          const currentPath = window.location.hash.substring(1);
          linkClicked = "__PUSH";
          if(currentPath === path) {
            hashListener();
            return;
          }
          window.location.hash = path;
        },
        replace(path) {
          linkClicked = "__REPLACE";
          window.location.replace(`#${path}`);
        },
        /* Set the path without calling the hash listener */
        set(path) {
          // console.log("Setting path", path);
          ignoreHashChange = true;
          window.location.hash = path;
        },
        pop(toPath) {
          linkClicked = null;
          if(!stack.length) {
            return;
          }
          const path = toPath || stack[stack.length - 2];
          // Correctly maintain backstack. This is not possible if toPath is provided.
          if(toPath) {
            window.location.hash = path;
          }else {
            window.history.go(-1);
          }
        }
      };
    },

    routerDefaults = {
      defaultRoute: "/",
      errorRoute: "/~error"
    },

    RouterProto = {
      on(evt, handler) {
        return this.emitter.on(evt, handler);
      },
      matches(path) {
        return this.routes.some(route => route.pattern.test(path));
      },
      match(path) {
        let params, matchedRoute;
        this.routes.some(route => {
          const res = route.pattern.exec(path);
          if(res) {
            matchedRoute = route;
            params = {};
            route.keys.forEach((key, i) => {
              params[key.name] = res[i + 1];
            });
            return true;
          }
          return false;
        });
        if(matchedRoute) {
          return {
            ...matchedRoute,
            runtimePath: path,
            params: params
          };
        }
        return null;
      },
      resolve(path, action, context = {}) {
        // console.log("Resolving ", path);
        const {current = {}} = this, routeInfo = this.match(path),
            origRoute = context.route || {
              path: current.path,
              params: current.params,
              runtimePath: current.runtimePath
            };

        // Check if we have a current route and it's same as the one we are trying to resolve
        if(this.current) {
          // console.log("Current route", this.current);
          const {runtimePath} = this.current;
          if(runtimePath === path) {
            return Promise.resolve();
          }
        }

        if(routeInfo) {
          // console.log("Found routeInfo", path, routeInfo);
          const route = {
                ...routeInfo,
                action,
                from: origRoute,
                path: routeInfo.path,
                runtimePath: routeInfo.runtimePath,
                params: routeInfo.params
              },
              ctx = {
                ...context,
                route
              },
              controller = routeInfo.controller;
          // console.log("Route", route);
          this.emitter.emit("before-route", path);
          let ret = controller ? controller(ctx) : identity(ctx);
          if(!isPromise(ret)) {
            ret = Promise.resolve(ret);
          }
          return ret.then((retVal = {}) => {
            if(retVal.forward) {
              console.debug(`Forwarding from ${routeInfo.path} to ${retVal.forward}`);
              return this.resolve(retVal.forward, action, {
                route: {
                  forwarded: true,
                  path: routeInfo.path,
                  params: routeInfo.params
                }
              }).then(fRoute => {
                // set the browser hash to correct value for forwarded route
                // without invoking the hashchange listener
                this.history.set(retVal.forward);
                return fRoute;
              });
            }else {
              route.state = this.state;
              this.current = route;
              // console.log("Returning", retVal);
              this.emitter.emit("route", {
                route,
                // state: this.state,
                ...retVal
              });
              this.clearState();
              return retVal;
            }
          });
          /*
          .then(
            retVal => this.emitter.emit("route", {
              route,
              ...retVal
            }),
            rErr => this.emitter.emit("route-error", {
              route,
              ...rErr
            })
          );
          // return ret;
          */
        }
        return Promise.reject({
          message: `Route not found ${path}`,
          path
        });
      },
      setState(state) {
        this.state = state;
      },
      clearState() {
        this.state = {};
      },
      route(path, state = {}, replace = false) {
        // console.log(this.history.getSize());
        this.setState(state);
        if(replace) {
          this.history.replace(path);
        }else {
          this.history.push(path, state);
        }
      },
      back(toRoute, state = {}) {
        this.setState(state);
        this.history.pop(toRoute);
      },
      set(path, state) {
        if(state) {
          this.setState(state);
        }
        this.history.set(path);
      },
      getBrowserRoute() {
        const hash = window.location.hash;
        if(hash) {
          return hash.substring(1);
        }
        return null;
      },
      getCurrentRoute() {
        return this.current;
      },
      start() {
        if(!this.history) {
          const {options} = this, history = this.history = createHistory(options.history),
              {defaultRoute = "/", errorRoute = "/~error"} = options;

          // history.block(options.block);
          this.stopHistoryListener = history.listen((location, action) => {
            // const unblock = history.block(options.block);
            const path = location.route || errorRoute,
                ret = this.resolve(path, action);
            ret.catch(rErr => {
              // console.log(rErr);
              this.emitter.emit("route-error", rErr);
            });
          });
        }
      },
      stop() {
        if(this.history) {
          this.stopHistoryListener();
          this.history = null;
          this.stopHistoryListener = null;
        }
      },
      addRoutes(routes = []) {
        routes.forEach(r => {
          this.addRoute(r);
        });
      },
      addRoute(r) {
        this.routes.push(makeRoute(r));
        console.log(this.routes);
      }
    },

    makeRoute = route => {
      const keys = [], pattern = pathToRegexp(route.path, keys);
      return {
        ...route,
        path: route.path,
        controller: route.controller,
        pattern,
        keys
      };
    };

/**
 * @typedef {Object} Route
 * @property {string} path
 * @property {function} controller
 */

/**
 * Create a new Router instance
 * @param {Array<Route>} routes An array of routes
 * @param {Object} options Router options
 * @return {Router} A newly created Router instance
 */
function createRouter(routes = [], options = {}) {
  return Object.create(RouterProto, {
    state: {
      value: {},
      writable: true,
      readable: true
    },
    routes: {
      value: routes.map(makeRoute)
    },
    options: {
      value: Object.assign({}, routerDefaults, options)
    },
    emitter: {
      value: createEventEmitter()
    }
  });
}

module.exports = createRouter;
