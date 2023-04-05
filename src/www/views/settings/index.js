/* global location setTimeout */
const Stage = require("@naikus/stage"),
    {render, Fragment} = require("inferno"),
    {createClass: createComponent} = require("inferno-create-class"),
    Touchable = require("@components/touchable"),
    Overlay = require("@components/overlay"),
    {SpinButton, Form, Field, fieldRender, rb} = require("@components/form"),
    {ActionBar, Action, Spacer} = require("@components/actionbar");

// console.log(Storage, Config, Form, Rules, rb);

Stage.defineView({
  id: "settings",
  // template not strictly needed unless you want custom CSS class
  template: `<div class="stage-view settings"></div>`,
  factory(appContext, viewUi) {
    let previousView = null;
    const goBack = () => previousView ? appContext.router.back() : location.replace("/"),
        showAbout = e => appContext.router.route("/about", {transition: "slide-up"}),
        storage = appContext.getLocalStorage(),
        validationRules = {
          fullName: [
            rb("required")
          ],
          address: [
            rb("required")
          ],
          agreeToTerms: [
            (value, field, fields) => {
              if(!value) {
                return {valid: false, message: "You must agree to terms and conditions"};
              }
            }
          ]
        },

        Content = createComponent({
          getInitialState() {
            const settings = storage.get("settings") || {};
            return {
              valid: false,
              busy: false,
              showOverlay: false,
              settings: {
                fullName: settings.fullName,
                city: settings.city || "Pune",
                address: settings.address,
                agreeToTerms: true,
                age: settings.age || 30
              }
            };
          },
          componentDidMount() {
            const {options: {hasPreviousView}} = this.props, {settings} = this.state;
            setTimeout(() => this.setState({showOverlay: !hasPreviousView && !settings.fullName}), 500);
          },
          closeOverlay() {
            this.setState({showOverlay: false});
          },
          render() {
            const {settings: {fullName, city, address, agreeToTerms, age}, valid, busy, showOverlay} = this.state,
                back = previousView ? (<Action key="back" icon="icon-arrow-left" handler={goBack} />) : null;
            return (
              <Fragment>
                <ActionBar className="settings">
                  {back}
                  <Action key="title" className={previousView ? "" : "first"} text="Settings" />
                  <Spacer />
                  <Action key="about" icon="icon-help-circle" handler={showAbout} />
                </ActionBar>
                <div className="content">
                  <p>A sample form with validation</p>
                  <Form rules={validationRules}
                    onChange={this.handleFormChange.bind(this)}
                    fieldRender={fieldRender}>
                    <Field type="text"
                      name="fullName"
                      value={fullName}
                      label="Full Name"
                      data-hint="Your given name and last name" />

                    <Field type="select"
                      name="city"
                      value={city}
                      label="City"
                      data-hint="Choose a city">
                      <option value="Banglore">Banglore</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Pune">Pune</option>
                    </Field>

                    <Field type="textarea" name="address"
                      value={address}
                      label="Address"
                      data-hint="Your street address" />

                    <Field type="range" name="age"
                      min={10}
                      max={150}
                      data-hint="Between 10 and 150"
                      value={age}
                      step={1}
                      label="Your Age" />

                    <Field name="agreeToTerms"
                      type="checkbox"
                      value={agreeToTerms}
                      label="I agree to terms and conditions"
                      data-hint="You must agree :D" />
                    {/*
                    <Field name="myRadio"
                      type="radio"
                      label="Option 1" />
                    <Field name="myRadio"
                      type="radio"
                      label="Option 2" />
                    */}
                  </Form>
                  <div className="actions">
                    <SpinButton onClick={this.saveSettings.bind(this)}
                      className="_pull-right activable primary inline"
                      disabled={!valid || busy}
                      busy={busy}>
                      Save
                    </SpinButton>
                  </div>
                </div>
                <Overlay visible={showOverlay} className="modal bottom">
                  <div className="title">
                    Welcome to Stage
                  </div>
                  <div className="message">
                    Please fill in the details (any dummy data) below to browse the entire app. This view
                    acts the initial setup page for the app. This data is stored in localstorage and not
                    sent to any server.
                  </div>
                  <div className="actions">
                    <Touchable action="tap" onAction={this.closeOverlay}>
                      <span className="button activable primary inline">
                        Dismiss
                      </span>
                    </Touchable>
                  </div>
                </Overlay>
              </Fragment>
            );
          },

          handleFormChange(formModel) {
            const {data: newSettings, valid, validation} = formModel;
            // console.log(newSettings, validation);
            if(valid) {
              // console.log("Form valid");
              this.setState({
                valid,
                settings: newSettings
              });
            }else {
              // console.log("Form invalid");
              this.setState({valid, setttings: newSettings});
            }
          },
          saveSettings() {
            const {settings} = this.state;
            this.setState({busy: true});
            window.setTimeout(() => {
              this.setState({busy: false});
              appContext.showNotification({
                type: "success",
                content: "Settings saved successfully"
              });
              storage.set("settings", settings);
              goBack();
            }, 1000);
          }
        }),

        renderContent = (viewOpts, done, context = {}) => {
          render(<Content options={viewOpts} />, viewUi, done, {});
        },
        handleTransitionOut = _ => {
          render(null, viewUi);
        },
        handleBeforeTransitionIn = _ => {
          if(!previousView) {
            appContext.showBottomBar(false);
          }
        };

    return {
      initialize(viewOpts) {
        viewUi.addEventListener("beforetransitionin", handleBeforeTransitionIn);
        viewUi.addEventListener("transitionout", handleTransitionOut);
      },
      activate(viewOpts, done) {
        const {fromView, viewAction} = viewOpts;
        previousView = appContext.previousView();
        const options = Object.assign({}, viewOpts, {hasPreviousView: !!previousView});
        renderContent(options, done);
      },
      update(viewOpts) {
        renderContent(viewOpts, null, {});
      },
      deactivate() {
      },
      destroy() {}
    };
  }
});
