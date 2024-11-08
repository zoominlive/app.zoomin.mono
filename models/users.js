const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const Users = sequelize.define(
  'users',
  {
    user_id: {
      type: Sequelize.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    frontegg_tenant_id: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    frontegg_user_id: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    first_name: {
      type: Sequelize.STRING(30),
      required: [true, 'FirstName is mandatory field']
    },
    last_name: {
      type: Sequelize.STRING(30),
      required: [true, 'Last Name is mandatory field']
    },
    email: {
      type: Sequelize.STRING(50),
      unique: {
        args: true,
        msg: 'Email address already in use!'
      },
      required: [true, 'Email is mandatory field']
    },
    password: {
      type: Sequelize.STRING(200)
    },
    // location: {
    //   type: Sequelize.JSON,
    //   allowNull: false,
    //   required: [true, 'Atleast one location is required']
    // },
    password_link: {
      type: Sequelize.ENUM('active', 'inactive'),
      defaultValue: 'active',
      required: true
    },
    is_verified: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      required: false
    },
    status: {
      type: Sequelize.ENUM('active', 'inactive'),
      defaultValue: 'active',
      required: true
    },
    role: {
      type: Sequelize.ENUM('Teacher', 'User', 'Admin', 'Super Admin'),
      required: true
    },
    profile_image: {
      type: Sequelize.STRING(100),
      required: false,
      default: ''
    },
    cust_id: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    cam_preference: {
      type: Sequelize.JSON,
      defaultValue: {}
    },
    dashboard_cam_preference: {
      type: Sequelize.JSON,
      defaultValue: {}
    },
    stream_live_license: {
     type: Sequelize.BOOLEAN(),
     defaultValue: false,
    },
    socket_connection_id: {
      type: Sequelize.STRING(250),
      default: null,
      allowNull: true
    },
    dashboard_locations: {
      type: Sequelize.JSON,
      defaultValue: {}
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' },
    deletedAt: { type: Sequelize.DATE, field: 'deleted_at' }
  },
  {
    tableName: 'users',
    timestamps: true,
    paranoid: true
  }
);

module.exports = Users;
