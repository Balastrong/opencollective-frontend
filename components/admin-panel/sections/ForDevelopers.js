import React from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';
import { getSettingsRoute } from '../../../lib/url-helpers';

import Avatar from '../../Avatar';
import { Box, Flex, Grid } from '../../Grid';
import Link from '../../Link';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import CreateOauthApplicationModal from '../../oauth/CreateOauthApplicationModal';
import Pagination from '../../Pagination';
import StyledButton from '../../StyledButton';
import StyledHr from '../../StyledHr';
import { H3, P } from '../../Text';

const applicationsQuery = gqlV2/* GraphQL */ `
  query ApplicationsQuery($slug: String!, $limit: Int, $offset: Int) {
    account(slug: $slug) {
      id
      name
      slug
      type
      imageUrl(height: 128)
      applications(type: OAUTH, limit: $limit, offset: $offset) {
        totalCount
        nodes {
          id
          name
        }
      }
    }
  }
`;

const ForDevelopers = ({ accountSlug }) => {
  const router = useRouter() || {};
  const query = router.query;
  const variables = { slug: accountSlug, limit: 12, offset: query.offset ? parseInt(query.offset) : 0 };
  const { data, loading, error } = useQuery(applicationsQuery, { variables, context: API_V2_CONTEXT });
  const [showCreateApplicationModal, setShowCreateApplicationModal] = React.useState(false);

  return (
    <div>
      <Flex width="100%" alignItems="center">
        <H3 fontSize="18px" fontWeight="700">
          <FormattedMessage defaultMessage="OAuth Apps" />
        </H3>
        <StyledHr mx={2} flex="1" borderColor="black.400" />
        <StyledButton buttonSize="tiny" onClick={() => setShowCreateApplicationModal(true)}>
          + <FormattedMessage defaultMessage="Create OAuth app" />
        </StyledButton>
        {showCreateApplicationModal && (
          <CreateOauthApplicationModal onClose={() => setShowCreateApplicationModal(false)} />
        )}
      </Flex>
      <P my={2} color="black.700">
        <FormattedMessage defaultMessage="You can register new apps that you developed using Open Collective's API." />
      </P>
      <Box my={4}>
        {error ? (
          <MessageBoxGraphqlError error={error} />
        ) : (
          <Grid gridTemplateColumns={['1fr', null, null, '1fr 1fr', '1fr 1fr 1fr']} gridGap="46px">
            {loading
              ? Array.from({ length: variables.limit }, (_, index) => <LoadingPlaceholder key={index} height="64px" />)
              : data.account.applications.nodes.map(app => (
                  <Flex key={app.id} alignItems="center">
                    <Box mr={24}>
                      <Avatar radius={64} collective={data.account} />
                    </Box>
                    <Flex flexDirection="column">
                      <P fontSize="18px" lineHeight="26px" fontWeight="500" color="black.900">
                        {app.name}
                      </P>
                      <P mt="10px" fontSize="14px">
                        <Link href={getSettingsRoute(data.account, `for-developers/oauth/${app.id}`)}>
                          <FormattedMessage id="Settings" defaultMessage="Settings" />
                        </Link>
                      </P>
                    </Flex>
                  </Flex>
                ))}
          </Grid>
        )}
      </Box>
      {data?.account?.applications?.totalCount > variables.limit && (
        <Flex mt={5} justifyContent="center">
          <Pagination
            total={data.account.applications.totalCount}
            limit={variables.limit}
            offset={variables.offset}
            ignoredQueryParams={['slug', 'section']}
            scrollToTopOnChange
          />
        </Flex>
      )}
    </div>
  );
};

ForDevelopers.propTypes = {
  accountSlug: PropTypes.string.isRequired,
};

export default ForDevelopers;
