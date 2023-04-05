const Inferno = require("inferno"),
    Touchable = require("@components/touchable"),

    SpinButton = props => {
      const {
            onClick,
            disabled,
            icon = "icon-check",
            busy,
            className = ""
          } = props, buttonClass = `spin-button ${className} ${busy ? " busy anim" : ""}`;

      return (
        <Touchable action="tap" onAction={onClick}>
          <button className={buttonClass} disabled={disabled || busy}>
            {busy ? <i className="icon icon-loader spin" /> : <i className={"icon " + icon} />}
            &#160;
            {props.children}
          </button>
        </Touchable>
      );
    };

SpinButton.displayName = "SpinButton";

module.exports = SpinButton;
