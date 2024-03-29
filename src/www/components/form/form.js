const {Fragment, render} = require("inferno"),
    {createClass: createComponent} = require("inferno-create-class"),
    VALID = {valid: true, message: ""},
    objToString = Object.prototype.toString,
    isArray = that => objToString.call(that).slice(8, -1) === "Array",
    isIos = () => /iPad|iPhone|iPod/.test(navigator.platform),

    fieldTypes = {
      input(props, context) {
        return (
          <input type={props.type} {...props} />
        );
      },
      checkbox(props, context) {
        const onInput = props.onInput,
            handler = e => {
              onInput && onInput({
                target: {
                  srcElement: e.target,
                  value: e.target.checked
                }
              });
            },
            events = isIos() ? {onChange: handler, onInput: null} : {onInput: handler},
            newProps = {
              ...props,
              ...events,
              // checked: props.value,
              value: `${props.value}`
            };
        return (
          <Fragment>
            <input type="checkbox" {...newProps} />
            <div class="indicator"></div>
          </Fragment>
        );
      },
      radio(props, context) {
        const handler = e => props.onInput && props.onInput({
              target: {
                value: e.target.checked
              }
            }),
            events = isIos() ? {onClick: handler} : {onInput: handler},
            newProps = {
              ...props,
              ...events,
              checked: props.value,
              value: `${props.value}`
            };
        return (
          <Fragment>
            <input type="radio" {...newProps} />
            <div class="indicator"></div>
          </Fragment>
        );
      },
      button(props, context) {
        return (
          <button {...props}>
            {props.children}
          </button>
        );
      },
      select(props, context) {
        return (
          <select {...props}>
            {props.children}
          </select>
        );
      },
      textarea(props, context) {
        return (
          <textarea {...props}>
            {props.children}
          </textarea>
        );
      }
    },

    registerFieldType = (type, fieldImpl) => {
      fieldTypes[type] = fieldImpl;
    },

    defaultFieldRender = (fieldComp, fieldModel, fieldProps, formContext) => {
      const {showLabel = true, hint, type, name, label, className} = fieldProps,
          {valid = true, message, pristine = true, value=""} = fieldModel,
          messageContent = valid ? null : (<span className="v-msg hint">{message}</span>),
          labelContent = !showLabel ? null : (
            <div className="label">
              <span className="title">{label}</span>
              {hint ? <span className="hint">{hint}</span> : null}
              {type === "range" ? <span className="value">{value}</span> : null}
            </div>
          );
      return (
        <label className={`field-container ${name} ${type} pristine-${pristine} valid-${valid} ${className}`}>
          {labelContent}
          {fieldComp}
          {messageContent}
        </label>
      );
    },

    Field = createComponent({
      displayName: "Field",
      propTypes: {
        name: "string",
        type: "string",
        render: "func"
      },
      getInitialState() {
        const {name, value, label, defaultValue, defaultChecked} = this.props;
        return {
          name,
          label,
          value: value || defaultValue || defaultChecked,
          defaultValue,
          defaultChecked,
          pristine: true
        };
      },
      componentDidMount() {
        const formContext = this.getFormContext(),
            {name, value, label} = this.state;

        if(formContext) {
          formContext.addField({name, value, label, pristine: true});
        }
      },
      render() {
        const formContext = this.getFormContext(),
            {props} = this,
            {value} = this.state,
            {onInput, type, name} = props,
            typeRenderer = fieldTypes[type] || fieldTypes.input;

        let newProps = props;
        if(formContext) {
          newProps = {
            ...props,
            // value,
            /*
            onChange: e => {
              this.handleChange(e);
              onChange && onChange(e);
            },
            */
            onInput: e => {
              this.handleChange(e);
              onInput && onInput(e);
            }
          };

          const render = formContext.getFieldRender(),
              fm = formContext.getFieldModel(name),
              comp = typeRenderer.call(this, newProps, formContext);
          return render(comp, fm, newProps, formContext);
        }

        return typeRenderer.call(this, newProps, formContext);
      },

      handleChange(e) {
        const value = e.target.value, {name, label} = this.state,
            formContext = this.getFormContext();

        this.setState({value, pristine: false}, _ => {
          if(formContext) {
            formContext.updateField({name, label, value, pristine: false});
          }
        });
      },
      getFormContext() {
        const {context} = this;
        return context ? context.form : null;
      }
    }),

    Form = createComponent({
      displayName: "Form",
      propTypes: {
        rules: "object",
        onChange: "func",
        onSubmit: "func",
        fieldRender: "func"
      },
      getInitialState() {
        const {rules} = this.props;
        return {
          rules,
          fields: [],
          valid: true,
          pristine: true,
          mounted: false
        };
      },
      componentDidMount() {
        const {onChange} = this.props;
        // console.debug("Form mounted", mounted, this.fieldModels);
        this.setState({
          fields: this.fieldModels || [],
          valid: this.validate(this.fieldModels),
          mounted: true
        }, _ => onChange && onChange(this.getData()));
        delete this.fieldModels;
      },
      render() {
        const {className} = this.props;
        return (
          <form onSubmit={this.handleSubmit} className={`form ${className}`}>
            {this.props.children}
          </form>
        );
      },
      getFieldModel(name) {
        let fm = {};
        this.state.fields.some(f => {
          if(f.name === name) {
            fm = f;
            return true;
          }
          return false;
        });
        return fm;
      },
      getChildContext() {
        const {context} = this,
            formContext = {
              form: {
                name: "FormContext",
                updateField: fieldModel => {
                  this.updateFieldModel(fieldModel);
                },
                addField: fieldModel => {
                  this.addField(fieldModel);
                },
                /*
                getValidationInfo: name => {
                  const fm = this.getFieldModel(name);
                  if(fm) {
                    return {valid: fm.valid, message: fm.message};
                  }
                  return null;
                },
                */
                getFieldModel: name => {
                  return this.getFieldModel(name);
                },
                getData: _ => this.getData(),
                getFieldRender: _ => this.props.fieldRender
              }
            };

        if(!context) {
          return formContext;
        }
        return Object.assign({}, context, formContext);
      },


      handleSubmit(e) {
        e.preventDefault();
        const {onSubmit} = this.props,
            data = this.getData();
        if(typeof onSubmit === "function") {
          onSubmit(data);
        }
        return false;
      },
      getFieldsMap() {
        return this.state.fields.reduce((acc, fm) => {
          acc[fm.name] = fm;
          return acc;
        }, {});
      },
      validate(fields) {
        if(!fields) return;
        let valid = true;
        fields.some(f => {
          const v = this.validateField(f);
          if(!v.valid) {
            valid = false;
            return true;
          }
        });
        return valid;
      },
      validateField(field) {
        const {rules = {}} = this.props,
            fields = this.getFieldsMap(),
            {name, value} = field,
            fieldRules = rules[name];

        let result = VALID;
        if(!fieldRules) {
          return result;
        }

        fieldRules.some(r => {
          const v = r(value, field, fields);
          if(typeof (v) !== "undefined" && !v.valid) {
            result = v;
            return true;
          }
          return false;
        });
        return result;
      },
      getData() {
        const {fields, valid, pristine} = this.state,
            [validation, data] = fields.reduce((acc, f) => {
              const [vInfo, data] = acc,
                  {name, value, valid, message, pristine} = f;
              data[name] = value;
              vInfo[name] = {valid, message, pristine};
              return acc;
            }, [{}, {}]);

        return {
          valid,
          pristine,
          validation,
          data
        };
      },
      addField(fieldModel) {
        const {fields, mounted} = this.state;
        // This is because set state before the component is mounted does not work with inferno
        if(mounted) {
          this.setState({
            fields: [...fields, fieldModel]
          });
        }else {
          if(!this.fieldModels) {
            this.fieldModels = [];
          }
          this.fieldModels.push(fieldModel);
        }
      },
      updateFieldModel(fieldModel) {
        const {onChange} = this.props,
            {name, value} = fieldModel,
            {fields} = this.state,
            {valid, message} = this.validateField(fieldModel),
            newFields = fields.map(f => {
              if(f.name === name) {
                return Object.assign({}, f, {
                  valid,
                  message,
                  pristine: false,
                  value
                });
              }
              return f;
            }),
            newState = {
              valid: valid ? this.validate(newFields) : false,
              pristine: false,
              fields: newFields
            };
        if(newState.valid) {
          newState.fields.forEach(f => {
            f.valid = true,
            f.message = "";
          });
        }
        this.setState(newState, _ => {
          onChange && onChange(this.getData());
        });
      }
    });

module.exports = {
  Form, Field, registerFieldType, fieldRender: defaultFieldRender
};
