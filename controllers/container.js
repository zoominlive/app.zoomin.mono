// Controller for container management endpoints
// filepath: controllers/container.js

const axios = require('axios');

exports.restartContainer = async (req, res) => {
  try {
    const { domain } = req.body;
    const response = await axios.post(`${domain}/api/container/restart`);
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.response?.data || err.message });
  }
};

exports.updateContainerImage = async (req, res) => {
  try {
    const { url, config } = req.body;
    console.log(`Updating container image at ${url} with config:`, config);
    const response = await axios.post(`${url}/api/container/run-image`, { config });
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.response?.data || err.message });
  }
};

exports.updateMuxlyHostname = async (req, res) => {
  try {
    const { hostname, url } = req.body;
    const response = await axios.post(`${url}/api/update-muxly-hostname`, { hostname: hostname });
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.response?.data || err.message });
  }
};

exports.updateContainerConfig = async (req, res) => {
  try {
    const { url, config } = req.body;
    const response = await axios.post(`${url}/api/container/update-config`, { config });
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.response?.data || err.message });
  }
};
