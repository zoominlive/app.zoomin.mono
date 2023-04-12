const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const LiveStreams = sequelize.define(
    'live_streams',
    {
        stream_id: {
            type: Sequelize.STRING(50),
            allowNull: false,
            primaryKey: true,
        },
        cust_id: {
            type: Sequelize.STRING(50)
        },
        user_id: {
            type: Sequelize.STRING(50)
        },
        room_id: {
            type: Sequelize.STRING(50)
        },
        hls_url: {
            type: Sequelize.STRING(50)
        },
        stream_name: {
            type: Sequelize.STRING(50),
        },
        stream_running: {
            type: Sequelize.BOOLEAN(1),
            defaultValue: false
        },
        stream_start_time: {
            type: Sequelize.DATE,
            defaultValue: null
        },
        stream_stop_time: {
            type: Sequelize.DATE,
            defaultValue: null
        },

        createdAt: { type: Sequelize.DATE, field: 'created_at' },
        updatedAt: { type: Sequelize.DATE, field: 'updated_at' }
    },
    {
        tableName: 'live_streams',
        timestamps: true
    }
);

module.exports = LiveStreams;
