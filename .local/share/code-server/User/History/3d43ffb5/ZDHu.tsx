import { Box } from '@chakra-ui/react';
import { ErrorMessage, Field, FieldProps } from 'formik';
import React from 'react';

import Label from './Label';
import TextError from './TextError';

type option = {
  value: string;
  key: string;
};

interface CheckBoxGroupProps {
  label: string;
  name: string;
  options: option[];
}

const CheckboxGroup: React.FC<CheckBoxGroupProps> = (props) => {
  const { label, name, options, ...rest } = props;
  return (
    <Box className="form-control">
      <Label>{label}</Label>
      <Field name={name}>
        {({ field }: FieldProps) => {
          return options.map((option) => {
            return (
              <Box key={option.key}>
                <input
                  type="checkbox"
                  id={option.value}
                  {...field}
                  {...rest}
                  value={option.value}
                  checked={field.value.includes(option.value)}
                />
                <label style={{ color: 'white' }} htmlFor={option.value}>
                  {option.key}
                </label>
              </Box>
            );
          });
        }}
      </Field>
      <ErrorMessage name={name} component={TextError} />
    </Box>
  );
};

export default CheckboxGroup;
