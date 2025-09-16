const { Sequelize } = require('sequelize');
const { sequelize } = require('../lib/database');

const ChangeLogs = sequelize.define(
  'change_logs',
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
        'Record_Tag',
        'Camera',
        'Users',
        'Profile_Photo',
        'User_Change_Email',
        'User_Forgot_Password',
        'User_Change_Password',
        'User_Reg_Accout',
        'Live_Stream'
      ),
      required: true
    },
    function_type: {
      type: Sequelize.ENUM('Add', 'Edit', 'Delete', 'Disable', 'Enable', 'Start', 'Stop'),
      required: true
    },
    request: {
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
    tableName: 'change_logs',
    timestamps: true
  }
);

module.exports = ChangeLogs;
