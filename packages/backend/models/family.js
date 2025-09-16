const { Sequelize } = require('sequelize');
const { sequelize } = require('../lib/database');

const Family = sequelize.define(
  'family',
  {
    family_member_id: {
      type: Sequelize.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    family_id: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    user_id: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    frontegg_tenant_id: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    frontegg_user_id: {
      type: Sequelize.STRING(50),
      allowNull: true
    },
    cust_id: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    frontegg_tenant_id: {
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
    relationship: {
      type: Sequelize.ENUM(
        'Mother',
        'Father',
        'Aunt',
        'Uncle',
        'Grandmother',
        'Grandfather',
        'Other'
      ),
      required: true
    },
    member_type: {
      type: Sequelize.ENUM('primary', 'secondary'),
      required: true
    },
    phone: {
      type: Sequelize.STRING(20)
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
    password_link: {
      type: Sequelize.ENUM('active', 'inactive'),
      defaultValue: 'active'
    },
    is_verified: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      required: false
    },
    // location: {
    //   type: Sequelize.JSON,
    //   defaultValue: null
    // },
    disabled_locations: {
      type: Sequelize.JSON,
      defaultValue: {}
    },
    role: {
      type: Sequelize.ENUM('Family'),
      defaultValue: 'Family',
      required: true
    },
    profile_image: {
      type: Sequelize.STRING(100),
      required: false,
      default: ''
    },
    status: {
      type: Sequelize.ENUM('Enabled', 'Disabled'),
      defaultValue: 'Enabled',
      required: true
    },
    scheduled_end_date: {
      type: Sequelize.DATEONLY,
      allowNull: true,
      defaultValue: null
    },
    time_zone: {
      type: Sequelize.STRING(100)
    },
    socket_connection_id: {
      type: Sequelize.STRING(250),
      default: null,
      allowNull: true
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' },
    deletedAt: { type: Sequelize.DATE, field: 'deleted_at' },
    cam_preference: {
      type: Sequelize.JSON,
      defaultValue: {}
    }
  },
  {
    tableName: 'family',
    timestamps: true,
    paranoid: true
  }
);

module.exports = Family;
