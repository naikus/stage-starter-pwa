const {createPortal} = require("inferno"),
    {createClass: createComponent} = require("inferno-create-class"),
    Portal = createComponent({
      displayName: "Portal",
      getInitialState() {
        const {target = "body"} = this.props,
            element = this.element = document.createElement("div");

        element.setAttribute("class", "portal");
        document.querySelector(target).appendChild(element);
      },

      componentDidMount() {
        let {children = []} = this;
        // console.log(children);
        createPortal(children, this.element, this.context);
      },

      render() {
        let {children} = this.props;
        // console.log(children);
        return createPortal(children, this.element, this.context);
      },

      componentWillUnmount() {
        // unmountSync(this.element);
        createPortal(null, this.element);
        this.element.parentNode.removeChild(this.element);
      }
    });

module.exports = Portal;
