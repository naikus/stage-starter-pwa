const stringValue = value => value === null || typeof(value) === "undefined" ? "" : String(value),
    invalid = message => ({valid: false, message}),
    Rules = {
      required(value, field) {
        let val = stringValue(value), {trim = true} = this;
        if(trim) {
          val = val.trim();
        }
        if(!val) {
          const message = this.message || `${field.label} is required`;
          return invalid(message);
        }
      },
      length(value, field) {
        const {min, max} = this,
            val = stringValue(value),
            len = val.length;
        if(min && len < min) {
          const message =
              this.message || `${field.label} must be a minimum of ${min} characters`;
          return invalid(message);
        }
        if(max && len > max) {
          const message =
              this.message || `${field.label} must be a maxinum of ${max} characters`;
          return invalid(message);
        }
      },
      number(value, field) {
        const {min = Number.MIN_VALUE, max = Number.MAX_VALUE} = this,
            strVal = stringValue(value),
            val = Number(strVal);
        if(isNaN(val) || val < min || val > max) {
          const message = this.message || `${field.label} is an invalid number`;
          return invalid(message);
        }
      },
      email(value, field) {
        const reEmail = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-zA-Z]{2,6}(?:\.[a-zA-Z]{2,3})?)$/,
            val = stringValue(value);
        if(!reEmail.test(val)) {
          const message = this.message || `${field.label} must be a valid email`;
          return invalid(message);
        }
      },
      fieldCompare(value, field, fields) {
        const other = fields[this.field];
        if(other.value !== value) {
          const message = this.message || `${field.label} must be same as ${other.label}`;
          return invalid(message);
        }else {
          other.valid = true;
        }
      },
      pattern(value, field) {
        const regExp = this.pattern, val = stringValue(value);
        if(!regExp.test(val)) {
          const message = this.message || `${field.label} must match pattern: ${regExp}`;
          return invalid(message);
        }
      }
    };

module.exports = {
  Rules,
  rb: (name, options = {}) => {
    const r = Rules[name];
    return (...args) => {
      return r.call(options, ...args);
    };
  }
};
