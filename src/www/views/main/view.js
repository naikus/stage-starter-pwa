const Stage = require("@naikus/stage"),
    {render, Fragment} = require("inferno"),
    {createClass: createComponent} = require("inferno-create-class"),
    Touchable = require("@components/touchable"),
    Modal = require("@components/modal"),
    {TabStrip, TabPanel} = require("@components/tabs"),
    {ActionBar, Action, Spacer} = require("@components/actionbar");

Stage.defineView({
  id: "main",
  template: `<div class="stage-view main"></div>`,
  factory(appContext, viewUi) {
    const setSidebarVisible = e => appContext.setNavVisible(true),
        showSettings = e => appContext.pushView("settings"/* , {transition: "slide"} */),
        showAbout = e => appContext.pushView("about", {transition: "slide-up"}),
        Content = createComponent({
          getInitialState() {
            return {};
          },
          render() {
            const {showModal} = this.props.options;
            return (
              <Fragment>
                <TabStrip>
                  <TabPanel key="tab1" icon="icon-calendar" title="Tab One">
                    <Touchable action="tap" onAction={setSidebarVisible}>
                      <span className="button activable inline primary">
                        Show/Hide Sidebar
                      </span>
                    </Touchable>
                  </TabPanel>
                  <TabPanel key="tab2" icon="icon-clock" title="Tab Two">
                    <Touchable action="tap" onAction={showSettings}>
                      <span className="button activable inline">Settings</span>
                    </Touchable>
                  </TabPanel>
                </TabStrip>
                <Modal visible={showModal} className="hello">
                  <div className="hello-world" onClick={toggleModal}>
                    Hello World!!!
                  </div>
                </Modal>
              </Fragment>
            );
          }
        }),
        toggleModal = () => {
          modalVisible = !modalVisible;
          renderContent({showModal: modalVisible});
        },
        renderContent = (viewOpts, done, context = {}) => {
          render(<Content options={viewOpts} />, viewUi, done, {});
        };

    let modalVisible = false, actionbar;

    return {
      // Stage app lifecycle functions.
      initialize(viewOpts) {},
      getActionBar() {
        return (
          <ActionBar className="main" ref={comp => actionbar = comp}>
            <Action className="first" text="Dashboard" />
            <Spacer />
            <Action icon="icon-bell" handler={toggleModal} />
            <Action icon="icon-settings" handler={showSettings} />
            <Action icon="icon-help-circle" handler={showAbout} />
          </ActionBar>
        );
      },
      onBackButton() {
        if(modalVisible) {
          toggleModal();
        }else {
          navigator.app.exitApp();
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
