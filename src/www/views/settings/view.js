/* global location */
const Stage = require("@naikus/stage"),
    {render} = require("inferno"),
    {createClass: createComponent} = require("inferno-create-class"),
    Touchable = require("@components/touchable"),
    {SpinButton, Form, Field, rb} = require("@components/form"),
    {ActionBar, Action, Spacer} = require("@components/actionbar");

// console.log(Storage, Config, Form, Rules, rb);

Stage.defineView({
  id: "settings",
  // template not strictly needed unless you want custom CSS class
  template: `<div class="stage-view settings"></div>`,
  factory(appContext, viewUi) {
    let previousView = null;
    const goBack = () => previousView ? appContext.popView() : location.reload(),
        showAbout = e => appContext.pushView("about", {transition: "slide-up"}),
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

        fieldRender = (field, fieldModel) => {
          const {showLabel = true, "data-hint": hint, type, name, label} = field.props,
              {valid = true, message, pristine = true} = fieldModel,
              messageContent = valid ? null : (<span class="v-msg hint">{message}</span>),
              labelContent = !showLabel ? null : (
                <div class="label">
                  <span class="title">{label}</span>
                  {hint ? <span class="hint">{hint}</span> : null}
                </div>
              );
          return (
            <label class={`field-container ${name} ${type} pristine-${pristine} valid-${valid}`}>
              {labelContent}
              {field}
              {messageContent}
            </label>
          );
        },

        Content = createComponent({
          getInitialState() {
            const settings = storage.get("settings") || {};
            return {
              valid: false,
              busy: false,
              settings: {
                fullName: settings.fullName,
                city: settings.city || "Pune",
                address: settings.address,
                agreeToTerms: true
              }
            };
          },
          render() {
            const {settings: {fullName, city, address, agreeToTerms}, valid, busy} = this.state;
            return (
              <div className="content">
                <p className="message">
                  A sample form with validation
                </p>
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

                  <Field name="agreeToTerms"
                      type="checkbox"
                      value={agreeToTerms}
                      label="I agree to terms and conditions"
                      data-hint="You must agree :D" />
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
              storage.set("settings", settings);
              goBack();
            }, 2000);
          }
        }),

        renderContent = (viewOpts, done, context = {}) => {
          render(<Content options={viewOpts} />, viewUi, done, {});
        };

    let actionbar;

    return {
      getActionBar() {
        // return <ActionBar ref={el => this.actionBar = el} />;
        const back = previousView ? (<Action icon="icon-arrow-left" handler={goBack} />) : null;
        return (
          <ActionBar className="settings" ref={comp => actionbar = comp}>
            {back}
            <Action className={previousView ? "" : "first"} text="Settings" />
            <Spacer />
            <Action icon="icon-help-circle" handler={showAbout} />
          </ActionBar>
        );
      },
      initialize(viewOpts) {
        viewUi.addEventListener("transitionout", e => {
          // unmount(viewUi);
        });
      },
      activate(viewOpts, done) {
        const {fromView, viewAction} = viewOpts;
        previousView = appContext.previousView();
        renderContent(viewOpts, done, {});
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
