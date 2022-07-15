const {createPortal} = require("inferno"),
    {createClass: createComponent} = require("inferno-create-class"),
    Portal = require("@components/portal"),
    overlay = createComponent({
        displayName: "Overlay",
        getInitialState() {
          return {wasVisible: false};
        },
        render() {
          const {target = "body", visible, className: clazz, children} = this.props,
              {wasVisible} = this.state;

          if(visible || wasVisible) {
            return (
              <Portal target={target}>
                <div ref={el => this.overlayEl = el} className={`overlay-container ${visible ? "__visible": ""}`}>
                  <div className={`overlay ${clazz}`}>
                    {children}
                  </div>
                </div>
              </Portal>
            )
          }
          return null;
        },
        componentDidUpdate(lastProps, lastState, snapshot) {
          // console.log(lastProps, lastState, snapshot);
          const {visible: prevVisible} = lastProps,
              {visible} = this.props,
              {wasVisible} = this.state;

          if(visible && !wasVisible) {
            this.setState({wasVisible: true});
          }else if(prevVisible && !visible) {
            const listener = () => {
              this.overlayEl.removeEventListener("animationend", listener);
              this.setState({wasVisible: false});
            };
            this.overlayEl.addEventListener("animationend", listener);
          }
        },
        componentDidMount() {
          // console.log("overlay Mounted");
          if(this.props.visible) {
            this.forceUpdate();
          }
        },
        componentWillUnmount() {
          // console.log("overlay unmounting");
        }
      },
    );

module.exports = overlay;
