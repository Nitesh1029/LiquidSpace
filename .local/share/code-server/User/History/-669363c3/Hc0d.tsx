import { Flex, Stack, Text } from '@chakra-ui/react';
import { animated, useSpring } from '@react-spring/web';
import { ErrorMessage, Field, FieldProps, useFormikContext } from 'formik';
import React, { useCallback } from 'react';

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

  const drop = useSpring({
    from: { top: '1000px', opacity: 0 },
    to: { top: '0px', opacity: 1 },
    config: { friction: 20 },
  });

  const handleRadioChange = useCallback(
    async (
      event: React.ChangeEvent<HTMLInputElement> & MouseEvent,
      fieldName: string,
    ) => {
      const selectedValue = event.target.value;
      await setFieldValue(fieldName, selectedValue);
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
                  <input
                    type="radio"
                    id={option.value}
                    name={name}
                    readOnly={false}
                    value={option.value}
                    checked={field.value === option.value}
                    onClick={(e) => handleRadioChange(e, name)}
                  />
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








import { Flex, Input, Text } from '@chakra-ui/react';
import { animated, useSpring } from '@react-spring/web';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import { PersistFormikValues } from 'formik-persist-values';
import React, { useCallback, useEffect, useState } from 'react';
import isEmailValidator from 'validator/lib/isEmail';
import * as Yup from 'yup';

import { useStep } from '../context/StepCountContext';
import Dropdown from './Dropdown';
import RadioButtons from './RadioButtons';
import SuccessAnimation from './SuccessAnimation';

type Option = {
  label: string;
  value: string;
};

type initialType = {
  dropdown: string;
  email: string;
  radioOption: string;
  reachOut: string;
  customInput: string;
};

const NewForm = () => {
  const { currentStep, incrementStep } = useStep();
  const [submitAnimation, setSubmitAnimation] = useState(false);

  const [drop, api] = useSpring(() => ({
    from: { marginTop: '-1000px', opacity: 0 },
    to: { marginTop: '-0px', opacity: 1 },
    config: { friction: 20 },
  }));

  useEffect(() => {
    api.start({
      from: { marginTop: '-1000px', opacity: 0 },
      to: { marginTop: '-0px', opacity: 1 },
      config: { friction: 20 },
    });
  }, [currentStep, api]);

  const dropdownOptions: Option[] = [
    { label: 'Tally ERP', value: 'tally' },
    { label: 'Oracle', value: 'oracleIndia' },
    { label: 'Ramco Systems', value: 'ramcoSystems' },
    { label: 'Epicor Software Corporation', value: 'epicor' },
    { label: 'Zoho', value: 'zoho' },
    { label: 'SAP', value: 'sap' },
    { label: 'Oracle', value: 'oracle' },
    { label: '3PL Central', value: '3plCentral' },
    { label: 'Manhattan Associates', value: 'manhattanAssociates' },
    { label: 'JDA Software', value: 'jdaSoftware' },
    { label: 'Blue Yonder', value: 'blueYonder' },
    { label: 'HighJump', value: 'highJump' },
  ];
  const radioOptions = [
    //1
    { key: 'Food & Beverage', value: 'Food & Beverage' },
    {
      key: 'Clothing & Apparel',
      value: 'Clothing & Apparel',
    },
    {
      key: 'Electronics',
      value: 'Electronics',
    },
    {
      key: 'Pharmaceuticals',
      value: 'Pharmaceuticals',
    },
    {
      key: 'Others',
      value: 'Others',
    },
    //2
    { key: '_____', value: '_____' },
    {
      key: '_____',
      value: '_____',
    },
    {
      key: '_____',
      value: '_____',
    },
    {
      key: '_____',
      value: '_____',
    },
    {
      key: 'Others',
      value: 'Others',
    },
    //3
    { key: 'Centralised distribution', value: 'Centralised distribution' },
    {
      key: 'Cost Improved Inventory management',
      value: 'Cost Improved Inventory management',
    },
    {
      key: 'Improved Inventory management',
      value: 'Improved Inventory management',
    },
    {
      key: 'Faster Delivery Times',
      value: 'Faster Delivery Times',
    },
    {
      key: 'Others',
      value: 'Others',
    },
    //4
    { key: '0-500', value: '0-500' },
    {
      key: '500-1000',
      value: '500-1000',
    },
    {
      key: '1000-2000',
      value: '1000-2000',
    },
    {
      key: '2000-5000',
      value: '2000-5000',
    },
    {
      key: '5000 & Above',
      value: '5000 & Above',
    },
    //5
    { key: 'Seasonal Requirement', value: 'Seasonal Requirement' },
    {
      key: 'Adhoc',
      value: 'Adhoc',
    },
    {
      key: 'Dynamic',
      value: 'Dynamic',
    },
    {
      key: 'Fixed/Long term',
      value: 'Fixed/Long term',
    },
    {
      key: 'Others',
      value: 'Others',
    },
    //6
    { key: '_____', value: '_____' },
    //7
    { key: 'CCTV surveillance', value: 'CCTV surveillance' },
    {
      key: 'Stock maintenance',
      value: 'Stock maintenance',
    },
    {
      key: 'Monthly reconciliation',
      value: 'Monthly reconciliation',
    },
    {
      key: 'Insurance tie up',
      value: 'Insurance tie up',
    },
    {
      key: 'Technology Integration',
      value: 'Technology Integration',
    },
    {
      key: '24/7 access',
      value: '24/7 access',
    },
  ];

  const options1 = radioOptions.slice(0, 5);
  const options2 = radioOptions.slice(5, 10).map((option) => {
    if (option.key === '_____' || option.key === 'others') {
      return { ...option, isCustomInput: true };
    }
    return option;
  });
  const options3 = radioOptions.slice(10, 15);
  const options4 = radioOptions.slice(15, 20);
  const options5 = radioOptions.slice(20, 25);
  const options6 = radioOptions.slice(25, 26);
  const options7 = radioOptions.slice(26, 32);

  const initialValues: initialType = {
    dropdown: '',
    radioOption: '',
    email: '',
    reachOut: '',
    customInput: '',
  };

  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Enter a valid email')
      .when('reachOut', {
        is: (reachOut: string) => reachOut === 'true',
        then: Yup.string()
          .required('Email is required')
          .test('is-valid', 'Invalid email address', (value) =>
            value ? isEmailValidator(value) : true,
          ) as any,
      }),
    customInput: Yup.string().when(['reachOut', 'radioOption'], {
      is: (values: string[]) => values[0] === 'true' && values[1] === 'others',
      then: Yup.string().required('Custom input is required') as any,
    }),
  });

  const onSubmit = useCallback(
    async (values: initialType) => {
      try {
        setSubmitAnimation(true);
        const response = await fetch('https://api-staging.storewise.in/lead_create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(values),
        });

        if (!response.ok) {
          console.log(response.status);
        }

        setTimeout(() => {
          window.location = 'https://storewise.in';
        }, 2000);
      } catch (e) {
        setTimeout(() => {
          window.location = 'https://storewise.in';
        }, 2000);
      }
    },
    [submitAnimation],
  );

  return (
    <>
      {submitAnimation ? (
        <SuccessAnimation />
      ) : (
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {({ values, errors, touched }) => (
            <Form style={{ width: '100%' }}>
              <Flex direction="column" alignItems="center" gap="6rem">
                {currentStep === 1 && (
                  <animated.span style={drop}>
                    <Flex direction="column" gap="2rem">
                      <Dropdown
                        prompt="-- Select your ERP --"
                        onChange={() => incrementStep()}
                        name="dropdown"
                        label="dropdown"
                        options={dropdownOptions}
                      />
                    </Flex>
                  </animated.span>
                )}

                {currentStep === 2 && (
                  <>
                    <animated.span style={drop}>
                      <RadioButtons
                        label="Type of Product"
                        name="radioOption"
                        options={options1}
                      />
                    </animated.span>
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    <animated.span style={drop}>
                      <RadioButtons
                        label="All Locations of Business"
                        name="radioOption"
                        options={options2}
                      />
                    </animated.span>
                    {/* {values.radioOption === 'others' && values.reachOut === 'true' && (
                      <Flex direction="column" alignItems="center" gap="2rem">
                        <Field
                          as={Input}
                          render={({ field }) => (
                            <Input
                              {...field}
                              type="text"
                              _focusVisible={{ borderWidth: 0 }}
                              borderWidth={0}
                              color="white"
                              width={{ base: '400px', md: '700px' }}
                              height={{ base: '50px', md: '60px', lg: '65px' }}
                              fontSize={{ base: '18px', md: '24px', lg: '28px' }}
                              placeholder="Enter your custom input here"
                            />
                          )}
                          type="text"
                          name="customInput"
                        />
                        {touched.customInput && errors.customInput && (
                          <ErrorMessage component="div" name="customInput" />
                        )}
                        {!errors.customInput && (
                          <Text color={'#eeeee4'}>
                            That looks good! Press <b>Enter</b> to submit
                          </Text>
                        )}
                      </Flex>
                    )} */}
                  </>
                )}

                {currentStep === 4 && (
                  <>
                    <animated.span style={drop}>
                      <RadioButtons
                        label="Key Requirement From a Central Warehouse"
                        name="radioOption"
                        options={options3}
                      />
                    </animated.span>
                  </>
                )}

                {currentStep === 5 && (
                  <>
                    <animated.span style={drop}>
                      <RadioButtons
                        label="Size Requirements for Warehouse"
                        name="radioOption"
                        options={options4}
                      />
                    </animated.span>
                  </>
                )}

                {currentStep === 6 && (
                  <>
                    <animated.span style={drop}>
                      <RadioButtons
                        label="Preferred Lease Duration"
                        name="radioOption"
                        options={options5}
                      />
                    </animated.span>
                  </>
                )}

                {currentStep === 7 && (
                  <>
                    <animated.span style={drop}>
                      <RadioButtons
                        label="Typical Delivery Frequency"
                        name="radioOption"
                        options={options6}
                      />
                    </animated.span>
                  </>
                )}

                {currentStep === 8 && (
                  <>
                    <animated.span style={drop}>
                      <RadioButtons
                        label="Desired Amenties"
                        name="radioOption"
                        options={options7}
                      />
                    </animated.span>
                  </>
                )}

                {currentStep === 9 && (
                  <animated.span style={drop}>
                    <Flex gap="6rem" direction="column">
                      {values.reachOut === 'true' && (
                        <Flex direction="column" alignItems="center" gap="2rem">
                          <Field
                            as={Input}
                            render={({ field }) => {
                              return (
                                <Input
                                  {...field}
                                  type={'email'}
                                  _focusVisible={{ borderWidth: 0 }}
                                  borderWidth={0}
                                  color="white"
                                  width={{ base: '400px', md: '700px' }}
                                  height={{ base: '50px', md: '60px', lg: '65px' }}
                                  fontSize={{ base: '18px', md: '24px', lg: '28px' }}
                                  placeholder="Enter your email here"
                                />
                              );
                            }}
                            type="email"
                            name="email"
                          />
                          {touched.email && errors.email && (
                            <ErrorMessage component="div" name="email" />
                          )}
                          {!errors.email && (
                            <Text color={'#eeeee4'}>
                              That looks good! Press <b>Enter</b> to submit
                            </Text>
                          )}
                        </Flex>
                      )}
                    </Flex>
                  </animated.span>
                )}
              </Flex>
              <PersistFormikValues
                name="actualization-lead-form"
                storage="sessionStorage"
                persistInvalid={true}
              />
            </Form>
          )}
        </Formik>
      )}
    </>
  );
};

export default NewForm;