export interface CleaningReconciliation {
  original_rows: number;
  duplicate_rows_removed: number;
  missing_essential_fields: number;
  invalid_timestamps: number;
  invalid_coordinates: number;
  invalid_magnitude: number;
  invalid_depth_subsurface: number;
  excluded_non_earthquake: number;
  total_excluded: number;
  cleaned_retained_rows: number;
  retained_missing_optional_quality: number;
  reconciliation_balanced: boolean;
}

export interface OverallKPIs {
  total_events: number;
  min_magnitude: number;
  max_magnitude: number;
  avg_magnitude: number;
  stddev_magnitude: number;
  min_depth_km: number;
  max_depth_km: number;
  avg_depth_km: number;
  stddev_depth_km: number;
}

export interface KPIsAndCleaningData {
  project: string;
  stage: string;
  generated_at: string;
  environment: {
    spark_version: string;
    scala_version: string;
    java_version: string;
    dataset_path: string;
  };
  cleaning_reconciliation: CleaningReconciliation;
  overall_kpis: OverallKPIs;
}

export interface MonthlyTrend {
  year_month: string;
  event_count: number;
  avg_mag: number;
  max_mag: number;
  avg_depth_km: number;
  period_note: string;
}

export interface MagnitudeDistribution {
  category: string;
  count: number;
  percentage: number;
  avg_mag: number;
  avg_depth: number;
}

export interface DepthDistribution {
  category: string;
  count: number;
  percentage: number;
  min_depth_km: number;
  max_depth_km: number;
  avg_depth_km: number;
  avg_mag: number;
}

export interface HourlyDistribution {
  hour_utc: number;
  event_count: number;
  avg_mag: number;
}

export interface TopRegion {
  region: string;
  event_count: number;
  pct_of_global: number;
  avg_mag: number;
  max_mag: number;
  avg_depth_km: number;
}

export interface StrongestEvent {
  id: string;
  event_date: string;
  time: string;
  mag: number;
  magType: string;
  depth: number;
  region: string;
  place: string;
  latitude?: number;
  longitude?: number;
}

export interface ClassMetric {
  class_name: string;
  class_index: number;
  precision: number;
  recall: number;
  f1_score: number;
}

export interface MLlibMetrics {
  model_type: string;
  target_column: string;
  input_features: string[];
  training_records: number;
  test_records: number;
  split_ratio: string;
  random_seed: number;
  tree_depth: number;
  tree_num_nodes: number;
  evaluation_metrics: {
    test_accuracy: number;
    majority_baseline_accuracy: number;
    balanced_accuracy: number;
    weighted_precision: number;
    weighted_recall: number;
    weighted_f1_score: number;
    macro_f1_score: number;
  };
  class_metrics: ClassMetric[];
  confusion_matrix: {
    labels: string[];
    matrix_rows_actual: number[][];
  };
}

export interface DashboardDataset {
  kpisAndCleaning: KPIsAndCleaningData;
  monthlyTrends: MonthlyTrend[];
  magnitudeDistribution: MagnitudeDistribution[];
  depthDistribution: DepthDistribution[];
  hourlyDistribution: HourlyDistribution[];
  topRegions: TopRegion[];
  strongestEvents: StrongestEvent[];
  mllibMetrics: MLlibMetrics;
}
