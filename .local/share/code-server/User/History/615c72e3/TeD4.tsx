import { Flex, Stack, Text } from '@chakra-ui/react';
import { animated, useSpring } from '@react-spring/web';
import { ErrorMessage, Field, FieldProps, useFormikContext } from 'formik';
import React, { useCallback, useState } from 'react';

import { useStep } from '../context/StepCountContext';
import Label from './Label';
import TextError from './TextError';

type option = {
  value: string;
  key: string;
};

interface RadioGroupProps {
  label: string;
  name: string;
  options: option[];
}

const RadioButtons: React.FC<RadioGroupProps> = (props) => {
  const { label, name, options } = props;
  const { setFieldValue, submitForm } = useFormikContext();
  const { incrementStep } = useStep();
  const [inputVal, setInputVal] = useState('');

  const drop = useSpring({
    from: { top: '1000px', opacity: 0 },
    to: { top: '0px', opacity: 1 },
    config: { friction: 20 },
  });

  const handleRadioChange = useCallback(
    async (
      event: React.ChangeEvent<HTMLInputElement> & MouseEvent,
      fieldName: string,
      isCustomInput?: boolean,
    ) => {
      const selectedValue = (event as React.ChangeEvent<HTMLInputElement>).target.value;
      await setFieldValue(fieldName, selectedValue);

      if (isCustomInput) {
        setInputVal(isCustomInput ? '' : selectedValue);
      }
      if (selectedValue.includes('.redirect')) {
        submitForm();
      } else {
        incrementStep();
      }
    },
    [setFieldValue, submitForm, incrementStep],
  );
  return (
    <Flex
      className="form-control"
      textAlign={'center'}
      direction="column"
      gap="2rem"
      paddingX="1rem"
    >
      <animated.span style={drop}>
        <Label>{label}</Label>
      </animated.span>
      <Stack direction="row" alignItems={'center'} alignSelf="center">
        <Field name={name}>
          {({ field }: FieldProps) => {
            return options.map((option) => {
              return (
                <Flex
                  key={option.key}
                  alignItems="center"
                  minW={'30%'}
                  textAlign="center"
                  justifyContent="center"
                  _hover={{ boxShadow: '0px 3px 10px -2px hsla(150, 5%, 65%, 0.5)' }}
                  minWidth={100}
                >
                  {/* <input
                    type="radio"
                    id={option.value}
                    name={name}
                    readOnly={false}
                    value={option.value}
                    checked={field.value === option.value}
                    onClick={(e) => handleRadioChange(e, name)}
                  /> */}
                  {option.isCustomInput ? (
                    <input
                      value={inputVal}
                      placeholder="Enter"
                      style={{ marginRight: '8px' }}
                    />
                  ) : (
                    <input
                      type="radio"
                      id={option.value}
                      name={name}
                      readOnly={false}
                      value={option.value}
                      checked={field.value === option.value}
                      onChange={(e) => handleRadioChange(e, name, option.isCustomInput)}
                      style={{ marginRight: '8px' }}
                    />
                  )}
                  <label
                    className="radio-label"
                    style={{
                      color: 'white',
                      width: '100%',
                      boxShadow: 'none',
                      margin: 0,
                      paddingLeft: 8,
                      paddingRight: 8,
                    }}
                    htmlFor={option.value}
                  >
                    <Text
                      fontSize={{
                        base: '13px',
                        md: '18px',
                        lg: '18px',
                      }}
                      _hover={{
                        cursor: 'pointer',
                      }}
                    >
                      {option.key}
                    </Text>
                  </label>
                </Flex>
              );
            });
          }}
        </Field>
      </Stack>
      <ErrorMessage component={TextError} name={name} />
    </Flex>
  );
};

export default RadioButtons;
