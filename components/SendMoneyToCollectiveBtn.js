import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { get, pick } from 'lodash';
import { FormattedMessage, injectIntl } from 'react-intl';

import { formatCurrency } from '../lib/currency-utils';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';
import { compose } from '../lib/utils';

import Container from './Container';
import { Flex } from './Grid';
import StyledButton from './StyledButton';

class SendMoneyToCollectiveBtn extends React.Component {
  static propTypes = {
    amount: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    description: PropTypes.string,
    fromCollective: PropTypes.object.isRequired,
    toCollective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    data: PropTypes.object,
    sendMoneyToCollective: PropTypes.func,
    confirmTransfer: PropTypes.func,
    isTransferApproved: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
    this.state = {};
  }

  componentDidUpdate(prevProps) {
    if (this.props.isTransferApproved !== prevProps.isTransferApproved) {
      this.onClick();
    }
  }

  async onClick() {
    const { currency, amount, fromCollective, toCollective, description, data, LoggedInUser } = this.props;
    if (!LoggedInUser || !LoggedInUser.canEditCollective(fromCollective) || !get(data, 'account')) {
      return;
    }
    const paymentMethods = get(data, 'account.paymentMethods');
    if (!paymentMethods || paymentMethods.length === 0) {
      const error = "We couldn't find a payment method to make this transaction";
      this.setState({ error });
      return;
    }
    this.setState({ loading: true });
    const order = {
      amount: { valueInCents: amount, currency },
      toAccount: pick(toCollective, ['slug']),
      fromAccount: pick(fromCollective, ['slug']),
      description,
      paymentMethod: { id: paymentMethods[0].id },
      frequency: 'ONETIME',
      isBalanceTransfer: true,
    };
    try {
      await this.props.sendMoneyToCollective({
        variables: { order },
        // We need to update the store manually because the response comes from API V2
        update: (store, { data: { createOrder } }) => {
          const balance = createOrder.order.fromAccount.stats.balance.valueInCents;
          store.writeFragment({
            fragment: collectiveBalanceFragment,
            id: `CollectiveStatsType:${fromCollective.id}`,
            data: { balance },
          });
        },
      });
      this.setState({ loading: false });
    } catch (e) {
      const error = e.message;
      this.setState({ error, loading: false });
    }
  }

  render() {
    const { amount, currency, toCollective, intl } = this.props;
    const { locale } = intl;
    return (
      <div className="SendMoneyToCollectiveBtn">
        <Flex justifyContent="center" mb={1}>
          <StyledButton onClick={this.props.confirmTransfer || this.onClick}>
            {this.state.loading && <FormattedMessage id="form.processing" defaultMessage="processing" />}
            {!this.state.loading && (
              <FormattedMessage
                id="SendMoneyToCollective.btn"
                defaultMessage="Send {amount} to {collective}"
                values={{
                  amount: formatCurrency(amount, currency, locale),
                  collective: toCollective.name,
                }}
              />
            )}
          </StyledButton>
        </Flex>
        {this.state.error && <Container fontSize="1.1rem">{this.state.error}</Container>}
      </div>
    );
  }
}

const paymentMethodsQuery = gqlV2/* GraphQL */ `
  query SendMoneyToCollectivePaymentMethods($slug: String) {
    account(slug: $slug) {
      id
      paymentMethods(service: OPENCOLLECTIVE, enumType: COLLECTIVE) {
        id
        service
        name
      }
    }
  }
`;

const addPaymentMethodsData = graphql(paymentMethodsQuery, {
  options: props => ({
    context: API_V2_CONTEXT,
    variables: {
      slug: get(props, 'fromCollective.slug'),
    },
  }),
  skip: props => {
    return !props.LoggedInUser;
  },
});

const collectiveBalanceFragment = gql`
  fragment StatFieldsFragment on CollectiveStatsType {
    id
    balance
  }
`;

const sendMoneyToCollectiveMutation = gqlV2/* GraphQL */ `
  mutation SendMoneyToCollective($order: OrderCreateInput!) {
    createOrder(order: $order) {
      order {
        id
        fromAccount {
          id
          stats {
            id
            balance {
              valueInCents
            }
          }
        }
      }
    }
  }
`;

const addSendMoneyToCollectiveMutation = graphql(sendMoneyToCollectiveMutation, {
  name: 'sendMoneyToCollective',
  options: { context: API_V2_CONTEXT },
});

const addGraphql = compose(addPaymentMethodsData, addSendMoneyToCollectiveMutation);

export default addGraphql(injectIntl(SendMoneyToCollectiveBtn));
