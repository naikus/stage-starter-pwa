const {createPortal} = require("inferno"),
    {createClass: createComponent} = require("inferno-create-class"),
    Portal = createComponent({
      displayName: "Portal",
      prepDom() {
        const {target = "body", replace = ""} = this.props,
            {element} = this,
            targetElem = document.querySelector(target);

        if(replace) {
          const existing = targetElem.querySelector(replace);
          existing && existing.parentNode.removeChild(existing);
        }
        targetElem.appendChild(element);
      },

      getInitialState() {
        const {className = "portal"} = this.props,
            element = this.element = document.createElement("div");

        element.setAttribute("class", className);
        return {};
      },

      componentDidMount() {
        this.prepDom();
        // let {children = []} = this;
        // console.log(children);
        // createPortal(children, this.element, this.context);
      },

      componentWillUpdate(nextProps) {
        // this.prepDom();
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
