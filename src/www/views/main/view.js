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
  factory(appContext, viewUi) {
    const setSidebarVisible = e => appContext.setNavVisible(true),
        showSettings = e => appContext.pushView("settings", {transition: "slide"}),
        showAbout = e => appContext.pushView("about", {transition: "slide-up"}),
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
            const {showModal} = this.props.options;
            return (
              <Fragment>
                <ActionBar className="main">
                  <img className="logo" alt="logo" src={`branding/${config.branding}/images/logo.svg`} />
                  <Action key="dashboard" text="Dashboard" />
                  <Spacer />
                  <Action key="modal" icon="icon-bell" handler={toggleModal} />
                  <Action key="settings" icon="icon-settings" handler={showSettings} />
                  <Action key="about" icon="icon-help-circle" handler={showAbout} />
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
                <Overlay visible={showModal} className="modal hello">
                  <div className="messag" onClick={toggleModal}>
                    You need to log in to continue
                  </div>
                </Overlay>
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
        },
        handleTransitionOut = _ => {
          render(null, viewUi);
        };

    let modalVisible = false, actionbar;

    return {
      // Stage app lifecycle functions.
      initialize(viewOpts) {
        viewUi.addEventListener("transitionout", handleTransitionOut);
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
