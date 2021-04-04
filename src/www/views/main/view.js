const Stage = require("@naikus/stage"),
    {render, Fragment} = require("inferno"),
    {createClass: createComponent} = require("inferno-create-class"),
    Touchable = require("@components/touchable"),
    List = require("@components/list"),
    Overlay = require("@components/overlay"),
    {TabStrip, TabPanel} = require("@components/tabs"),
    {ActionBar, Action, Spacer} = require("@components/actionbar");

Stage.defineView({
  id: "main",
  template: `<div class="stage-view main"></div>`,
  factory(appContext, viewUi, viewConfig) {
    const setSidebarVisible = e => appContext.setSidebarVisible(true),
        showSettings = e => appContext.pushView("settings", {transition: "slide"}),

        notificationTypes = ["info", "success", "error", "warn"],
        showNotification = e => {
          const type = Math.floor(Math.random() * notificationTypes.length)
          appContext.showNotification({
            type: notificationTypes[type],
            content: `This is a example of notification of type ${notificationTypes[type]}`,
            sticky: true
          });
        },
        config = appContext.getConfig(),
        items = [
          {id: "0", name: "Learn Japanese"},
          {id: "1", name: "Play guitar"},
          {id: "2", name: "Practice LD"}
        ],
        Content = createComponent({
          getInitialState() {
            return {};
          },
          render() {
            const {confirmExit} = this.props.options;
            return (
              <Fragment>
                <ActionBar className="main">
                  <img className="logo" alt="logo" src={`branding/${config.branding}/images/logo.svg`} />
                  <Action key="dashboard" text="Dashboard" />
                  <Spacer />
                  <Action key="modal" icon="icon-box" handler={showExitOverlay} />
                  <Action key="settings" icon="icon-settings" handler={showSettings} />
                  <Action key="about" icon="icon-bell" handler={showNotification} />
                </ActionBar>
                <TabStrip>
                  <TabPanel key="tab1" icon="icon-calendar" title="Tab One">
                    <Touchable action="tap" onAction={setSidebarVisible}>
                      <span className="button activable inline primary">
                        Show/Hide Sidebar
                      </span>
                    </Touchable>
                  </TabPanel>
                  <TabPanel key="tab2" className="list-panel" icon="icon-clock" title="Tab Two">
                    <List items={items} 
                        selectedItem={items[1]}
                        onItemSelected={item => console.log(item)} />
                  </TabPanel>
                </TabStrip>
                <Overlay visible={confirmExit} className="modal exit">
                  <div className="message">
                    <p>Exit Application?</p>
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

    let overlayVisible = false;

    return {
      // Stage app lifecycle functions.
      initialize(viewOpts) {
        console.log("View configuration", viewConfig);
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
        renderContent(viewOpts, done, {});
      },
      update(viewOpts) {
        renderContent(viewOpts);
      },
      deactivate(viewOpts) {},
      destroy() {}
    };
  }
});
