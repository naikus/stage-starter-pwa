const Inferno = require("inferno"),
    Touchable = require("@components/touchable"),

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
      let {className = "", children} = props;
      return (
        <div className={`actionbar ${className}`}>
          {children}
        </div>
      );
    };


module.exports = {
  ActionBar,
  Action,
  Spacer
};
