const Stage = require("@naikus/stage"),
    {render} = require("inferno"),
    {createClass: createComponent} = require("inferno-create-class"),
    Touchable = require("@components/touchable");

Stage.defineView({
  id: "about",
  template: `<div class="stage-view no-actionbar about"></div>`,
  factory(appContext, viewUi) {
    const goBack = _ => appContext.popView(),
        Content = createComponent({
          render() {
            return (
              <div class="content text-center">
                <p>
                  Made using <a target="_blank" href="https://naikus.github.io/stage">stagejs</a> and <a target="_blank" href="https://infernojs.org">inferno</a>
                </p>
                <Touchable action="tap" onAction={goBack}>
                  <span class="button activable primary inline">OK</span>
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
        viewUi.addEventListener("transitionout", handleTransitionOut);
      },
      activate(viewOpts, done) {
        render(<Content />, viewUi, done, {});
      }
    };
  }
});
