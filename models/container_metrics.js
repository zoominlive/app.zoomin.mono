const { Sequelize } = require('sequelize');
const { postgres } = require('../lib/database');

const ContainerMetrics = postgres.define(
  'container_metrics',
  {
    container_id: {
      type: Sequelize.TEXT,
      allowNull: false,
      primaryKey: true
    },
    container_host: {
      type: Sequelize.TEXT,
      allowNull: false,
      primaryKey: true
    },
    timestamp: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
      primaryKey: true
    },
    cpu_percent: {
      type: Sequelize.DOUBLE,
      allowNull: true
    },
    memory_mb: {
      type: Sequelize.DOUBLE,
      allowNull: true
    }
  },
  {
    tableName: 'container_metrics',
    timestamps: false, // The table manages its own timestamp
    indexes: [
      {
        name: 'container_metrics_container_host_timestamp_idx',
        fields: ['container_host', { name: 'timestamp', order: 'DESC' }]
      },
      {
        name: 'container_metrics_timestamp_idx',
        fields: [{ name: 'timestamp', order: 'DESC' }]
      }
    ]
  }
);

module.exports = ContainerMetrics;
