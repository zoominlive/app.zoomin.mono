import API from '../api';

export const fetchContainerMetrics = async (params = {}) => {
  try {
    const response = await API.get('agents/metrics/get-container-metrics', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch container metrics:', error);
    return [];
  }
};
