const {createPortal} = require("inferno"),
    {createClass: createComponent} = require("inferno-create-class"),
    Portal = createComponent({
      displayName: "Portal",
      getInitialState() {
        const {target = "body", className = "", replace = ""} = this.props,
            element = this.element = document.createElement("div");

        element.setAttribute("class", className);
        const targetElem = document.querySelector(target);
        if(replace) {
          const existing = targetElem.querySelector(replace);
          existing && existing.parentNode.removeChild(existing);
        }
        targetElem.appendChild(element);
      },

      componentDidMount() {
        // let {children = []} = this;
        // console.log(children);
        // createPortal(children, this.element, this.context);
      },

      render() {
        let {children} = this.props;
        // console.log(children);
        return createPortal(children, this.element, this.context);
      },

      componentWillUnmount() {
        createPortal(null, this.element);
        const {parentNode} = this.element;
        parentNode && parentNode.removeChild(this.element);
      }
    });

module.exports = Portal;
