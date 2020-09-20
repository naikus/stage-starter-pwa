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
                <p>Made using stage.js and vidom</p>
                <Touchable action="tap" onAction={goBack}>
                  <span class="button activable primary inline">OK</span>
                </Touchable>
              </div>
            );
          }
        });
    return {
      activate(viewOpts, done) {
        render(<Content />, viewUi, done, {});
      }
    };
  }
});
