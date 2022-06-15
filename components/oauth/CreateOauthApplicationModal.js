import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { Form, Formik } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import { Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import StyledTextarea from '../StyledTextarea';

const createApplicationMutation = gqlV2/* GraphQL */ `
  mutation CreateApplication($application: ApplicationCreateInput!) {
    createApplication(application: $application) {
      id
      name
    }
  }
`;

const LABEL_STYLES = { fontWeight: 700, fontSize: '14px', lineHeight: '17px' };

const CreateOauthApplicationModal = props => {
  const [createApplication] = useMutation(createApplicationMutation, { context: API_V2_CONTEXT });
  const intl = useIntl();
  return (
    <StyledModal width="576px" {...props}>
      <ModalHeader>
        <FormattedMessage defaultMessage="Create OAuth app" />
      </ModalHeader>
      <Formik>
        {() => (
          <Form>
            <ModalBody mt="36px">
              <StyledInputFormikField
                name="name"
                label={intl.formatMessage({ defaultMessage: 'Name of the app' })}
                labelProps={LABEL_STYLES}
              >
                {({ field }) => (
                  <StyledInput
                    {...field}
                    placeholder={intl.formatMessage(
                      { id: 'examples', defaultMessage: 'e.g., {examples}' },
                      { examples: 'Back Your Stack' },
                    )}
                  />
                )}
              </StyledInputFormikField>
              <StyledInputFormikField
                name="description"
                label={intl.formatMessage({ id: 'Fields.description', defaultMessage: 'Description' })}
                hint={intl.formatMessage({
                  defaultMessage: 'A short description of your app so users know what it does.',
                })}
                labelProps={LABEL_STYLES}
                mt={20}
              >
                {({ field }) => (
                  <StyledTextarea
                    {...field}
                    height="98px"
                    resize="none"
                    placeholder={intl.formatMessage({
                      id: 'oauthApp.descriptionPlaceholder',
                      defaultMessage:
                        'Discover the Open Source projects your organization is using that need financial support.',
                    })}
                  />
                )}
              </StyledInputFormikField>
              <StyledInputFormikField
                name="callbackUrl"
                label={intl.formatMessage({ defaultMessage: 'Callback URL' })}
                labelProps={LABEL_STYLES}
                mt={20}
              >
                {({ field }) => <StyledInput {...field} type="url" placeholder="http://example.com/path" />}
              </StyledInputFormikField>
            </ModalBody>
            <ModalFooter>
              <Flex gap="16px" justifyContent="center">
                <StyledButton
                  type="submit"
                  buttonStyle="primary"
                  buttonSize="small"
                  onClick={() => createApplication()}
                >
                  <FormattedMessage defaultMessage="Create app" />
                </StyledButton>
                <StyledButton type="button" buttonStyle="secondary" buttonSize="small" onClick={() => props.onClose()}>
                  <FormattedMessage defaultMessage="Cancel" />
                </StyledButton>
              </Flex>
            </ModalFooter>
          </Form>
        )}
      </Formik>
    </StyledModal>
  );
};

CreateOauthApplicationModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default CreateOauthApplicationModal;
