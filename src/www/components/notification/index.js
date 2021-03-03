/* global setTimeout clearTimeout */
const Inferno = require("inferno"),
    {createClass: createComponent} = require("inferno-create-class"),
    Touchable = require("@components/touchable"),

    ICONS = {
      error: "icon-alert-octagon",
      success: "icon-check",
      default: "icon-bell",
      info: "icon-info",
      warn: "icon-alert-triangle"
    },

    Notification = createComponent({
      displayName: "Notification",
      getInitialState() {
        return {
          show: false
        };
      },
      componentDidMount() {
        const {message: {sticky, timeout = 4000}} = this.props;
        setTimeout(_ => {
          this.setState({show: true});
        }, 50);
        // Sticky notitifications don't auto dismiss
        if(!sticky) {
          this.timeoutId = setTimeout(_ => {
            this.dismiss();
          }, timeout);
        }
      },
      componentWillUnmount() {
        clearTimeout(this.timeoutId);
      },
      render() {
        const {show} = this.state, 
            {message} = this.props,
            {type, content} = message,
            icon = ICONS[type] || message.icon;
        // console.log("notification", message);
        return (
          <Touchable onAction={this.dismiss.bind(this)}>
            <div class={`notification ${type} ${show ? " show" : ""}`}>
              <i class={`icon ${icon}`}></i>
              <span class="data">{content}</span>
            </div>
          </Touchable>
        );
      },
      dismiss() {
        const {onDismiss, message} = this.props;
        clearTimeout(this.timeoutId);
        this.setState({show: false});
        onDismiss && onDismiss(message);
      }
    }),

    Notifications = createComponent({
      display: "Notifications",
      getInitialState() {
        return {
          messages: this.props.messages || [],
          current: {}        
        };
      },
      enqueue(notification) {
        const {current: {message}, messages} = this.state;
        messages.push(notification);
        if(!message) {
          this.setState({current: this.getNextMessage()});
        }
      },
      componentDidMount() {
        this.setState({current: this.getNextMessage()});
      },
      comonentWillUnmount() {
        clearTimeout(this.timeoutId);
      },
      onNotificationDismissed(message) {
        clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(_ => {
          this.setState({current: this.getNextMessage()});
        }, 200);
      },
      getNextMessage() {
        return {
          message: this.state.messages.shift(),
          key: new Date().getTime()
        };
      },
      renderNotification() {
        const {current: {key, message}} = this.state;
        if (message) {
          return (
            <Notification key={key} message={message} onDismiss={this.onNotificationDismissed.bind(this)} />
          );
        }
        return null;
      },
      render() {
        return (
          <div className="notifications">
            {this.renderNotification()}
          </div>
        );
      }
    });

module.exports = {
  Notification,
  Notifications
};
