const Stage = require("@naikus/stage"),
    {render, Fragment} = require("inferno"),
    {createClass: createComponent} = require("inferno-create-class"),
    Touchable = require("@components/touchable"),
    List = require("@components/list"),
    Overlay = require("@components/overlay"),
    {TabStrip, TabPanel} = require("@components/tabs"),
    {ActionBar, Action, Spacer} = require("@components/actionbar"),

    items = require("./items");

Stage.defineView({
  id: "main",
  template: `<div class="stage-view main"></div>`,
  factory(appContext, viewUi, viewConfig) {
    const setSidebarVisible = e => appContext.setSidebarVisible(true),
        {router} = appContext,
        showSettings = e => router.route("/settings", {transition: "slide"}),
        // loadNonExistingView = e => router.route("/foo", {transition: "slide"}),

        notificationTypes = ["info", "success", "error", "warn"],
        showNotification = e => {
          const type = Math.floor(Math.random() * notificationTypes.length)
          appContext.showNotification({
            type: notificationTypes[type],
            content: `This is a example of notification of type ${notificationTypes[type]}`,
            // content: function(messageAsProps) {return <span>some notification</span>}
            sticky: true
          });
        },
        config = appContext.getConfig(),
        Content = createComponent({
          getInitialState() {
            return {};
          },
          render() {
            const {confirmExit} = this.props.options;
            return (
              <Fragment>
                <ActionBar className="main">
                  <img width="24" 
                      height="24"
                      className="logo"
                      alt="logo"
                      src={`branding/${config.branding}/images/logo.svg`} />
                  <Action key="dashboard" text="Dashboard" />
                  <Spacer />
                  <Action key="settings" icon="icon-settings" handler={showSettings} />
                  <Action key="about" icon="icon-bell" handler={showNotification} />
                  <Action key="modal" icon="icon-log-out" handler={showExitOverlay} />
                </ActionBar>
                <div className="main-logo anim">
                  <img width="200" height="200"
                      className="spin" 
                      src={`branding/${config.branding}/images/logo.svg`} />
                </div>
                <Overlay visible={confirmExit} className="modal bottom exit">
                  <div className="title">
                    Exit application?
                  </div>
                  <div className="message">
                      Note that exit only works in Cordova or Capacitor
                      based app.
                  </div>
                  <div className="actions">
                  <Touchable action="tap" onAction={closeExitOverlay}>
                      <span className="button activable primary inline">
                        Dismiss
                      </span>
                    </Touchable>
                    <Touchable action="tap" onAction={exitApp}>
                      <span className="button activable inline">
                        Exit
                      </span>
                    </Touchable>
                  </div>
                </Overlay>
              </Fragment>
            );
          }
        }),
        closeExitOverlay = () => {
          overlayVisible = false;
          renderContent({confirmExit: false});
        },
        showExitOverlay = () => {
          overlayVisible = true;
          renderContent({confirmExit: true});
        },
        exitApp = () => {
          if(navigator.app) {
            navigator.app.exitApp();
          }else {
            closeExitOverlay();
          }
        },
        renderContent = (viewOpts, done, context = {}) => {
          render(<Content options={viewOpts} />, viewUi, done, {});
        },
        handleTransitionOut = _ => {
          render(null, viewUi);
        };

    let overlayVisible = false, logo;

    return {
      // Stage app lifecycle functions.
      initialize(viewOpts) {
        logo = new Image(32, 32);
        logo.src = `branding/${config.branding}/images/logo.svg`;
        // console.log("View configuration", viewConfig);
        viewUi.addEventListener("transitionout", handleTransitionOut);
      },
      onBackButton() {
        if(overlayVisible) {
          closeExitOverlay();
        }else {
          showExitOverlay();
        }
      },
      activate(viewOpts, done) {
        renderContent(viewOpts, done);
      },
      update(viewOpts) {
        renderContent(viewOpts);
      },
      deactivate(viewOpts) {},
      destroy() {}
    };
  }
});
