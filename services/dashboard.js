const connectToDatabase = require("../models/index");
const Sequelize = require("sequelize");
const _ = require("lodash");
const moment = require("moment-timezone");
const ZonesInChild = require("../models/zones_assigned_to_child");
const Zone = require("../models/zone");
const customerServices = require("../services/customers");
const userServices = require("../services/users");
const socketServices = require('../services/socket');
const liveStreamServices = require('../services/liveStream');
const sequelize = require("../lib/database");
const CustomerLocations = require("../models/customer_locations");

module.exports = {
  /* get recent viewers */
  getLastOneHourViewers: async (user, custId = null, location = "All") => {
    let loc_obj = location === "All" ? {} : {location: location};
    const { RecentViewers, Family, Child, Zone, ZonesInChild, Users, CustomerLocations } =
      await connectToDatabase();
    let oneHourBefore = new Date();
    oneHourBefore.setHours(oneHourBefore.getHours() - 336);
    const currentTime = new Date();

    let recentViewers = await RecentViewers.findAll({
      where: {
        requested_at: {
          [Sequelize.Op.between]: [
            oneHourBefore.toISOString(),
            currentTime.toISOString(),
          ],
        },
      },
      // logging: console.log,
      subQuery: false,
      attributes: [
        "rv_id",
        "recent_user_id",
        "lat", 
        "long",
        [sequelize.literal('MAX(requested_at)'), 'latest_requested_at'],
      ],
      order:[["latest_requested_at", "DESC"]],
      limit: 10,
      group: ["recent_user_id"],
      include: [
        {
          model: Family,
          attributes: ["first_name", "last_name", "profile_image"],
          include: [
            {
              model: Child,
              attributes: ["first_name"],
              include: [
                {
                  model: ZonesInChild,
                  attributes: ["zone_id", "disabled"],
                  as: "zonesInChild",
                  where: {disabled: "false"},
                  include: [
                    {
                      attributes: ["zone_name"],
                      model: Zone,
                      as: "zone",
                      where: loc_obj
                    },
                  ],
                },
              ],
            },
            {
              model: CustomerLocations,
              attributes: ["loc_id", "loc_name"],
              as: 'family_user_locations'
            }
          ],
        },
        {
          model: Users,
          attributes: ["first_name", "last_name", "profile_image" ],
          include: [
            {
              model: CustomerLocations,
              attributes: ["loc_id", "loc_name"],
              as: 'locations'
            }
          ]
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
            if (item.family.dataValues?.family_user_locations?.map((item) => item.loc_name).includes(i)) {
              if(!result.includes(item)){
                result.push(item);
              }
            }
          });
        } else {
          locs.forEach((i) => {
            if (item.user.dataValues?.family_user_locations?.map((item) => item.loc_name).includes(i)) {
              if(!result.includes(item)){
                result.push(item);
              }
            }
          });
        }
      });
    } else {
      recentViewers.map((item) => {
        if (item.dataValues.family) {
          user.locations.map((item) => item.loc_id).forEach((i) => {
            if (item.dataValues.family?.dataValues?.family_user_locations.includes(i)) {
              if(!result.includes(item)){
                result.push(item);
              }
            }
          });
        } else {
          user.locations.map((item) => item.loc_id).forEach((i) => {
            if (item.dataValues.user?.dataValues?.locations?.includes(i)) {
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
      if (location !== 'All') location = location?.map(Number);
       result.map((i) => {
        if(i.dataValues.family) {
          if (
            i.dataValues.family?.dataValues.family_user_locations
              .map((item) => item.dataValues?.loc_id)
              .every((i) => location.includes(i))
          ) {
            filterResult.push(i);
          }
        } else {
          if (
            i.dataValues.user?.dataValues.locations
            .map((item) => item.dataValues?.loc_id)
            .every((i) =>
              location.includes(i)
            )
          ) {
            filterResult.push(i);
          }
        }
      });
      result = filterResult;
    }
    // result.slice(0,10);
    return result;
  },

  topViewersOfTheWeek: async (user, custId = null, location = "All") => {
    const { RecentViewers, Family, CustomerLocations, Users } =
      await connectToDatabase();
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
          attributes: ["family_member_id","first_name", "last_name", "profile_image"],
          include: [
            {
              model: CustomerLocations,
              as: "family_user_locations",
              attributes: ["loc_id", "loc_name"],
            },
          ],
        },
        {
          model: Users,
          attributes: ["user_id","first_name", "last_name","profile_image"],
          include: [
            {
              model: CustomerLocations,
              as: "locations",
              attributes: ["loc_id", "loc_name"],
            },
          ],
        },
      ],
    });
    console.log("recentViewers==>", recentViewers.length);
    let result = [];
    if (custId) {
      let availableLocations = await customerServices.getLocationDetails(
        custId
      );
      let locs = availableLocations.flatMap((i) => i.loc_id);
      recentViewers.map((item) => {
        if (item.dataValues.family) {
          locs.forEach((i) => {
            if (item.dataValues?.family?.dataValues?.family_user_locations?.map((item) => item.loc_id).includes(i)) {
              result.push(item);
            }
          });
        } else {
           locs.forEach((i) => {
            if (item.dataValues?.user?.dataValues?.locations?.map((item) => item.loc_id).includes(i)) {
              result.push(item);
            }
          });
        }
      });
    } else {
      recentViewers.map((item) => {
      
      if (item.dataValues.family) {
        user.locations.map((item) => item.loc_id).forEach((i) => {
            if (item.dataValues?.family?.dataValues?.family_user_locations?.map((item) => item.loc_id).includes(i)) {
              if(!result.includes(item)){
                result.push(item);
              }
            }
          });
      } else {
        user.locations.map((item) => item.loc_id).forEach((i) => {
            if (item.dataValues?.user?.dataValues?.locations?.map((item) => item.loc_id).includes(i)) {
              if(!result.includes(item)){
                result.push(item);
              }
            }
          });
      }
      });
    }

    if(!location.includes("Select All")){
      let filterResult = [];
      console.log('location==>', location);
      
      if (location !== 'All') location = location?.map(Number);
      result.map((i) => {
        if (i.dataValues.family) {
          if (
            i.dataValues.family?.dataValues.family_user_locations
              .map((item) => item.loc_id)
              .every((i) => location.includes(i))
          ) {
            filterResult.push(i);
          }
        } else {
          if (
            i.dataValues.user?.dataValues.locations
              ?.map((item) => item.loc_id)
              .every((i) => location.includes(i))
          ) {
            filterResult.push(i);
          }
        }
      });
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
        "status",
      ],
      include: [
        {
          model: Family,
          include: [
            {
              model: Child,
              include: [
                {
                  model: ZonesInChild,
                  as: "zonesInChild",
                  include: [
                    {
                      model: Zone,
                      as: "zone",
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
          model: ZonesInChild,
          as: "zonesInChild",
          attributes: [
            "zone_id",
            "scheduled_disable_date",
            "scheduled_enable_date",
          ],
          include: [
            {
              model: Zone,
              as: "zone",
              attributes: ["zone_name", "loc_id"],
            },
          ],
        },
        {
          model: CustomerLocations,
          as: 'child_locations',
          attributes: ['loc_id', 'loc_name']
        }
      ],
    });

    if (!location.includes("Select All")) {
      location = location.map(Number);
      let filterResult = [];
      children.map((i) => {        
        if (i.child_locations?.map((item) => item.loc_id).every((it) => location.includes(it))) {
          filterResult.push(i);
        }
      });
      children = filterResult;
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

    return prefrenceDetails?.dashboard_cam;
  },

  updateDashboardData: async (cust_id, data) => {
    let usersdata = await userServices.getUsersSocketIds(cust_id);
    return usersdata;
  },
};
