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
      getViewConfig(viewId) {
        return this.stageInstance.getViewConfig(viewId);
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
        Object.keys(viewConfig).forEach(rPath => {
          const {view, path, config} = viewConfig[rPath];
          Stage.view(view, path, config);
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
            // console.log("[App]: Pushing view", viewId, options);
            return stage.pushView(viewId, options);
          },
          popView(options) {
            // @todo Check if view is allowed for the current user
            return stage.popView(options);
          },
          setSidebarVisible(show) {
            self.setSidebarVisible(show);
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
        const {showSidebar} = this.state;
        if(showSidebar) {
          this.setSidebarVisible(false);
          setTimeout(_ => {
            this.stageComponent.getViewContext().pushView(view, {transition});
          }, 300);
        }else {
          his.stageComponent.getViewContext().pushView(view, {transition});
        }
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
      setSidebarVisible(visible) {
        this.setState({showSidebar: visible === false ? false : true});
      },

      // Stage event listeners
      onBeforeViewTransitionIn(e) {
        const viewId = e.viewId,
            controller = this.stageComponent.getViewController(viewId),
            {actionbar} = this.stageComponent.getViewConfig(viewId),
            showActionBar = actionbar !== false;
            // ViewActionBar = typeof controller.getActionBar === "function" ? controller.getActionBar() : null;
        // console.log("Fullscreen?", !!fullscreen);
        this.setState({
          viewId,
          showActionBar
        });
      },
      onBeforeViewTransitionOut(e) {
        const {viewId} = e;
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
          loading: false,
          showSidebar: false,
          showActionBar: true,
        };
      },
      componentDidMount() {
      },
      renderActionBar() {
        const {viewId, showActionBar} = this.state;
        return (
          <div ref={elem => this.appbarContainer = elem}
              className={"actionbar-container " + (showActionBar ? (viewId + " show") : "")}>
          </div>
        );
      },
      render() {
        const {startView = "settings", transition={defaultTransition}} = this.props,
            {loading, showSidebar} = this.state;
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
            {this.renderActionBar()}
            <Sidebar active={showSidebar} onEmptyAction={this.setSidebarVisible.bind(this, false)}>
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
function initialize() {
  const activables = Activables(document);
  // Start the activables
  activables.start();
  window.addEventListener("unload", event => {
    activables.stop();
  });
  const startView = "main";

  // set document title
  document.title = Config.appName;
  // set favicon
  const favElem = document.getElementById("favicon");
  favElem && favElem.setAttribute("href", `branding/${Config.branding}/images/favicon.png`);

  render(
    <App startView={startView} transition="lollipop" />,
    document.getElementById("shell")
  );
}

function registerServiceWorker() {
  if("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").then(
      registration => {
        console.log("Service worker registered", registration);
      },
      error => {
        console.error("Service worker registration failed",)
      }
    );
  }
}

module.exports = {
  run() {
    initialize();
    if(Config.pwa) {
      registerServiceWorker();
    }
  }
};
