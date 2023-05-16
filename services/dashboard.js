const connectToDatabase = require('../models/index');
const Sequelize = require('sequelize');
const _ = require('lodash');
const moment = require('moment-timezone');
const RoomsInChild = require('../models/rooms_assigned_to_child');
const Room = require('../models/room');

module.exports = {
  /* get recent viewers */
  getLastOneHourViewers: async (user) => {
    const { RecentViewers, Family, Child, Room, RoomsInChild, Users } = await connectToDatabase();
    let oneHourBefore = new Date();
    oneHourBefore.setHours(oneHourBefore.getHours() - 1);

    const currentTime = new Date();

    let recentViewers = await RecentViewers.findAll({
      where: {
        requested_at: {
          [Sequelize.Op.between]: [oneHourBefore.toISOString(), currentTime.toISOString()]
        }
      },
      group: ['recent_user_id'],
      include: [
        {
          model: Family,
          attributes: ['first_name', 'last_name'],
          include: [
            {
              model: Child,
              attributes: ['first_name'],
              include: [
                {
                  model: RoomsInChild,
                  attributes: ['room_id'],
                  as: 'roomsInChild',
                  include: [
                    {
                      attributes: ['room_name'],
                      model: Room,
                      as: 'room'
                    }
                  ]
                }
              ]
            },
          ]
        },
        {
          model: Users,
          attributes: ['first_name', 'last_name'],
        }
      ]
    });

    const result = []
    recentViewers.map(item => {
      let res;
      if (item.family) {
        res = user.location.accessable_locations.forEach(i => {
          if (item.family?.location?.accessable_locations.includes(i)) {
            result.push(item)
          }
        })
      }
      else {
        res = user.location.accessable_locations.forEach(i => {
          if (item.user?.location?.accessable_locations.includes(i)) {
            result.push(item)
          }
        })
      }
    })
    return result;
  },

  topViewersOfTheWeek: async (user) => {
    const { RecentViewers, Family, Users } = await connectToDatabase();

    let recentViewers = await RecentViewers.findAll({
      where: {
        requested_at: {
          [Sequelize.Op.between]: [
            moment().subtract(1, 'w').startOf('day').toISOString(),
            moment().toISOString()
          ]
        }
      },
      attributes: {
        include: [[Sequelize.fn('COUNT', Sequelize.col('recent_user_id')), 'count']],
        exclude: [
          'rv_id',
          'recent_user_id',
          'source_ip',
          'location_name',
          'lat',
          'long',
          'requested_at'
        ]
      },
      group: ['recent_user_id'],
      include: [
        {
          model: Family,
          attributes: ['first_name', 'last_name', 'location']
        },
        {
          model: Users,
          attributes: ['first_name', 'last_name', 'location']
        }
      ]
    });
    const result = []
    recentViewers.map(item => {
      let res;
      if (item.family) {
        res = user.location.accessable_locations.forEach(i => {
          if (item.family.location.accessable_locations.includes(i)) {
            result.push(item)
          }
        })
      }
      else {
        res = user.location.accessable_locations.forEach(i => {
          if (item.user.location.accessable_locations.includes(i)) {
            result.push(item)
          }
        })
      }
    })
    return result;
  },

  getChildrenWithSEA: async (custId) => {
    const { Child } = await connectToDatabase();
        console.log('getchildrenwithSEA',custId);
    let children = await Child.findAll({
      where: { cust_id: custId },
      attributes: ['first_name', 'last_name', 'scheduled_end_date', 'scheduled_enable_date',],
      include: [
        {
          model: RoomsInChild,
          as: 'roomsInChild',
          attributes: ['scheduled_disable_date', 'scheduled_enable_date'],
          where: {
            [Sequelize.Op.or]: [
              {
                scheduled_disable_date: {
                  [Sequelize.Op.between]: [
                    moment().toISOString(),
                    moment().add(1, 'w').toISOString()
                  ]
                }
              },
              {
                scheduled_enable_date: {
                  [Sequelize.Op.between]: [
                    moment().toISOString(),
                    moment().add(1, 'w').toISOString()
                  ]
                }
              }
            ]
          },
          include: [
            {
              model: Room,
              as: 'room',
              attributes: ['room_name']
            }
          ]
        }
      ]
    });

    return children;
  },

  setCamPreference: async (user, cams, t) => {
    const { Users } = await connectToDatabase();
    let camObj = {
      dashboard_cam_preference: cams
    };
    let camSettings;

    camSettings = await Users.update(
      camObj,
      {
        where: {
          user_id: user?.user_id
        }
      },
      { transaction: t }
    );

    return camSettings;
  }

};
