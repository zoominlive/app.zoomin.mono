const { postgres } = require('../lib/database');
const connectToDatabase = require("../models/index");
const jwt = require('jsonwebtoken');

module.exports = {
  // Create a single container metric record
  createContainerMetric: async (req, res) => {
    const t = await postgres.transaction();
    try {
      // Check if Authorization header exists
      const authHeader = req.header('Authorization');
      if (!authHeader) {
        await t.rollback();
        return res.status(401).json({ error: "Authorization header is required" });
      }

      // Extract and validate token
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
      if (!token) {
        await t.rollback();
        return res.status(401).json({ error: "Token is required" });
      }

      const secretKey = process.env.AGENT_SECRET;
      
      try {
        const decodeToken = jwt.verify(token, secretKey);
        console.log("Decoded token:", decodeToken);
      } catch (jwtError) {
        await t.rollback();
        return res.status(403).json({ error: "Invalid or expired token", details: jwtError.message });
      }

      const { ContainerMetrics } = await connectToDatabase();
      const { containerID, containerHostName, cpuPercent, memoryPercent } = req.body;

      // Validate required fields
      if (!containerID|| !containerHostName) {
        await t.rollback();
        return res.status(400).json({ error: "Container ID and Container Host are required fields" });
      }

      // Create metric record
      const metricData = {
        container_id: containerID,
        container_host: containerHostName,
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
