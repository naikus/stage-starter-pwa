const {Fragment, createRef} = require("inferno"),
    {createClass: createComponent} = require("inferno-create-class"),
    {EventTypes, stopEvent, setup} = require("@lib/touch"),

    isDisabled = target => {
      const disabled = target.getAttribute("disabled");
      return disabled === "" || disabled === "true";
    };

module.exports = createComponent({
  displayName: "Touchable",
  getInitialState() {
    this.elemRef = createRef();
    return {};
  },
  componentDidMount() {
    const {action = "tap", children} = this.props,
        event = EventTypes[action],
        child = children[0] || children;

    if(child) {
      const node = this.elemRef.current;
      if(node) {
        this.dispatcher = this.dispatchAction.bind(this);
        this.eventDefinition = setup(node, event);
        node.addEventListener(event, this.dispatcher);
      }
    }
  },

  componentWillUnmount() {
    if(this.elemRef.current && this.eventDefinition) {
      this.eventDefinition.destroy();
    }
  },

  render() {
    const {children} = this.props,
        child = children[0] || children;

    child.ref = this.elemRef;
    return child;
  },

  dispatchAction(e) {
    stopEvent(e);
    const {onAction} = this.props;
    if(!isDisabled(this.elemRef.current) && onAction) {
      window.setTimeout(_ => onAction(e), 30);
    }
  }
});
