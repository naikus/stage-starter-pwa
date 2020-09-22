const Inferno = require("inferno"),
    {createClass: createComponent} = require("inferno-create-class"),
    Touchable = require("@components/touchable"),

    SelectableList = createComponent({
      comparator: (itemA, itemB) => itemA && itemB && itemA.id === itemB.id,
      setItem(item) {
        this.setState({selectedItem: item});
        const {onItemSelected} = this.props;
        if(onItemSelected) {
          onItemSelected(item);
        }
      },

      getInitialState() {
        return {
          selectedItem: this.props.selectedItem || {}
        };
      },
      render() {
        const {items,
              comparator = this.comparator,
              renderer = item => item.name,
              className
            } = this.props,
            {selectedItem} = this.state,
            renderedItems = items.map(item => {
              const clazz = "activable" + (comparator(item, selectedItem) ? " selected" : "");
              return (
                <Touchable action="tap" onAction={this.setItem.bind(this, item)}>
                  <li className={clazz} key={item.id}>
                    {renderer(item)}
                  </li>
                </Touchable>
              );
            });
        return (
          <ul className={`selectable-list ${className}`}>
            {renderedItems}
          </ul>
        );
      },
      displayName: "SelectableList"
    });

module.exports = SelectableList;
