/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useEffect, useMemo } from 'react';
import usePrevious from 'react-use/lib/usePrevious';
import { Unit } from '@elastic/datemath';
import { EuiFlexGroup, EuiFlexItem, EuiText, EuiSpacer, EuiLoadingChart } from '@elastic/eui';
import styled from 'styled-components';
import { Type } from '@kbn/securitysolution-io-ts-alerting-types';
import * as i18n from './translations';
import { useGlobalTime } from '../../../../common/containers/use_global_time';
import { getHistogramConfig, getThresholdHistogramConfig, isNoisy } from './helpers';
import { ChartSeriesConfigs, ChartSeriesData } from '../../../../common/components/charts/common';
import { Panel } from '../../../../common/components/panel';
import { HeaderSection } from '../../../../common/components/header_section';
import { BarChart } from '../../../../common/components/charts/barchart';
import { usePreviewHistogram } from './use_preview_histogram';
import { formatDate } from '../../../../common/components/super_date_picker';
import { FieldValueThreshold } from '../threshold_input';

const LoadingChart = styled(EuiLoadingChart)`
  display: block;
  margin: 0 auto;
`;

export const ID = 'previewHistogram';

interface PreviewHistogramProps {
  timeFrame: Unit;
  previewId: string;
  addNoiseWarning: () => void;
  spaceId: string;
  threshold?: FieldValueThreshold;
  ruleType: Type;
  index: string[];
}

const DEFAULT_HISTOGRAM_HEIGHT = 300;

export const PreviewHistogram = ({
  timeFrame,
  previewId,
  addNoiseWarning,
  spaceId,
  threshold,
  ruleType,
  index,
}: PreviewHistogramProps) => {
  const { setQuery, isInitializing } = useGlobalTime();

  const from = useMemo(() => `now-1${timeFrame}`, [timeFrame]);
  const to = useMemo(() => 'now', []);
  const startDate = useMemo(() => formatDate(from), [from]);
  const endDate = useMemo(() => formatDate(to), [to]);
  const isEqlRule = useMemo(() => ruleType === 'eql', [ruleType]);
  const isThresholdRule = useMemo(() => ruleType === 'threshold', [ruleType]);

  const [isLoading, { data, inspect, totalCount, refetch, buckets }] = usePreviewHistogram({
    previewId,
    startDate,
    endDate,
    spaceId,
    threshold: isThresholdRule ? threshold : undefined,
    index,
    ruleType,
  });

  const previousPreviewId = usePrevious(previewId);

  useEffect(() => {
    if (previousPreviewId !== previewId && totalCount > 0) {
      if (isNoisy(totalCount, timeFrame)) {
        addNoiseWarning();
      }
    }
  }, [totalCount, addNoiseWarning, timeFrame, previousPreviewId, previewId]);

  useEffect((): void => {
    if (!isLoading && !isInitializing) {
      setQuery({ id: `${ID}-${previewId}`, inspect, loading: isLoading, refetch });
    }
  }, [setQuery, inspect, isLoading, isInitializing, refetch, previewId]);

  const barConfig = useMemo(
    (): ChartSeriesConfigs => getHistogramConfig(endDate, startDate, !isEqlRule),
    [endDate, startDate, isEqlRule]
  );

  const thresholdBarConfig = useMemo((): ChartSeriesConfigs => getThresholdHistogramConfig(), []);

  const chartData = useMemo((): ChartSeriesData[] => [{ key: 'hits', value: data }], [data]);

  const { thresholdChartData, thresholdTotalCount } = useMemo((): {
    thresholdChartData: ChartSeriesData[];
    thresholdTotalCount: number;
  } => {
    const total = buckets.length;
    const dataBuckets = buckets.map<{ x: string; y: number; g: string }>(
      ({ key, doc_count: docCount }) => ({
        x: key,
        y: docCount,
        g: key,
      })
    );
    return {
      thresholdChartData: [{ key: 'hits', value: dataBuckets }],
      thresholdTotalCount: total,
    };
  }, [buckets]);

  const subtitle = useMemo(
    (): string =>
      isLoading
        ? i18n.QUERY_PREVIEW_SUBTITLE_LOADING
        : isThresholdRule
        ? i18n.QUERY_PREVIEW_THRESHOLD_WITH_FIELD_TITLE(thresholdTotalCount)
        : i18n.QUERY_PREVIEW_TITLE(totalCount),
    [isLoading, totalCount, thresholdTotalCount, isThresholdRule]
  );

  return (
    <Panel height={DEFAULT_HISTOGRAM_HEIGHT} data-test-subj={'preview-histogram-panel'}>
      <EuiFlexGroup gutterSize="none" direction="column">
        <EuiFlexItem grow={1}>
          <HeaderSection
            id={`${ID}-${previewId}`}
            title={i18n.QUERY_GRAPH_HITS_TITLE}
            titleSize="xs"
            subtitle={subtitle}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={1}>
          {isLoading ? (
            <LoadingChart size="l" data-test-subj="preview-histogram-loading" />
          ) : (
            <BarChart
              configs={isThresholdRule ? thresholdBarConfig : barConfig}
              barChart={isThresholdRule ? thresholdChartData : chartData}
              data-test-subj="preview-histogram-bar-chart"
            />
          )}
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <>
            <EuiSpacer />
            <EuiText size="s" color="subdued">
              <p>{i18n.QUERY_PREVIEW_DISCLAIMER_MAX_SIGNALS}</p>
            </EuiText>
          </>
        </EuiFlexItem>
      </EuiFlexGroup>
    </Panel>
  );
};
