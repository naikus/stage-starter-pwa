/* global document, setTimeout, clearTimeout */
(() => {
  if(typeof window.CustomEvent === "function") return;

  /**
   * Define a custom event
   * @param {String} type 
   * @param {Object} init 
   * @return {Event}
   */
  function CustomEvent(type, init = {}) {
    const {bubbles = false, cancellable = false, detail} = init,
        event = document.createEvent("Events");
    event.detail = detail;
    event.initEvent(type, bubbles, cancellable);
    return event;
  }
  CustomEvent.prototype = window.Event.prototype;
  window.CustomEvent = CustomEvent;
})();



/** Check for passive event listener support */
let supportsPassive = false, noop = () => {}, passiveOpts = {passive: true};
(() => {
  try {
    const opts = Object.defineProperty({}, "passive", {
      get() {
        supportsPassive = true;
        return true;
      }
    });
    window.addEventListener("testpassive", noop, opts);
    window.removeEventListener("testpassive", noop, opts);
  }catch(e) {
    // ignore
  }
})();



const Events = !("ontouchstart" in document.documentElement) ?
      {
        tap: "click",
        taphold: "mousedown",
        dbltap: "dblclick",
        touchstart: "mousedown",
        touchend: "mouseup",
        touchmove: "mousemove",
        touchcancel: "touchcancel",
        swipe: "swipe"
      } :
      {
        tap: "tap",
        taphold: "taphold",
        dbltap: "dbltap",
        touchstart: "touchstart",
        touchend: "touchend",
        touchmove: "touchmove",
        touchcancel: "touchcancel",
        swipe: "swipe"
      },
    formElementNames = ["input", "select", "checkbox", "radio", "textarea", "button", "a"],
    stopEvent = e => {
      let ne;
      if(e.data && (ne = e.data.nativeEvent)) {
        ne.stopPropagation();
        ne.preventDefault();
      }
      /*
      const target = te.target, nodeName = target.nodeName;
      if(nodeName) {
        nodeName = nodeName.toLowerCase();
      }
      if(te.touches && formElementNames.indexOf(nodeName) === -1) {
        te.stopPropagation();
        te.preventDefault();
      }
      */
    },
    // noop = () => {},
    createEvent = (type, params) => {
      return new window.CustomEvent(type, params);
    },
    on = (elem, type, listener) => {
      elem.addEventListener(type, listener, supportsPassive ? passiveOpts : false);
    },
    off = (elem, type, listener) => {
      elem.removeEventListener(type, listener, supportsPassive ? passiveOpts : false);
    },
    isDisabled = target => {
      const disabled = target.getAttribute("disabled");
      return disabled === "" || disabled === "true";
    },


    tap = (elem = document) => {
      const state = {},
          EventTypes = Events,
          clearState = (...args) => {
            if(args.length) {
              console.log("Clearing state because of event " + args[0].type);
            }
            state.id = state.x = state.y = state.moved = state.target = undefined;
          },
          hasMoved = (x1, y1, x2, y2) => {
            const dx = x1 - x2, dy = y1 - y2;
            return Math.abs(dx) > 15 || Math.abs(dy) > 15;
          },
          handler = te => {
            const type = te.type, touches = te.touches, cTouches = te.changedTouches,
                target = te.currentTarget;

            if(isDisabled(target)) {
              return;
            }
            let touch;

            switch(type) {
              case EventTypes.touchstart:
                if(touches.length !== 1) {
                  return;
                }
                touch = touches[0];
                state.id = touch.identifier;
                state.x = touch.pageX;
                state.y = touch.pageY;
                state.target = target;
                break;
              case EventTypes.touchmove:
                touch = cTouches[0];
                if(!state.moved && touch.identifier === state.id) {
                  state.moved = hasMoved(state.x, state.y, touch.pageX, touch.pageY);
                }
                break;
              case EventTypes.touchend:
                if(cTouches.length === 0 || state.moved) {
                  clearState();
                  return;
                }
                touch = cTouches[0];
                if(touch.identifier === state.id && !state.moved &&
                      // !hasMoved(state.x, state.y, touch.pageX, touch.pageY) &&
                      state.target === target) {
                  document.dispatchEvent(createEvent("_tapholdcancel"));
                  target.dispatchEvent(createEvent("tap", {
                    detail: {
                      nativeEvent: te
                    }
                  }));
                  clearState();
                }
                break;
              case EventTypes.touchcancel:
                clearState();
                break;
            }
          };

      return {
        // type: "tap",
        setup() {
          on(elem, EventTypes.touchstart, handler);
          on(elem, EventTypes.touchmove, handler);
          on(elem, EventTypes.touchend, handler);
          on(elem, EventTypes.touchcancel, handler);
          on(elem, "_tapcancel", clearState);
        },
        destroy() {
          off(elem, EventTypes.touchstart, handler);
          off(elem, EventTypes.touchmove, handler);
          off(elem, EventTypes.touchend, handler);
          off(elem, EventTypes.touchcancel, handler);
          off(elem, "_tapcancel", clearState);
        }
      };
    },

    dbltap = elem => {
      const state = {}, handler = te => {
            const now = Date.now(),
                elapsed = now - (state.last || now),
                target = te.currentTarget;
            if(elapsed > 0 && elapsed < 300 && state.target === target) {
              target.dispatchEvent(createEvent("dbltap", {
                detail: {
                  nativeEvent: te
                }
              }));
              state.last = state.target = null;
            }else {
              state.last = now;
              state.target = target;
            }
          },
          tapDefn = EventFactory.tap(elem);

      return {
        // type: "dbltap",
        setup() {
          tapDefn.setup();
          on(elem, "tap", handler);
        },
        destroy() {
          tapDefn.destroy();
          off(elem, "tap", handler);
        }
      };
    },

    taphold = (elem = document) => {
      let timer;
      const state = {}, EventTypes = Events,
          hasMoved = (x1, y1, x2, y2) => {
            const dx = x1 - x2, dy = y1 - y2;
            return Math.abs(dx) > 20 || Math.abs(dy) > 20;
          },
          clearState = () => {
            state.moved = state.x = state.y = undefined;
          },
          handler = te => {
            const {type, currentTarget, touches} = te;
            if(isDisabled(currentTarget)) {
              return;
            }
            switch (type) {
              case EventTypes.touchstart:
                if(touches.length !== 1) {
                  return;
                }
                state.x = te.pageX;
                state.y = te.pageY;
                timer = setTimeout(() => {
                  if(!state.moved) {
                    // Since iOS Safari dispatches a taphold if event handler has native alert
                    document.dispatchEvent(createEvent("_tapcancel"));
                    currentTarget.dispatchEvent(createEvent("taphold", {
                      detail: {
                        nativeEvent: te
                      }
                    }));
                  }
                }, 700);
                break;
              case EventTypes.touchmove:
                if(!state.moved) {
                  if(state.moved = hasMoved(state.x, state.y, te.pageX, te.pageY)) {
                    clearTimeout(timer);
                  }
                }
                break;
              case EventTypes.touchend:
              case EventTypes.touchcancel:
              default:
                clearTimeout(timer);
                clearState();
                break;
            }
          };

      return {
        // type: "taphold",
        setup() {
          on(elem, EventTypes.touchstart, handler);
          on(elem, EventTypes.touchmove, handler);
          on(elem, EventTypes.touchend, handler);
          on(elem, EventTypes.touchcancel, handler);
          on(elem, "_tapholdcancel", function() {
            clearTimeout(timer);
          });
        },
        destroy() {
          off(elem, EventTypes.touchstart, handler);
          off(elem, EventTypes.touchmove, handler);
          off(elem, EventTypes.touchend, handler);
          off(elem, EventTypes.touchcancel, handler);
        }
      };
    },

    swipe = (elem = document) => {
      const state = {}, EventTypes = Events,
          /*
           * Calculate the delta difference between two points (x1,y1) and (x2,y2)
           * @return A delta object {x: xdelta, y: ydelta} if the difference is more
           * than 30 pixels or null if its less. The values x and y can be -ve 
           */
          getMovement = (x1, y1, x2, y2) => {
            const dx = x1 - x2, dy = y1 - y2; 
            let xa, ya;
            if((xa = Math.abs(dx)) < 30 & (ya = Math.abs(dy)) < 30) {
              return null;
            }
            return {
              startX: x2,
              startY: y2,
              endX: x1,
              endY: y1,
              dir: xa >= ya ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down") 
            };
          },
          clearState = () => {
            state.id = state.x = state.y = state.movement = undefined;
          },
          handler = te => {
            const {type, target} = te;
            if(isDisabled(target)) {
              return;
            }
            let touches, touch, m, detail;
            switch (type) {
              case EventTypes.touchstart:
                touches = te.touches;
                if(touches.length > 1) {
                  return;
                }
                touch = touches[0];
                state.id = touch.identifier;
                state.x = touch.pageX;
                state.y = touch.pageY;
                break;
              case EventTypes.touchmove:
                touches = te.changedTouches;
                touch = touches[0];
                if(touch.identifier === state.id && te.touches.length === 1) {
                  state.movement = getMovement(touch.pageX, touch.pageY, state.x, state.y);
                }
                break;
              case EventTypes.touchend:
                touches = te.changedTouches;
                touch = touches[0];
                if(state.id === touch.identifier && (m = state.movement)) {
                  detail = m;
                  detail.nativeEvent = te;
                  // available as event.detail
                  target.dispatchEvent(createEvent("swipe", {detail: detail}));
                  clearState();
                }
                break;
              case EventTypes.touchcancel:
                // Some chrome versions wrongly fire touch cancel on swipe gestures android 4.4.2
                touches = te.changedTouches;
                touch = touches[0];
                if(state.id === touch.identifier && (m = state.movement)) {
                  detail = m;
                  detail.nativeEvent = te;
                  // available as event.detail
                  target.dispatchEvent(createEvent("swipe", {detail: detail}));
                }
                clearState();
                break;
              default:
                clearState();
                break;
            }
          };

      return {
        // type: "swipe",
        setup() {
          on(elem, EventTypes.touchstart, handler);
          on(elem, EventTypes.touchmove, handler);
          on(elem, EventTypes.touchend, handler);
          on(elem, EventTypes.touchcancel, handler);
        },
        destroy() {
          off(elem, EventTypes.touchstart, handler);
          off(elem, EventTypes.touchmove, handler);
          off(elem, EventTypes.touchend, handler);
          off(elem, EventTypes.touchcancel, handler);
        }
      };
    },

    NOOP_DEFN = {
      setup() {},
      destroy() {}
    },

    EventFactory = {
      tap,
      taphold,
      dbltap,
      swipe
    };



module.exports = {
  EventTypes: Events,
  stopEvent,
  setup(elem, event) {
    const factory = EventFactory[event];

    if(!factory) {
      // console.log("Event setup not found", event);
      return NOOP_DEFN;
    }
    const def = factory(elem);
    def.setup();
    return def;
  }
};
