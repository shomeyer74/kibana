/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { API_URLS } from '../../../common/constants';
import {
  FetchMonitorManagementListQueryArgs,
  MonitorManagementListResultCodec,
  MonitorManagementListResult,
  ServiceLocations,
  SyntheticsMonitor,
  ServiceLocationsApiResponseCodec,
} from '../../../common/runtime_types';
import { SyntheticsMonitorSavedObject } from '../../../common/types';
import { apiService } from './utils';

export const setMonitor = async ({
  monitor,
  id,
}: {
  monitor: SyntheticsMonitor;
  id?: string;
}): Promise<SyntheticsMonitorSavedObject> => {
  if (id) {
    return await apiService.put(`${API_URLS.SYNTHETICS_MONITORS}/${id}`, monitor);
  } else {
    return await apiService.post(API_URLS.SYNTHETICS_MONITORS, monitor);
  }
};

export const getMonitor = async ({ id }: { id: string }): Promise<SyntheticsMonitorSavedObject> => {
  return await apiService.get(`${API_URLS.SYNTHETICS_MONITORS}/${id}`);
};

export const deleteMonitor = async ({ id }: { id: string }): Promise<void> => {
  return await apiService.delete(`${API_URLS.SYNTHETICS_MONITORS}/${id}`);
};

export const fetchMonitorManagementList = async (
  params: FetchMonitorManagementListQueryArgs
): Promise<MonitorManagementListResult> => {
  return await apiService.get(
    API_URLS.SYNTHETICS_MONITORS,
    params,
    MonitorManagementListResultCodec
  );
};

export const fetchServiceLocations = async (): Promise<ServiceLocations> => {
  const { locations } = await apiService.get(
    API_URLS.SERVICE_LOCATIONS,
    undefined,
    ServiceLocationsApiResponseCodec
  );
  return locations;
};
