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

      // Extract query params
      const { hostname, minCpu, maxCpu, minMemory, maxMemory } = req.query;
      const Op = Sequelize.Op;

      // Build filter for ContainerMetrics
      const metricsWhere = {};
      if (minCpu) metricsWhere.cpu_percent = { ...(metricsWhere.cpu_percent || {}), [Op.gte]: Number(minCpu) };
      if (maxCpu) metricsWhere.cpu_percent = { ...(metricsWhere.cpu_percent || {}), [Op.lte]: Number(maxCpu) };
      if (minMemory) metricsWhere.memory_mb = { ...(metricsWhere.memory_mb || {}), [Op.gte]: Number(minMemory) };
      if (maxMemory) metricsWhere.memory_mb = { ...(metricsWhere.memory_mb || {}), [Op.lte]: Number(maxMemory) };

      // If hostname is provided, find matching container hosts from Agent table
      let hostnames = [];
      if (hostname) {
        const agents = await Agent.findAll({
          where: { muxly_hostname: { [Op.like]: `%${hostname}%` } },
          attributes: ['muxly_hostname'],
          raw: true
        });
        hostnames = agents.map(agent => agent.muxly_hostname);
        hostnames = Array.from(new Set(hostnames));
        if (hostnames.length > 0) {
          metricsWhere.container_host = hostnames.length === 1 ? hostnames[0] : { [Op.in]: hostnames };
        } else {
          await t.commit();
          return res.status(200).json({ data: [], count: 0 });
        }
      }

      // Fetch filtered metrics
      const metrics = await ContainerMetrics.findAll({
        where: metricsWhere,
        order: [['timestamp', 'DESC']],
        limit: 100
      });

      // Fetch all agents
      const agents = await Agent.findAll();
      const agentMap = {};
      agents.forEach(agent => {
        const agentData = agent.get({ plain: true });
        agentMap[agentData.muxly_hostname] = agentData;
      });
      // Fetch all agent_containers and map by agent_id
      const agentContainers = await AgentContainers.findAll({ raw: true });
      const agentIdToContainerVersion = {};
      agentContainers.forEach(ac => {
        // Only keep the latest version per agent_id (if multiple, pick the latest by createdAt)
        if (!agentIdToContainerVersion[ac.agent_id] || (ac.createdAt > agentIdToContainerVersion[ac.agent_id].createdAt)) {
          agentIdToContainerVersion[ac.agent_id] = ac;
        }
      });
      
      // Fetch all customers
      const customers = await Customers.findAll({
        attributes: ['transcoder_endpoint', 'company_name'],
        raw: true
      });
      // Build a map of normalized endpoint host to company_name
      const endpointToCompany = {};
      customers.forEach(cust => {
        if (cust.transcoder_endpoint) {
          let endpointHost = cust.transcoder_endpoint.replace(/^https?:\/\//, '');
          endpointHost = endpointHost.replace(/\/$/, '');
          endpointToCompany[endpointHost] = cust.company_name;
        }
      });

      // Attach company_name to agentMap if muxly_hostname matches endpoint host
      Object.keys(agentMap).forEach(hostname => {
        if (endpointToCompany[hostname]) {
          agentMap[hostname].company_name = endpointToCompany[hostname];
        } else {
          // Try to match by removing port if present
          const hostNoPort = hostname.split(':')[0];
          if (endpointToCompany[hostNoPort]) {
            agentMap[hostname].company_name = endpointToCompany[hostNoPort];
          }
        }
      });

      // Append agentSpecs and company_name to each metric if matching found
      const metricsWithAgent = metrics.map(metric => {
        const plainMetric = metric.get({ plain: true });
        const agentSpecs = agentMap[plainMetric.container_host] || null;
        let result = agentSpecs ? { ...plainMetric, agentSpecs } : plainMetric;
        if (agentSpecs && agentSpecs.company_name) {
          result.company_name = agentSpecs.company_name;
        }
        return result;
      });

      // Group metrics by container_host
      const grouped = {};
      metricsWithAgent.forEach(metric => {
        const host = metric.container_host;
        if (!grouped[host]) {
          // Find agent_id from agentSpecs (if available)
          let tag = null;
          const agent_id = metric.agentSpecs?.agent_id;
          if (agent_id && agentIdToContainerVersion[agent_id]) {
            tag = agentIdToContainerVersion[agent_id].container_version;
          }
          grouped[host] = {
            id: host,
            label: host,
            cpu: metric.agentSpecs?.processor || null,
            customer: metric?.company_name || null,
            memory: metric.agentSpecs?.totalRAM || null,
            upSince: metric.agentSpecs?.createdAt || null,
            region: metric.agentSpecs?.region || null,
            host: metric.agentSpecs?.hostname || null,
            onPrem: metric.agentSpecs?.onPrem || null,
            tag, // container_version from agent_containers
            stats: []
          };
        }
        grouped[host].stats.push({
          time: metric.timestamp,
          cpu: metric.cpu_percent,
          mem: metric.memory_mb
        });
      });
      const transformed = Object.values(grouped);

      await t.commit();
      return res.status(200).json({
        data: transformed,
        count: transformed.length
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
