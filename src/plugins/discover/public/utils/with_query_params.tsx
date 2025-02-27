/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useMemo } from 'react';
import { i18n } from '@kbn/i18n';
import { useLocation } from 'react-router-dom';
import { DiscoverRouteProps } from '../application/types';
import { DiscoverError } from '../components/common/error_alert';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export const withQueryParams = <P extends DiscoverRouteProps>(
  Component: React.ComponentType<P>,
  requiredParams: string[]
) => {
  return (routeProps: DiscoverRouteProps) => {
    const query = useQuery();

    const missingParamNames = useMemo(
      () => requiredParams.filter((currentParamName) => !query.get(currentParamName)),
      [query]
    );

    if (missingParamNames.length !== 0) {
      const missingParamsList = missingParamNames.join(', ');
      const errorMessage = i18n.translate('discover.discoverError.missingQueryParamsError', {
        defaultMessage: 'URL query string is missing {missingParamsList}.',
        values: { missingParamsList },
      });

      return <DiscoverError error={new Error(errorMessage)} />;
    }

    const queryProps = Object.fromEntries(
      requiredParams.map((current) => [[current], query.get(current)])
    );
    return <Component {...queryProps} {...routeProps} />;
  };
};
