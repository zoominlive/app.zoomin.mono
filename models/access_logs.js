const { Sequelize } = require('sequelize');
const { sequelize } = require('../lib/database');

const AccessLogs = sequelize.define(
  'access_logs',
  {
    log_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: { type: Sequelize.STRING(50), allowNull: false },
    function: {
      type: Sequelize.ENUM(
        'Primary_Family',
        'Second_Family',
        'Child',
        'Zone',
        'Camera',
        'Users',
        'Profile_Photo',
        'User_Change_Email',
        'User_Forgot_Password',
        'User_Change_Password',
        'User_Reg_Accout',
        'Watch_Stream',
        'Live_stream'
      ),
      required: true
    },
    function_type: {
      type: Sequelize.ENUM('Get', 'Login'),
      required: true
    },
    response: {
      type: Sequelize.JSON,
      defaultValue: {}
    },
    error: {
      type: Sequelize.JSON,
      defaultValue: null
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' }
  },
  {
    tableName: 'access_logs',
    timestamps: true
  }
);

module.exports = AccessLogs;
