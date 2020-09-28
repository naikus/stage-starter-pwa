/* global setTimeout, clearTimeout */
const {render, Fragment} = require("inferno"),
    {createClass: createComponent} = require("inferno-create-class"),
    Stage = require("@naikus/stage"),
    Config = require("./config"),
    // Router = require("simple-router").default,
    Storage = require("store2").namespace(Config.appNamespace),

    Touchable = require("@components/touchable"),
    Activables = require("@lib/activables"),

    Sidebar = createComponent({
      displayName: "Sidebar",
      getInitialState() {
        return {
          stage: []
        };
      },

      componentDidUpdate(lastProps, lastState, snapShot) {
        const {active} = this.props, prevActive = lastProps.active;
        if (active && !prevActive) {
          this.setVisible(true);
        } else if (!active && prevActive) {
          this.setVisible(false);
        }
      },

      render() {
        const {stage} = this.state, {children} = this.props;
        return (
          <div className={`sidebar-container ${stage.join(" ")}`}>
            <Touchable action="tap" onAction={this.sidebarAction}>
              <div className="sidebar-pane"></div>
            </Touchable>
            <div className="sidebar">
              {children}
            </div>
          </div>
        );
      },

      setVisible(show) {
        clearTimeout(this.timeoutId);
        if(show) {
          this.setPanelVisible();
          this.timeoutId = setTimeout(this.showSidebar.bind(this), 50);
        }else {
          this.setPanelVisible();
          this.timeoutId = setTimeout(this.hide.bind(this), 500);
        }
      },
      setPanelVisible() {
        this.setState({
          stage: ["visible"]
        });
      },
      showSidebar() {
        this.setState({
          stage: ["visible", "show"]
        });
      },
      hide() {
        this.setState({
          stage: []
        });
      },
      sidebarAction(e) {
        const {onEmptyAction} = this.props;
        if(onEmptyAction) {
          onEmptyAction();
        }
      }
    }),

    LoadingIndicator = createComponent({
      displayName: "LoadingIndicator",
      render() {
        return (
          <div className="loading-indicator">
            <div className="slider"></div>
          </div>
        );
      }
    }),

    StageComponent = createComponent({
      componentDidMount() {
        this.setupStage();
        document.addEventListener("deviceready", e => {
          this.setupBackButton();
        });
      },
      render() {
        return (
          <div ref={element => this.viewport = element} className="stage-viewport"></div>
        );
      },
      // Stage component manages its own views and rendering lifecycle
      shouldComponentUpdate() {
        return false;
      },
      componentWillUnmount() {
        this.deregisterListeners();
      },
      getViewContext() {
        return this.stageInstance.getViewContext();
      },
      getViewController(viewId) {
        return this.stageInstance.getViewController(viewId);
      },
      setupStage() {
        const {viewport, props: {
          startView, viewConfig,
          transition,
          contextFactory
        }} = this;

        let stageInstance = this.stageInstance = Stage({
          viewport: viewport,
          transition: transition,
          transitionDelay: 10,
          contextFactory
        });

        // Register view load listeners
        this.registerListeners();

        // Register all the routes
        Object.keys(viewConfig).forEach(path => {
          const {view, template} = viewConfig[path];
          Stage.view(view, template);
        });
        if(startView) {
          stageInstance.getViewContext().pushView(startView, {});
        }
      },
      setupBackButton() {
        document.addEventListener("backbutton", e => {
          const {stageInstance} = this,
              controller = stageInstance.getViewController(stageInstance.currentView());
          if(typeof controller.onBackButton === "function") {
            controller.onBackButton();
          }else {
            try {
              stageInstance.popView();
            }catch(e) {
              navigator.app.exitApp();
            }
          }
        }, false);
      },
      registerListeners() {
        const {viewport, props: {
          onViewLoadStart,
          onViewLoadEnd,
          onBeforeViewTransitionIn,
          onBeforeViewTransitionOut
        }} = this;

        if(typeof onViewLoadStart === "function") {
          viewport.addEventListener("viewloadstart", onViewLoadStart);
        }
        if(typeof onViewLoadEnd === "function") {
          viewport.addEventListener("viewloadend", onViewLoadEnd);
        }
        if(typeof onBeforeViewTransitionIn === "function") {
          viewport.addEventListener("beforeviewtransitionin", onBeforeViewTransitionIn);
        }
        if(typeof onBeforeViewTransitionOut === "function") {
          viewport.addEventListener("beforeviewtransitionout", onBeforeViewTransitionOut);
        }
      },
      deregisterListeners() {
        const {stageInstance, viewport, props: {
          onViewLoadEnd,
          onViewLoadStart,
          onBeforeViewTransitionIn,
          onBeforeViewTransitionOut
        }} = this;
        if(typeof onViewLoadEnd === "function") {
          viewport.removeEventListener("viewloadend", onViewLoadEnd);
        }
        if(typeof onViewLoadStart === "function") {
          viewport.removeEventListener("viewloadstart", onViewLoadStart);
        }
        if(typeof onBeforeViewTransitionIn === "function") {
          viewport.removeEventListener("viewloadend", onBeforeViewTransitionIn);
        }
        if(typeof onBeforeViewTransitionOut === "function") {
          viewport.removeEventListener("viewloadstart", onBeforeViewTransitionOut);
        }
      }
    }),

    App = createComponent({
      displayName: "App",
      defaultTransition: "lollipop",
      navItems: [
        {view: "main", title: "Home", icon: "icon-home"},
        {view: "settings", title: "Settings", icon: "icon-settings", transition: "lollipop"},
        {view: "about", title: "About", icon: "icon-help-circle", transition: "slide-up"}
      ],
      contextFactory(stage, stageOpts) {
        const self = this;
        return {
          pushView(viewId, options) {
            // @todo Check if view is allowed for the current user
            console.log("[App]: Pushing view", viewId, options);
            return stage.pushView(viewId, options);
          },
          popView(options) {
            // @todo Check if view is allowed for the current user
            console.log("[App]: Popping view", options);
            return stage.popView(options);
          },
          setNavVisible(show) {
            self.setNavVisible(show);
          },
          getConfig() {
            return Config
          },
          getLocalStorage() {
            return Storage;
          }
        };
      },
      navigateTo(view, transition) {
        this.setNavVisible(false);
        setTimeout(_ => {
          this.stageComponent.getViewContext().pushView(view, {transition});
        }, 200);
      },
      renderNavItems() {
        return this.navItems.map(item => {
          const {
            icon, title, view, transition = this.defaultTransition,
            handler = this.navigateTo.bind(this, view, transition)
          } = item;
          return (
            <Touchable action="tap" onAction={handler}>
              <li className="activable">
                <i className={"icon " + icon}></i>
                <span className="title">{title}</span>
              </li>
            </Touchable>
          );
        });
      },
      setNavVisible(visible) {
        this.setState({showMainNav: visible === false ? false : true});
      },

      // Stage event listeners
      onBeforeViewTransitionIn(e) {
        const viewId = e.viewId,
            controller = this.stageComponent.getViewController(viewId),
            ViewActionBar = typeof controller.getActionBar === "function" ?
              controller.getActionBar() : null;
        // console.log("View actionbar", ViewActionBar);
        this.setState({
          viewId,
          ViewActionBar
        });
      },
      onBeforeViewTransitionOut(e) {
        const {viewId} = e;
        // console.log(e);
      },
      onViewLoadStart(e) {
        this.setState({loading: true});
      },
      onViewLoadEnd(e) {
        const {viewId, error} = e;
        this.setState({loading: false});
      },

      // Lifecycle methods
      getInitialState() {
        return {
          ViewActionBar: null,
          loading: false,
          showMainNav: false
        };
      },
      componentDidMount() {
      },
      render() {
        const {startView = "settings", transition={defaultTransition}} = this.props,
            {ViewActionBar, loading, showMainNav, viewId} = this.state;
        // console.log("Render app");
        return (
          <Fragment>
            <StageComponent ref={comp => this.stageComponent = comp}
              viewConfig={Config.views}
              startView={startView}
              transition={transition}
              contextFactory={this.contextFactory.bind(this)}
              onViewLoadStart={this.onViewLoadStart.bind(this)}
              onViewLoadEnd={this.onViewLoadEnd.bind(this)}
              onBeforeViewTransitionIn={this.onBeforeViewTransitionIn.bind(this)} />
            {/* onBeforeViewTransitionOut={this.onBeforeViewTransitionOut.bind(this)} /> */}
            <div className={"actionbar-container " + (ViewActionBar ? (viewId + " show") : "")}>
              {ViewActionBar}
            </div>
            <Sidebar active={showMainNav} onEmptyAction={this.setNavVisible.bind(this, false)}>
              <div className="branding">
                {/* <img className="logo" src="images/logo.svg" alt="Logo" /> */}
              </div>
              <ul className="menu">
                {this.renderNavItems()}
              </ul>
            </Sidebar>
            {loading ? <LoadingIndicator /> : null}
          </Fragment>
        );
      }
    });

/**
 * Run the app
 */
function run() {
  const activables = Activables(document);
  // Start the activables
  activables.start();
  window.addEventListener("unload", event => {
    activables.stop();
  });
  const settings = Storage.get("settings"),
      startView = settings ? "main" : "settings";

  // set document title
  document.title = Config.appName;
  // set favicon
  const favElem = document.getElementById("favicon");
  favElem && favElem.setAttribute("href", `branding/${Config.branding}/images/favicon.svg`);

  render(
    <App startView={startView} transition="lollipop" />,
    document.getElementById("shell")
  );
}


// Register the service worker
/*
if("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").then(
      registration => {
        console.debug("Service worker registration success", registration);
      },
      error => {
        console.debug("Service worker registration failed", error);
      }
    );
  });
}
*/

module.exports = {
  run: run
};
