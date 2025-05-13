const { postgres } = require('../lib/database');
const connectToDatabase = require("../models/index");

module.exports = {
  // Create a single container metric record
  createContainerMetric: async (req, res) => {
    const t = await postgres.transaction();
    try {
      const { ContainerMetrics } = await connectToDatabase();
      const { container_id, container_host, cpu_percent, memory_mb } = req.body;

      // Validate required fields
      if (!container_id || !container_host) {
        await t.rollback();
        return res.status(400).json({ error: "Container ID and Container Host are required fields" });
      }

      // Create metric record
      const metricData = {
        container_id,
        container_host,
        timestamp: new Date(), // Current timestamp
        cpu_percent: cpu_percent || null,
        memory_mb: memory_mb || null
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
