const { postgres } = require('../lib/database');
const connectToDatabase = require("../models/index");
const jwt = require('jsonwebtoken');

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
    const { ContainerMetrics, Agent } = await connectToDatabase();

    // Fetch all metrics (no query params for filtering/pagination)
    const metrics = await ContainerMetrics.findAll({
      order: [['timestamp', 'DESC']],
      limit: 10 // Limit to the last 1000 records
    });

    // Fetch all agents
    const agents = await Agent.findAll();
    const agentMap = {};
    agents.forEach(agent => {
      const agentData = agent.get({ plain: true });
      agentMap[agentData.muxly_hostname] = agentData;
    });

    // Append agentSpecs to each metric if matching agent found
    const metricsWithAgent = metrics.map(metric => {
      const plainMetric = metric.get({ plain: true });
      const agentSpecs = agentMap[plainMetric.container_host] || null;
      return agentSpecs ? { ...plainMetric, agentSpecs } : plainMetric;
    });

    await t.commit();
    return res.status(200).json({
      data: metricsWithAgent,
      count: metricsWithAgent.length
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
