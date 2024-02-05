const connectToDatabase = require('../models/index');
const Sequelize = require('sequelize');
const moment = require('moment');
module.exports = {
  /* Create new log*/
  addAccessLog: async (logObj) => {
    const { AccessLogs } = await connectToDatabase();
    let log = await AccessLogs.create(logObj);
    return log;
  },

  addChangeLog: async (logObj) => {
    const { ChangeLogs } = await connectToDatabase();
    let log = await ChangeLogs.create(logObj);
    return log;
  },

  bulkAddChangeLog: async (logObj) => {
    const { ChangeLogs } = await connectToDatabase();
    let log = await ChangeLogs.bulkCreate(logObj);
    return log;
  },
  /* Create new error log*/
  addAccessErrorLog: async (logId, error) => {
    const { AccessLogs } = await connectToDatabase();
    let errorLog = await AccessLogs.update(
      { error: error },
      {
        where: {
          log_id: logId
        }
      }
    );
    return errorLog;
  },

  getAllLogs: async (user, filter) => {
    let {
      pageNumber,
      pageSize,
      startDate,
      endDate,
      type,
      functions,
      userIds,
      locations,
      familyMemberIds,
      actions
    } = filter;

    const { ChangeLogs, AccessLogs, Users, Family } = await connectToDatabase();
    let locArray = locations.map((loc) => {
      return {
        location: {
          [Sequelize.Op.substring]: loc
        }
      };
    });
    if (type == 'Access Log') {
      if (pageNumber === null && pageNumber === undefined && pageSize === null && pageSize === undefined) {
        pageSize = 10;
        pageNumber = 0;
      }
      let log = await AccessLogs.findAndCountAll({
        limit: parseInt(pageSize),
        offset: parseInt(pageNumber * pageSize),
        //attributes: { exclude: ['response', 'updatedAt'] },
        where: {
          created_at: {
            [Sequelize.Op.between]: [
              moment(startDate).startOf('day').toISOString(),
              moment(endDate).endOf('day').toISOString()
            ]
          },
          function: functions,
          function_type: actions,
          [Sequelize.Op.or]: [{ user_id: userIds }, { user_id: familyMemberIds }]
        },
        order: [['created_at', 'DESC']],
        include: [
          {
            model: Users,
            where: {
              [Sequelize.Op.or]: locArray
            },
            attributes: ['first_name', 'last_name'],
            required: false
          },
          {
            model: Family,
            attributes: ['first_name', 'last_name'],
            required: false
          }
        ],
      });
      return { logs: log.rows, count: log.count };
    } else {
      if (pageNumber === null && pageNumber === undefined && pageSize === null && pageSize === undefined) {
        pageSize = 10;
        pageNumber = 0;
      }
      let log = await ChangeLogs.findAndCountAll({
        limit: parseInt(pageSize),
        offset: parseInt(pageNumber * pageSize),
        //attributes: { exclude: ['response', 'updatedAt'] },
        where: {
          created_at: {
            [Sequelize.Op.between]: [
              moment(startDate).startOf('day').toISOString(),
              moment(endDate).endOf('Day').toISOString()
            ]
          },
          function: functions,
          function_type: actions,
          [Sequelize.Op.or]: [{ user_id: userIds }, { user_id: familyMemberIds }]
        },
        order: [['created_at', 'DESC']],
        include: [
          {
            model: Users,
            where: {
              [Sequelize.Op.or]: locArray
            },
            attributes: ['first_name', 'last_name'],
            required: true
          }
        ]
      });
      return { logs: log.rows, count: log.count };
    }
  }
};
