import React from 'react';
import { PatternFormat } from 'react-number-format';
import PropTypes from 'prop-types';

const PhoneNumberInput = React.forwardRef(function PhoneNumberInput(props, ref) {
  const { onChange, ...other } = props;

  return (
    <PatternFormat
      {...other}
      format="+1 (###) ###-####"
      mask="_"
      getInputRef={ref}
      onValueChange={(values) => {
        onChange({
          target: {
            name: props.name,
            value: values.floatValue
          }
        });
      }}
    />
  );
});

export default PhoneNumberInput;

PhoneNumberInput.propTypes = {
  name: PropTypes.string,
  onChange: PropTypes.func
};
