const Inferno = require("inferno"),
    Touchable = require("@components/touchable"),
    Portal = require("@components/portal"),

    Action = (props, context) => {
      const {text, icon, handler, event = "tap", className} = props;
      let item = (
        <div className={`action ${className} ${handler ? "activable" : ""}`}>
          {text ? (<span className="text">{text}</span>) : null}
          {icon ? (<i className={`icon ${icon}`}></i>) : null}
        </div>
      );
      if(handler) {
        item = (
          <Touchable action={event} onAction={handler}>
            {item}
          </Touchable>
        );
      }
      return item;
    },
    Spacer = () => (<div className="spacer"></div>),
    ActionBar = props => {
      const {children, target = ".actionbar-container", className = ""} = props;
      return (
        <Portal replace=".actionbar" className={`actionbar ${className}`} target={target}>
          {children}
        </Portal>
      );
    };

ActionBar.displayName = "ActionBar";
Action.displayName = "Action";
Spacer.displayName = "Spacer";

module.exports = {
  ActionBar,
  Action,
  Spacer
};
