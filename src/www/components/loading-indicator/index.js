const Inferno = require("inferno"),
    LoadingIndicator = props => {
      return (
        <div className="loading-indicator">
          <div className="slider"></div>
        </div>
      );
    };

LoadingIndicator.displayName = "LoadingIndicator";
module.exports = LoadingIndicator;