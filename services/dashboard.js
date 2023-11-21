const connectToDatabase = require("../models/index");
const Sequelize = require("sequelize");
const _ = require("lodash");
const moment = require("moment-timezone");
const RoomsInChild = require("../models/rooms_assigned_to_child");
const Room = require("../models/room");
const customerServices = require("../services/customers");
const userServices = require("../services/users");
const socketServices = require('../services/socket');
const liveStreamServices = require('../services/liveStream');

module.exports = {
  /* get recent viewers */
  getLastOneHourViewers: async (user, custId = null, location = "All") => {
    let loc_obj = location === "All" ? {} : {location: location};
    const { RecentViewers, Family, Child, Room, RoomsInChild, Users } =
      await connectToDatabase();
    // let oneHourBefore = new Date();
    // oneHourBefore.setHours(oneHourBefore.getHours() - 1);
    // const currentTime = new Date();

    let recentViewers = await RecentViewers.findAll({
      // where: {
      //   requested_at: {
      //     [Sequelize.Op.between]: [
      //       oneHourBefore.toISOString(),
      //       currentTime.toISOString(),
      //     ],
      //   },
      // },
      order:[["requested_at", "DESC"]],
      group: ["recent_user_id"],
      include: [
        {
          model: Family,
          attributes: ["first_name", "last_name", "location", "profile_image"],
          include: [
            {
              model: Child,
              attributes: ["first_name"],
              include: [
                {
                  model: RoomsInChild,
                  attributes: ["room_id", "disabled"],
                  as: "roomsInChild",
                  where: {disabled: "false"},
                  include: [
                    {
                      attributes: ["room_name"],
                      model: Room,
                      as: "room",
                      where: loc_obj
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: Users,
          attributes: ["first_name", "last_name", "location", "profile_image" ],
        },
      ],
    });
    let result = [];
    if (custId) {
      let availableLocations = await customerServices.getLocationDetails(
        custId
      );
      let locs = availableLocations.flatMap((i) => i.loc_name);
      recentViewers.map((item) => {
        if (item.family) {
          locs.forEach((i) => {
            if (item.family.location.accessable_locations.includes(i)) {
              result.push(item);
            }
          });
        } else {
          locs.forEach((i) => {
            if (item.user.location.accessable_locations.includes(i)) {
              result.push(item);
            }
          });
        }
      });
    } else {
      recentViewers.map((item) => {
        if (item.family) {
          user.location.accessable_locations.forEach((i) => {
            if (item.family?.location?.accessable_locations.includes(i)) {
              if(!result.includes(item)){
                result.push(item);
              }
            }
          });
        } else {
          user.location.accessable_locations.forEach((i) => {
            if (item.user?.location?.accessable_locations.includes(i)) {
              if(!result.includes(item)){
                result.push(item);
              }
            }
          });
        }
      });
    }
    let filterResult = []
    if(!location.includes("Select All")){
       result.map(i => {
        if(i.family){
          if(i.family?.location?.accessable_locations.every(i => location.includes(i))){
            filterResult.push(i)
          }
        }
        else{
          if(i.user?.location?.accessable_locations.every(i => location.includes(i))){
            filterResult.push(i)
          }
        }
      })
      result = filterResult
    }
    result.slice(0,10);
    return result;
  },

  topViewersOfTheWeek: async (user, custId = null, location = "All") => {
    const { RecentViewers, Family, Users } = await connectToDatabase();
    let recentViewers = await RecentViewers.findAll({
      // where: {
      //   requested_at: {
      //     [Sequelize.Op.between]: [
      //       moment().subtract(1, "w").startOf("day").toISOString(),
      //       moment().toISOString(),
      //     ],
      //   },
      // },
      order: [['requested_at', 'DESC']],
      attributes: {
        include: [
          [Sequelize.fn("COUNT", Sequelize.col("recent_user_id")), "count"],
        ],
        exclude: [
          "rv_id",
          "recent_user_id",
          "source_ip",
          "location_name",
          "lat",
          "long",
          "requested_at",
        ],
      },
      group: ["recent_user_id"],
      include: [
        {
          model: Family,
          attributes: ["family_member_id","first_name", "last_name", "location","profile_image"],
        },
        {
          model: Users,
          attributes: ["user_id","first_name", "last_name", "location", "profile_image"],
        },
      ],
    });
    let result = [];
    if (custId) {
      let availableLocations = await customerServices.getLocationDetails(
        custId
      );
      let locs = availableLocations.flatMap((i) => i.loc_name);
      recentViewers.map((item) => {
        if (item.family) {
          locs.forEach((i) => {
            if (item.family?.location?.accessable_locations.includes(i)) {
              result.push(item);
            }
          });
        } else {
           locs.forEach((i) => {
            if (item.user?.location?.accessable_locations.includes(i)) {
              result.push(item);
            }
          });
        }
      });
    } else {
      recentViewers.map((item) => {
      
        if (item.family) {
           user.location.accessable_locations.forEach((i) => {
            if (item.family?.location?.accessable_locations.includes(i)) {
              if(!result.includes(item)){
                result.push(item);
              }
            }
          });
        } else {
           user.location.accessable_locations.forEach((i) => {
            if (item.user?.location?.accessable_locations.includes(i)) {
              if(!result.includes(item)){
                result.push(item);
              }
            }
          });
        }
      });
    }

    if(!location.includes("Select All")){
      let filterResult = []
       result.map(i => {
        if(i.family){
          if(i.family?.location?.accessable_locations.every(i => location.includes(i))){
            filterResult.push(i)
          }
        }
        else{
          if(i.user?.location?.accessable_locations.every(i => location.includes(i))){
            filterResult.push(i)
          }
        }
      })
      result = filterResult;
    }
    return result.slice(0, 5);
  },

  getChildrenWithSEA: async (custId, location = ["Select All"]) => {
    const { Child, Family } = await connectToDatabase();
    let children = await Child.findAll({
      where: { cust_id: custId },
      attributes: [
        "first_name",
        "last_name",
        "scheduled_end_date",
        "scheduled_enable_date",
        "family_id",
        "location"
      ],
      include: [
        {
          model: Family,
          include: [
            {
              model: Child,
              include: [
                {
                  model: RoomsInChild,
                  as: "roomsInChild",
                  include: [
                    {
                      model: Room,
                      as: "room",
                    },
                  ],
                },
              ],
            },
            {
              model: Family,
              as: "secondary",
              attributes: {
                exclude: [
                  "password",
                  "password_link",
                  "createdAt",
                  "cam_preference",
                  "updatedAt",
                ],
              },
              where: {
                member_type: "secondary",
              },
              required: false,
            },
          ],
          attributes: {
            exclude: [
              "password",
              "password_link",
              "createdAt",
              "cam_preference",
              "updatedAt",
            ],
          },
        },
        {
          model: RoomsInChild,
          as: "roomsInChild",
          attributes: ["scheduled_disable_date", "scheduled_enable_date"],
          where: {
            [Sequelize.Op.or]: [
              {
                scheduled_disable_date: {
                  [Sequelize.Op.between]: [
                    moment().toISOString(),
                    moment().add(1, "w").toISOString(),
                  ],
                },
              },
              {
                scheduled_enable_date: {
                  [Sequelize.Op.between]: [
                    moment().toISOString(),
                    moment().add(1, "w").toISOString(),
                  ],
                },
              },
            ],
          },
          include: [
            {
              model: Room,
              as: "room",
              attributes: ["room_name", "location"],
            },
          ],
        },
      ],
    });

    if(!location.includes("Select All")){
      let filterResult = []
      children.map(i => {
          if(i.location?.locations.every(it => location.includes(it))){
            filterResult.push(i)
          }
      })
      children = filterResult
    }

    return children;
  },

  setCamPreference: async (user, cams) => {
    const { Users, CamPreference } = await connectToDatabase();
    let camObj = {
      dashboard_cam_preference: cams,
    };
    let camSettings;
    if (user.role === "Super Admin") {
      let prefrenceDetails = await CamPreference.findOne({
        where: { cust_id: cams.cust_id },
        raw: true,
      });

      let { cust_id, ...rest } = cams;
      if (prefrenceDetails) {
        camSettings = await CamPreference.update(
          { dashboard_cam: rest },
          {
            where: {
              cust_id: cams.cust_id,
            },
          }
        );
      } else {
        camSettings = await CamPreference.create({
          cust_id: cust_id,
          dashboard_cam: rest,
        });
      }
    } else {
      camSettings = await Users.update(camObj, {
        where: {
          user_id: user?.user_id,
        },
      });
    }

    return camSettings;
  },

  getCamPreference: async (custId) => {
    const { CamPreference } = await connectToDatabase();
    let prefrenceDetails = await CamPreference.findOne({
      where: { cust_id: custId },
      raw: true,
    });
     
    return prefrenceDetails?.dashboard_cam
  },

  updateDashboardData: async (cust_id, data) => {
    let usersdata = await userServices.getUsersSocketIds(cust_id);
    return usersdata
  },
};
