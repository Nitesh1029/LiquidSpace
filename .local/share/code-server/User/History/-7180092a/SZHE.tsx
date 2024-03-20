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
};

const FormContainer = () => {
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
    { key: 'Yes ! ', value: 'Yes.redirect' },
    {
      key: 'No, it can slow down operations',
      value: 'No',
    },
  ];

  const initialValues: initialType = {
    dropdown: '',
    radioOption: '',
    email: '',
    reachOut: '',
  };

  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Enter a valid email')
      .when('reachOut', {
        is: 'true',
        then: (schema) =>
          schema
            .required('Email is required')
            .test('is-valid', 'Invalid email address', (value) =>
              value ? isEmailValidator(value) : true,
            ),
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
                        label="Do you want to get more visibility in your warehouse operations?"
                        name="radioOption"
                        options={radioOptions}
                      />
                    </animated.span>
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    <animated.span style={drop}>
                      <RadioButtons
                        label="Okay, get on a call to show you how we do it?"
                        name="reachOut"
                        options={[
                          { key: 'Yes', value: 'true' },
                          { key: 'No', value: 'false.redirect' },
                        ]}
                      />
                    </animated.span>
                  </>
                )}

                {currentStep === 4 && (
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
            </Form>
          )}
        </Formik>
      )}
    </>
  );
};

export default FormContainer;
