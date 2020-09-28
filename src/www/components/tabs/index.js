/* global console */
const Inferno = require("inferno"), 
    {createClass: createComponent} = require("inferno-create-class"),
    Touchable = require("@components/touchable"),
    isArray = that => Object.prototype.toString.call(that) === "[object Array]",

    TabPanel = props => {
      const {name, children, className = ""} = props;
      return (
        <div className={`tab-panel ${className}`}>{children}</div>
      );
    },

    TabStrip = createComponent({
      displayName: "Tabs",
      propTypes: {
        class: "string",
        onSelectionChanged: "function",
        activeTab: "number",
        children: "array"
      },

      selectTab(index) {
        let idx = Number(index), previousIndex = this.state.activeTab;
        idx = isNaN(idx) ? 0 : idx;
        this.setState({activeTab: idx});
        const {onSelectionChanged} = this.props;
        if(typeof onSelectionChanged === "function") {
          onSelectionChanged(index, previousIndex);
        }
      },

      renderStrip() {
        const {activeTab} = this.state;
        let {children} = this.props; 

        children = isArray(children) ? children : [children];
        let items;
        items = children.map((tab, i) => {
          const classNames = (i === activeTab) ? "tab-item activable selected" :
                "tab-item activable",
              {icon, title} = tab.props,
              iconEl = icon ? <i className={"icon " + icon}></i> : null;
          return (
            <Touchable onAction={this.selectTab.bind(this, i)} action="tap">
              <li className={classNames} key={"TabItem_" + i}>
                {iconEl}
                <span>{title}</span>
              </li>
            </Touchable>
          );
        });

        return (
          <ul className={"tabs-nav"}>
            {items}
          </ul>
        );
      },

      renderContent() {
        const idx = this.state.activeTab || 0, {children} = this.props;
        return isArray(children) ? children[idx] : children;
      },

      getInitialState() {
        return {
          activeTab: this.props.activeTab || 0
        };
      },

      render() {
        const {className = ""} = this.props;
        return (
          <div className={`tabs ${className}`}>
            {this.renderStrip()}
            <div className="tabs-content">
              {this.renderContent()}
            </div>
          </div>
        );
      }
    });

TabStrip.TabPanel = TabPanel;

module.exports = {
  TabStrip,
  TabPanel
};
