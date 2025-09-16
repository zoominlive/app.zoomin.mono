const { postgres } = require('../lib/database');
const connectToDatabase = require("../models/index");
const jwt = require('jsonwebtoken');
const Sequelize = require('sequelize');

module.exports = {
  // Create a single container metric record
  createContainerMetric: async (req, res) => {
    const t = await postgres.transaction();
    try {
      const { ContainerMetrics } = await connectToDatabase();
      const { containerID, containerHostName, muxlyContainerStatus, cpuPercent, memoryPercent } = req.body;

      // Validate required fields
      if (!containerID|| !containerHostName) {
        await t.rollback();
        return res.status(400).json({ error: "Container ID and Container Host are required fields" });
      }

      // Create metric record
      const metricData = {
        container_id: containerID,
        container_host: containerHostName,
        muxly_container_status: muxlyContainerStatus || null,
        timestamp: new Date(), // Current timestamp
        cpu_percent: cpuPercent || null,
        memory_mb: memoryPercent || null
      };

      const metric = await ContainerMetrics.create(metricData, { transaction: t });
      
      await t.commit();
      return res.status(201).json({
        data: metric,
        message: "Container metric recorded successfully"
      });

    } catch (error) {
      await t.rollback();
      console.error("Error recording container metric:", error);
      return res.status(500).json({ error: error.message || "Internal server error" });
    }
  },

  getAllContainerMetrics: async (req, res) => {
    const t = await postgres.transaction();
    try {
      const { ContainerMetrics, Agent, Customers, AgentContainers } = await connectToDatabase();

      // Parse range from query (default to '24h' if not provided)
      const range = req.query.range || '24h';
      let rangeMs = 24 * 60 * 60 * 1000; // default 24h
      if (range === '1h') rangeMs = 1 * 60 * 60 * 1000;
      else if (range === '6h') rangeMs = 6 * 60 * 60 * 1000;
      else if (range === '7d') rangeMs = 7 * 24 * 60 * 60 * 1000;
      const rangeStart = new Date(Date.now() - rangeMs);

      // Check if there is any agent
      const agentExists = await Agent.findOne({ raw: true });
      if (!agentExists) {
        await t.commit();
        return res.status(200).json({ data: [], count: 0 });
      }

      // Check if there is any record in AgentContainers table
      const agentContainerExists = await AgentContainers.findOne({ raw: true });
      if (!agentContainerExists) {
        await t.commit();
        return res.status(200).json({ data: [], count: 0 });
      }

      // Fetch all agents
      const agents = await Agent.findAll({ raw: true });
      // Fetch all agent_containers and map by agent_id (pick latest by createdAt)
      const agentContainers = await AgentContainers.findAll({ raw: true, order: [['createdAt', 'DESC']] });
      const agentIdToContainer = {};
      agentContainers.forEach(ac => {
        if (!agentIdToContainer[ac.agent_id]) {
          agentIdToContainer[ac.agent_id] = ac;
        }
      });

      // Fetch all customers for company_name mapping
      const customers = await Customers.findAll({ attributes: ['transcoder_endpoint', 'company_name'], raw: true });
      const endpointToCompany = {};
      customers.forEach(cust => {
        if (cust.transcoder_endpoint) {
          let endpointHost = cust.transcoder_endpoint.replace(/^https?:\/\//, '');
          endpointHost = endpointHost.replace(/\/$/, '');
          endpointToCompany[endpointHost] = cust.company_name;
        }
      });

      // For each agent, build the tile data
      const tiles = await Promise.all(agents.map(async agent => {
        const container = agentIdToContainer[agent.agent_id];
        if (!container) return null;
        // Fetch metrics for this container_id, filtered by range
        const metrics = await ContainerMetrics.findAll({
          where: {
            container_id: container.container_id,
            timestamp: { [Sequelize.Op.gte]: rangeStart }
          },
          order: [['timestamp', 'DESC']],
          // limit: 100,
          raw: true
        });
        // Find company name by matching agent.muxly_hostname to endpointToCompany
        let company_name = null;
        if (endpointToCompany[agent.muxly_hostname]) {
          company_name = endpointToCompany[agent.muxly_hostname];
        } else {
          const hostNoPort = agent.muxly_hostname?.split(':')[0];
          if (endpointToCompany[hostNoPort]) {
            company_name = endpointToCompany[hostNoPort];
          }
        }
        return {
          id: agent.agent_id,
          label: agent.muxly_hostname,
          cpu: agent.processor || null,
          customer: company_name || null,
          memory: agent.totalRAM || null,
          upSince: agent.createdAt || null,
          region: agent.region || null,
          host: agent.hostname || null,
          onPrem: agent.onPrem || null,
          tag: container.container_version || null,
          stats: metrics.map(m => ({ time: m.timestamp, cpu: m.cpu_percent, mem: m.memory_mb }))
        };
      }));
      const filteredTiles = tiles.filter(Boolean);
      await t.commit();
      return res.status(200).json({
        data: filteredTiles,
        count: filteredTiles.length
      });

    } catch (error) {
      await t.rollback();
      console.error("Error fetching container metrics:", error);
      return res.status(500).json({ error: error.message || "Internal server error" });
    }
  },

  // Create multiple container metric records at once
  bulkCreateContainerMetrics: async (req, res) => {
    const t = await postgres.transaction();
    try {
      const { ContainerMetrics } = await connectToDatabase();
      const { metrics } = req.body;

      if (!Array.isArray(metrics) || metrics.length === 0) {
        await t.rollback();
        return res.status(400).json({ error: "Valid metrics array is required" });
      }

      // Validate and prepare each metric record
      const metricsData = metrics.map(metric => {
        if (!metric.container_id || !metric.container_host) {
          throw new Error("Container ID and Container Host are required for all metrics");
        }

        return {
          container_id: metric.container_id,
          container_host: metric.container_host,
          timestamp: metric.timestamp || new Date(),
          cpu_percent: metric.cpu_percent || null,
          memory_mb: metric.memory_mb || null
        };
      });

      const createdMetrics = await ContainerMetrics.bulkCreate(metricsData, { transaction: t });
      
      await t.commit();
      return res.status(201).json({
        count: createdMetrics.length,
        message: "Container metrics recorded successfully"
      });

    } catch (error) {
      await t.rollback();
      console.error("Error recording container metrics:", error);
      return res.status(500).json({ error: error.message || "Internal server error" });
    }
  }
};
