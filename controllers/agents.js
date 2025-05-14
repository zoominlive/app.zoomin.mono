const { sequelize } = require('../lib/database');
const connectToDatabase = require("../models/index");

module.exports = {
  // Create a new agent
  createAgent: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { Agent } = await connectToDatabase();
      const { ip, hostname, containerID, containerState, containerVersion, MuxlyHostName } = req.body;

      // Validate required fields
      if (!ip || !hostname || !containerState || !containerVersion || !MuxlyHostName) {
        await t.rollback();
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Create agent record
      const agentData = {
        recorded_at: new Date(),
        ip,
        hostname,
        container_id: containerID,
        container_state: containerState,
        container_version: containerVersion,
        muxly_hostname: MuxlyHostName
      };

      const agent = await Agent.create(agentData, { transaction: t });
      
      await t.commit();
      return res.status(201).json({
        data: agent,
        message: "Agent created successfully"
      });

    } catch (error) {
      await t.rollback();
      console.error("Error creating agent:", error);
      return res.status(500).json({ error: error.message || "Internal server error" });
    }
  },

  createMetrics: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { Agent } = await connectToDatabase();
      const { ip, hostname, container_state, container_version, muxly_hostname } = req.body;

      // Validate required fields
      if (!ip || !hostname || !container_state || !container_version || !muxly_hostname) {
        await t.rollback();
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Create agent record
      const agentData = {
        recorded_at: new Date(),
        ip,
        hostname,
        container_state,
        container_version,
        muxly_hostname
      };

      const agent = await Agent.create(agentData, { transaction: t });
      
      await t.commit();
      return res.status(201).json({
        data: agent,
        message: "Agent created successfully"
      });

    } catch (error) {
      await t.rollback();
      console.error("Error creating agent:", error);
      return res.status(500).json({ error: error.message || "Internal server error" });
    }
  },

  // Get all agents
  getAllAgents: async (req, res) => {
    try {
      const { Agent } = await connectToDatabase();
      const { page = 0, pageSize = 10, searchBy = "" } = req.query;
      
      const offset = page * pageSize;
      const limit = parseInt(pageSize);
      
      const whereClause = searchBy ? {
        [sequelize.Op.or]: [
          { hostname: { [sequelize.Op.iLike]: `%${searchBy}%` } },
          { ip: { [sequelize.Op.iLike]: `%${searchBy}%` } },
          { MuxlyHostName: { [sequelize.Op.iLike]: `%${searchBy}%` } }
        ]
      } : {};

      const agents = await Agent.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      return res.status(200).json({
        data: agents.rows,
        count: agents.count,
        page: parseInt(page),
        pageSize: limit
      });
    } catch (error) {
      console.error("Error getting agents:", error);
      return res.status(500).json({ error: error.message || "Internal server error" });
    }
  },
  
  // Get agent by ID
  getAgentById: async (req, res) => {
    try {
      const { Agent } = await connectToDatabase();
      const { agent_id } = req.params;
      
      if (!agent_id) {
        return res.status(400).json({ error: "Agent ID is required" });
      }
      
      const agent = await Agent.findByPk(agent_id);
      
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      
      return res.status(200).json({ data: agent });
    } catch (error) {
      console.error("Error getting agent:", error);
      return res.status(500).json({ error: error.message || "Internal server error" });
    }
  },
  
  // Update agent
  updateAgent: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { Agent } = await connectToDatabase();
      const { agent_id } = req.params;
      const { ip, hostname, containerState, containerVersion, MuxlyHostName } = req.body;
      
      if (!agent_id) {
        await t.rollback();
        return res.status(400).json({ error: "Agent ID is required" });
      }
      
      const agent = await Agent.findByPk(agent_id);
      
      if (!agent) {
        await t.rollback();
        return res.status(404).json({ error: "Agent not found" });
      }
      
      const updatedAgent = await agent.update({
        ip: ip || agent.ip,
        hostname: hostname || agent.hostname,
        containerState: containerState || agent.containerState,
        containerVersion: containerVersion || agent.containerVersion,
        MuxlyHostName: MuxlyHostName || agent.MuxlyHostName
      }, { transaction: t });
      
      await t.commit();
      return res.status(200).json({
        data: updatedAgent,
        message: "Agent updated successfully"
      });
    } catch (error) {
      await t.rollback();
      console.error("Error updating agent:", error);
      return res.status(500).json({ error: error.message || "Internal server error" });
    }
  },
  
  // Delete agent
  deleteAgent: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { Agent } = await connectToDatabase();
      const { agent_id } = req.params;
      
      if (!agent_id) {
        await t.rollback();
        return res.status(400).json({ error: "Agent ID is required" });
      }
      
      const agent = await Agent.findByPk(agent_id);
      
      if (!agent) {
        await t.rollback();
        return res.status(404).json({ error: "Agent not found" });
      }
      
      await agent.destroy({ transaction: t });
      
      await t.commit();
      return res.status(200).json({ message: "Agent deleted successfully" });
    } catch (error) {
      await t.rollback();
      console.error("Error deleting agent:", error);
      return res.status(500).json({ error: error.message || "Internal server error" });
    }
  }
};