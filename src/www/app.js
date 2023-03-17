/* global setTimeout, clearTimeout */
const {render, Fragment} = require("inferno"),
    {createClass: createComponent} = require("inferno-create-class"),
    Stage = require("@naikus/stage"),

    Touchable = require("@components/touchable"),
    Activables = require("@lib/activables"),
    {Notifications} = require("@components/notification"),
    LoadingIndicator = require("@components/loading-indicator"),

    Config = require("@app/config"),
    createRouter = require("@lib/router"),
    Storage = require("@services/storage"),


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
        this.setPanelVisible();
        if (show) {
          this.timeoutId = setTimeout(_ => {
            requestAnimationFrame(this.showSidebar.bind(this));
          }, 30);
        } else {
          this.timeoutId = setTimeout(_ => {
            requestAnimationFrame(this.hide.bind(this));
          }, 350);
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

    StageComponent = createComponent({
      componentDidMount() {
        document.addEventListener("deviceready", e => {
          this.setupBackButton();
        });
        this.setupStage();
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
        viewConfig.forEach(vc => {
          // console.log(vc);
          if(!vc) {return;}
          const {id, src, config} = vc;
          Stage.view(id, src, config);
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

    BottomBar = createComponent({
      render() {
        const {visible = true, children} = this.props;
        return (
          <div className={"bottom-bar " + (visible ? "show" : "")}>
            {children}
          </div>
        );
      },
      shouldComponentUpdate(nextProps) {
        return nextProps.visible !== this.props.visible;
      }
    }),

    App = createComponent({
      displayName: "App",
      defaultTransition: "lollipop",
      navItems: [
        {view: "/main", title: "Home", icon: "icon-home"},
        {view: "/settings", title: "Settings", icon: "icon-settings", transition: "lollipop"},
        {view: "/about", title: "About", icon: "icon-help-circle", transition: "slide-up"}
      ],
      contextFactory(stage, stageOpts) {
        const self = this;
        return {
          router: self.router,
          // "Override" these functions if you'd like to do anything additional things
          // before pushing views. e.g. check user permissions
          // /*
          pushView(viewId, options) {
            // @todo Check if view is allowed for the current user
            // console.log("[App]: Pushing view", viewId, options);
            return stage.pushView(viewId, options);
          },
          popView(options) {
            // @todo Check if view is allowed for the current user
            return stage.popView(options);
          },
          // */
          setSidebarVisible(show) {
            self.setSidebarVisible(show);
          },
          getConfig() {
            return Config
          },
          getLocalStorage() {
            return Storage;
          },
          showBottomBar(bShow = true) {
            self.setState({
              fullscreen: !bShow
            });
          },
          showNotification(message) {
            self.notifications.enqueue(message);
          }
        };
      },
      navigateTo(view, transition = this.defaultTransition) {
        const {showSidebar} = this.state;
        if(showSidebar) {
          this.setSidebarVisible(false);
          setTimeout(_ => {
            // this.stageComponent.getViewContext().pushView(view, {transition});
            this.router.route(view, {transition})
          }, 300);
        }else {
          this.router.route(view, {transition});
        }
      },
      renderSidebarItems() {
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

      renderBottombarItems() {
        return (
          <Fragment>
            <Touchable action="tap" onAction={() => this.setSidebarVisible(true)}>
              <span className="item activable"><i className="icon icon-menu" /></span>
            </Touchable>
            <Touchable action="tap" onAction={() => this.navigateTo("/main")}>
              <span className="item activable"><i className="icon icon-users" /></span>
            </Touchable>
            <Touchable action="tap" onAction={() => this.navigateTo("/about")}>
              <span className="item activable"><i className="icon icon-heart" /></span>
            </Touchable>
            <Touchable action="tap" onAction={() => this.navigateTo("/settings")}>
              <span className="item activable"><i className="icon icon-settings" /></span>
            </Touchable>
          </Fragment>
        );
      },

      // Stage event listeners
      onBeforeViewTransitionIn(e) {
        const viewId = e.viewId,
            controller = this.stageComponent.getViewController(viewId),
            {fullscreen, actionbar} = this.stageComponent.getViewConfig(viewId),
            showActionBar = actionbar !== false;
            // ViewActionBar = typeof controller.getActionBar === "function" ? controller.getActionBar() : null;
        // console.log("Fullscreen?", !!fullscreen);
        this.setState({
          viewId,
          showActionBar,
          fullscreen
        });
      },
      onBeforeViewTransitionOut(e) {
        // const {viewId} = e;
      },
      onViewLoadStart(e) {
        this.setState({loading: true});
      },
      onViewLoadEnd(e) {
        const {viewId, error} = e;
        this.setState({loading: false});
        if(error) {
          this.notifications.enqueue({
            type: "error",
            content: `Error loading veiew: ${viewId}`,
            sticky: true
          });
        }
      },
      setupRouter() {
        this.router = createRouter(Config.routes);
        this.router.on("route", (event, data) => {
          const {route, state, ...addnlData} = data, 
            {view, action, params, handler} = route,
            {stageComponent} = this,
            viewContext = stageComponent.getViewContext(),
            currentView = viewContext.currentView(),
            viewOptions = Object.assign({}, state, {params: params});
          // console.log(data);
          if(view) {
            if((currentView === view.id) || action !== "POP") {
              stageComponent.getViewContext().pushView(view.id, viewOptions);
            }else {
              stageComponent.getViewContext().popView(viewOptions);  
            }
          }else if(typeof handler === "function") {
            handler(data);
          }
        });
        this.router.on("route-error", (event, error) => {
          this.notifications.enqueue({
            type: "error",
            content: error.message,
            sticky: true
          });
        });

        // Add other custom routes
        this.router.addRoute({
          path: "/__drawer",
          handler: data => {
            window.alert(JSON.stringify(this.router.getCurrentRoute()));
          }
        });
        this.router.start();
      },

      // Lifecycle methods
      getInitialState() {
        this.viewConfig = Config.routes.map(route => route.view);
        this.setupRouter();

        return {
          loading: false,
          showSidebar: false,
          showActionBar: true,
          fullscreen: true
        };
      },
      componentDidMount() {
        const {startRoute = "/settings"} = this.props;
        this.router.route(startRoute);
        /*
        let route = this.router.getBrowserRoute();
        if(!route) {
          route = this.router.options.defaultRoute;
        }
        this.router.route(route);
        */
      },
      render() {
        const {defaultTransition} = this,
            {transition=defaultTransition} = this.props,
            {loading, showSidebar, viewId, showActionBar, fullscreen} = this.state;
        return (
          <Fragment>
            <StageComponent ref={comp => this.stageComponent = comp}
              viewConfig={this.viewConfig}
              transition={transition}
              contextFactory={this.contextFactory.bind(this)}
              onViewLoadStart={this.onViewLoadStart.bind(this)}
              onViewLoadEnd={this.onViewLoadEnd.bind(this)}
              onBeforeViewTransitionIn={this.onBeforeViewTransitionIn.bind(this)}
              onBeforeViewTransitionOut={this.onBeforeViewTransitionOut.bind(this)} />

            {/* This acts as a portal to view actions */}
            <div className={"actionbar-container " + (showActionBar ? (viewId + " show") : "")}></div>

            <BottomBar visible={!fullscreen}>
              {this.renderBottombarItems()}
            </BottomBar>

            <Sidebar active={showSidebar} onEmptyAction={this.setSidebarVisible.bind(this, false)}>
              <div className="branding">
                <img className="profile-image" src={'branding/default/images/logo.svg'} alt={"User"} />
                <div className="profile-name">John Doe</div>
                <div className="profile-email">johndoe@example.com</div>
              </div>
              <ul className="menu">
                {this.renderSidebarItems()}
              </ul>
            </Sidebar>

            <Notifications ref={comp => this.notifications = comp} />

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
  const settings = Storage.get("settings"),
      browserRoute = window.location.hash.substring(1),
      startRoute = settings ? browserRoute || "/" : "/settings";

  // set document title
  document.title = Config.appName;
  // set favicon
  const favElem = document.getElementById("favicon");
  favElem && favElem.setAttribute("href", `branding/${Config.branding}/images/favicon.svg`);

  render(
    <App startRoute={startRoute} transition="lollipop" />,
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
    console.log(Config);
    if(Config.pwa) {
      registerServiceWorker();
    }
  }
};
