const {createPortal} = require("inferno"),
    {createClass: createComponent} = require("inferno-create-class"),
    Portal = require("@components/portal"),
    Modal = createComponent({
        getInitialState() {
          return {wasVisible: false};
        },
        render() {
          const {target = "body", visible, className: clazz, children} = this.props,
              {wasVisible} = this.state;

          if(visible || wasVisible) {
            return (
              <Portal target={target}>
                <div class={`modal-container ${visible ? "__visible": ""}`}>
                  <div class={`modal ${clazz}`}>
                    {children}
                  </div>
                </div>
              </Portal>
            )
          }
          return null;
        },
        componentDidUpdate(lastProps, lastState, snapshot) {
          const {visible: prevVisible} = lastProps,
              {visible} = this.props,
              {wasVisible} = this.state;

          if(visible && !wasVisible) {
            this.setState({wasVisible: true});
          }
        },
        componentDidMount() {
          // console.log("Modal Mounted");
          if(this.props.visible) {
            this.forceUpdate();
          }
        },
        componentWillUnmount() {
          // console.log("Modal unmounting");
        }
      },
    );

module.exports = Modal;
