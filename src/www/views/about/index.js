const Stage = require("@naikus/stage"),
    {render} = require("inferno"),
    {createClass: createComponent} = require("inferno-create-class"),
    Touchable = require("@components/touchable");

Stage.defineView({
  id: "about",
  template: `<div class="stage-view no-actionbar about"></div>`,
  factory(appContext, viewUi) {
    const goBack = _ => appContext.popView(),
        config = appContext.getConfig(),
        Content = createComponent({
          render() {
            const {appName, appVersion} = appContext.getConfig();
            return (
              <div className="content text-center">
                <img width="130" height="130"
                    className="logo"
                    alt="logo"
                    src={`branding/${config.branding}/images/logo.svg`} />
                <h3>
                  {appName} ({appVersion})
                </h3>
                <p>
                  Made using <a target="_blank" href="https://naikus.github.io/stage">stagejs</a> and <a target="_blank" href="https://infernojs.org">inferno</a>
                </p>
                <Touchable action="tap" onAction={goBack}>
                  <span className="button activable inline">
                    <i className="icon-arrow-left"></i> Back
                  </span>
                </Touchable>
              </div>
            );
          }
        }),
        handleTransitionOut = _ => {
          render(null, viewUi);
        };
    return {
      initialize(viewOpts) {
        // viewUi.addEventListener("transitionout", handleTransitionOut);
      },
      activate(viewOpts, done) {
        render(<Content />, viewUi, done, {});
      }
    };
  }
});
