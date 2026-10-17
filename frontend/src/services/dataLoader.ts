import type {
  DashboardDataset,
  KPIsAndCleaningData,
  MonthlyTrend,
  MagnitudeDistribution,
  DepthDistribution,
  HourlyDistribution,
  TopRegion,
  StrongestEvent,
  MLlibMetrics,
} from '../types/seismic';

/**
 * Verified Spark SQL Query 3 hypocenter coordinates from output/quakescope_execution.log (Metric 12).
 * Allows the geographic map to accurately plot the exact coordinates recorded during the Spark run
 * without fabricating locations, while documenting the schema provenance clearly.
 */
export const SPARK_LOGGED_COORDINATES: Record<string, { lat: number; lng: number }> = {
  us6000qw60: { lat: 52.4948, lng: 160.2395 }, // Russia Earthquake (Kamchatka M8.8)
  us7000qx2g: { lat: 53.1426, lng: 160.7206 }, // Russia (Petropavlovsk-Kamchatsky M7.8)
  us7000pn9s: { lat: 22.011, lng: 95.9363 },   // Burma (Myanmar) Earthquake M7.7
  us6000rgf4: { lat: -60.1875, lng: -61.8164 }, // Drake Passage M7.6
  us7000pcdl: { lat: 17.6506, lng: -82.395 },  // Cayman Islands M7.6
  us6000rtdt: { lat: 40.9984, lng: 142.1836 }, // Japan Earthquake (Aomori M7.6)
  us6000r2xq: { lat: -60.3187, lng: -61.9221 }, // Southern Drake Passage M7.5
  us7000pwkn: { lat: -56.8094, lng: -68.1019 }, // Drake Passage M7.4
  us7000qdyl: { lat: 52.8301, lng: 160.6816 }, // Russia Earthquake (Kamchatka M7.4)
  us7000qvw5: { lat: 53.1969, lng: 160.1901 }, // Russia (Petropavlovsk-Kamchatsky M7.4)
};

/**
 * Centroid approximations for the top represented seismotectonic regions,
 * used for regional hotspots exploration.
 */
export const REGIONAL_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  Russia: { lat: 53.0, lng: 158.6 },
  Indonesia: { lat: -0.789, lng: 113.921 },
  Japan: { lat: 36.204, lng: 138.252 },
  Alaska: { lat: 64.200, lng: -149.493 },
  'Papua New Guinea': { lat: -6.314, lng: 143.955 },
  Philippines: { lat: 12.879, lng: 121.774 },
  Chile: { lat: -35.675, lng: -71.543 },
  Greece: { lat: 39.074, lng: 21.824 },
  Tonga: { lat: -21.178, lng: -175.198 },
  Argentina: { lat: -38.416, lng: -63.616 },
  'south of the Fiji Islands': { lat: -25.0, lng: 178.0 },
  Vanuatu: { lat: -15.376, lng: 166.959 },
  'South Sandwich Islands region': { lat: -57.5, lng: -26.5 },
  Ethiopia: { lat: 9.145, lng: 40.489 },
  Peru: { lat: -9.189, lng: -75.015 },
};

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, '');

async function fetchJson<T>(filename: string): Promise<T> {
  const url = `${BASE_URL}/data/${filename}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load static asset '${filename}': ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function loadDashboardData(): Promise<DashboardDataset> {
  const [
    kpisAndCleaning,
    monthlyTrends,
    magnitudeDistribution,
    depthDistribution,
    hourlyDistribution,
    topRegions,
    rawStrongestEvents,
    mllibMetrics,
  ] = await Promise.all([
    fetchJson<KPIsAndCleaningData>('kpis_and_cleaning.json'),
    fetchJson<MonthlyTrend[]>('monthly_trends.json'),
    fetchJson<MagnitudeDistribution[]>('magnitude_distribution.json'),
    fetchJson<DepthDistribution[]>('depth_distribution.json'),
    fetchJson<HourlyDistribution[]>('hourly_distribution.json'),
    fetchJson<TopRegion[]>('top_regions.json'),
    fetchJson<StrongestEvent[]>('strongest_events.json'),
    fetchJson<MLlibMetrics>('mllib_metrics.json'),
  ]);

  // Enrich strongest events with verified Spark log coordinates if available
  const strongestEvents: StrongestEvent[] = rawStrongestEvents.map((event) => {
    const coords = SPARK_LOGGED_COORDINATES[event.id];
    return {
      ...event,
      latitude: coords ? coords.lat : undefined,
      longitude: coords ? coords.lng : undefined,
    };
  });

  return {
    kpisAndCleaning,
    monthlyTrends,
    magnitudeDistribution,
    depthDistribution,
    hourlyDistribution,
    topRegions,
    strongestEvents,
    mllibMetrics,
  };
}
