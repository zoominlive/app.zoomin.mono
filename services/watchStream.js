const connectToDatabase = require("../models/index");
const Sequelize = require("sequelize");
const _ = require("lodash");
const moment = require("moment-timezone");
const RoomsInTeacher = require("../models/rooms_assigned_to_teacher");

module.exports = {
  /* Create new camera */
  getAllCamForLocation: async (user) => {
    const {
      Camera,
      Room,
      Child,
      RoomsInChild,
      CamerasInRooms,
      CustomerLocations,
      RoomsInTeacher,
    } = await connectToDatabase();

    let availableLocations = await CustomerLocations.findAll({
      where: { cust_id: user.cust_id },
      raw: true,
    });

    if (user?.family_id) {
      let cameras = await Child.findAll({
        where: { family_id: user.family_id, status: "enabled" },
        include: [
          {
            model: RoomsInChild,
            where: {
              disabled: "false",
            },
            as: "roomsInChild",
            include: [
              {
                model: Room,
                as: "room",
                where: { location: user.location.accessable_locations },
                include: [
                  {
                    model: CamerasInRooms,
                    include: [
                      {
                        model: Camera,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      let finalRooms = [];
      cameras?.forEach((rooms) => {
        rooms?.roomsInChild?.forEach((room) => {
          if (room?.schedule?.timeRange) {
            const timeZone = availableLocations.find(
              (loc) => loc.loc_name == room.room.location
            );
            let hasAccess = false;
            room.schedule.timeRange?.forEach((range) => {
              if (
                range[1].includes(
                  moment().tz(timeZone.time_zone).format("dddd")
                )
              ) {
                const currentTime = moment(
                  moment().tz(timeZone.time_zone).format("hh:mm A"),
                  "hh:mm A"
                );
                const beforeTime = moment(range[0][0], "hh:mm A");
                const afterTime = moment(range[0][1], "hh:mm A");
                console.log(
                  beforeTime,
                  afterTime,
                  currentTime,
                  currentTime.isBetween(beforeTime, afterTime)
                );
                if (currentTime.isBetween(beforeTime, afterTime)) {
                  hasAccess = true;
                }
              }
            });
            if (hasAccess) {
              let cams = room?.room?.cameras_assigned_to_rooms
                ?.map((cam) => {
                  return {
                    cam_id: cam?.camera?.cam_id,
                    cam_name: cam?.camera?.cam_name,
                    description: cam?.camera?.description,
                    stream_uri: cam?.camera?.stream_uri,
                  };
                })
                .filter((cam) => cam?.cam_id);
              finalRooms.push({
                room_id: room.room.room_id,
                room_name: room.room.room_name,
                location: room.room.location,
                cameras: cams,
              });
            }
          } else {
            let cams = room?.room?.cameras_assigned_to_rooms
              ?.map((cam) => {
                return {
                  cam_id: cam?.camera?.cam_id,
                  cam_name: cam?.camera?.cam_name,
                  description: cam?.camera?.description,
                  stream_uri: cam?.camera?.stream_uri,
                };
              })
              .filter((cam) => cam?.cam_id);

            finalRooms.push({
              room_id: room.room.room_id,
              room_name: room.room.room_name,
              location: room.room.location,
              cameras: cams,
            });
          }
        });
      });

      finalRooms = _.uniqBy(finalRooms, "room_id");
      return finalRooms;
    } else {
      let rooms;

      if (user.role == "Admin") {
        rooms = await Room.findAll({
          where: {
            cust_id: user.cust_id,
            location: user.location.accessable_locations,
          },
          include: [
            {
              model: CamerasInRooms,
              include: [
                {
                  model: Camera,
                },
              ],
            },
          ],
        });
        
      } else if (user.role == "Teacher") {
        rooms = await RoomsInTeacher.findAll({
          where: { teacher_id: user.user_id },
          include: [
            {
              model: CamerasInRooms,
              include: [
                {
                  model: Camera,
                },
              ],
            },
            { model: Room, as: "room", raw: true },
          ],
        });
      } else {
        rooms = await Room.findAll({
          where: {
            user_id: user.user_id,
          },
          include: [
            {
              model: CamerasInRooms,
              include: [
                {
                  model: Camera,
                },
              ],
            },
          ],
        });
      }

      rooms = rooms?.map((room) => {
        let cameras = room.dataValues.cameras_assigned_to_rooms
          ?.map((cam) => {
            return {
              cam_id: cam?.camera?.cam_id,
              cam_name: cam?.camera?.cam_name,
              description: cam?.camera?.description,
              stream_uri: cam?.camera?.stream_uri,
            };
          })
          .filter((cam) => cam?.cam_id);
        return {
          room_id: room.room_id,
          room_name:
            room.room_name || room.dataValues?.room?.dataValues?.room_name,
          location:
            room.location || room.dataValues?.room?.dataValues?.location,
          cameras: cameras,
        };
      });
      return rooms;
    }
  },

  getAllCamForUser: async (user) => {
    const {
      Camera,
      Room,
      Child,
      RoomsInChild,
      CamerasInRooms,
      CustomerLocations,
    } = await connectToDatabase();

    let availableLocations = await CustomerLocations.findAll({
      where: { cust_id: user.cust_id },
      raw: true,
    });

    if (user?.family_id) {
      let cameras = await Child.findAll({
        where: { family_id: user.family_id, status: "enabled" },
        include: [
          {
            model: RoomsInChild,
            as: "roomsInChild",
            where: {
              disabled: "false",
            },
            include: [
              {
                model: Room,
                as: "room",
                where: {
                  location: user.location.accessable_locations,
                },
                include: [
                  {
                    model: CamerasInRooms,
                    include: [
                      {
                        model: Camera,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      const finalResult = cameras?.map((child) => {
        let finalRooms = [];
        child?.roomsInChild?.forEach((room) => {
          if (room?.schedule?.timeRange) {
            const timeZone = availableLocations.find(
              (loc) => loc.loc_name == room.room.location
            );
            let hasAccess = false;
            room.schedule.timeRange?.forEach((range) => {
              if (
                range[1].includes(
                  moment().tz(timeZone.time_zone).format("dddd")
                )
              ) {
                const currentTime = moment(
                  moment().tz(timeZone.time_zone).format("hh:mm A"),
                  "hh:mm A"
                );
                const beforeTime = moment(range[0][0], "hh:mm A");
                const afterTime = moment(range[0][1], "hh:mm A");
                console.log(
                  beforeTime,
                  afterTime,
                  currentTime,
                  currentTime.isBetween(beforeTime, afterTime)
                );
                if (currentTime.isBetween(beforeTime, afterTime)) {
                  hasAccess = true;
                }
              }
            });
            if (hasAccess) {
              let cams = room?.room?.cameras_assigned_to_rooms
                ?.map((cam) => {
                  return {
                    cam_id: cam?.camera?.cam_id,
                    cam_name: cam?.camera?.cam_name,
                    description: cam?.camera?.description,
                    stream_uri: cam?.camera?.stream_uri,
                  };
                })
                .filter((cam) => cam?.cam_id);
              finalRooms.push({
                room_id: room.room.room_id,
                room_name: room.room.room_name,
                location: room.room.location,
                cameras: cams,
              });
            }
          } else {
            let cams = room?.room?.cameras_assigned_to_rooms
              ?.map((cam) => {
                return {
                  cam_id: cam?.camera?.cam_id,
                  cam_name: cam?.camera?.cam_name,
                  description: cam?.camera?.description,
                  stream_uri: cam?.camera?.stream_uri,
                };
              })
              .filter((cam) => cam?.cam_id);

            finalRooms.push({
              room_id: room.room.room_id,
              room_name: room.room.room_name,
              location: room.room.location,
              cameras: cams,
            });
          }
        });
        return {
          childFirstName: child.first_name,
          childLastName: child.last_name,
          rooms: finalRooms,
        };
      });

      return finalResult;
    } else {
      if (user.role == "Admin") {
        let locations = await CustomerLocations.findAll({
          where: {
            loc_name: user.location.accessable_locations,
          },
          attributes: ["loc_name"],
          include: [
            {
              model: Room,
              attributes: ["room_id", "room_name"],
              include: [
                {
                  model: CamerasInRooms,
                  include: [
                    {
                      model: Camera,
                    },
                  ],
                },
              ],
            },
          ],
        });

        locations = locations?.map((loc) => {
          let rooms = loc?.rooms?.map((room) => {
            let cams = room?.cameras_assigned_to_rooms
              ?.map((cam) => {
                return {
                  cam_id: cam?.camera?.cam_id,
                  cam_name: cam?.camera?.cam_name,
                  description: cam?.camera?.description,
                  stream_uri: cam?.camera?.stream_uri,
                };
              })
              .filter((cam) => cam?.cam_id);
            return {
              room_id: room.room_id,
              room_name: room.room_name,
              cameras: cams,
            };
          });

          return { location: loc.loc_name, rooms: rooms };
        });

        return locations;
      } else {
        let locations = await CustomerLocations.findAll({
          where: {
            loc_name: user.location.accessable_locations,
          },
          attributes: ["loc_name"],
          include: [
            {
              model: Room,
              as: "room",
              attributes: ["room_id", "room_name"],
              where: {
                user_id: user.user_id,
              },
              include: [
                {
                  model: CamerasInRooms,
                  include: [
                    {
                      model: Camera,
                    },
                  ],
                },
              ],
            },
          ],
        });
        locations = locations?.map((loc) => {
          let rooms = loc?.rooms?.map((room) => {
            let cams = room?.cameras_assigned_to_rooms
              ?.map((cam) => {
                return {
                  cam_id: cam?.camera?.cam_id,
                  cam_name: cam?.camera?.cam_name,
                  description: cam?.camera?.description,
                  stream_uri: cam?.camera?.stream_uri,
                };
              })
              .filter((cam) => cam?.cam_id);
            return {
              room_id: room.room_id,
              room_name: room.room_name,
              cameras: cams,
            };
          });

          return { location: loc.loc_name, rooms: rooms };
        });
        return locations;
      }
    }
  },

  addRecentViewers: async (params, t) => {
    const { RecentViewers } = await connectToDatabase();
    let recentViewerObj = {
      ...params,
      requested_at: Sequelize.literal("CURRENT_TIMESTAMP"),
    };
    let recentViewer = await RecentViewers.create(
      {
        ...recentViewerObj,
        recent_user_id: params?.user?.family_member_id
          ? params?.user?.family_member_id
          : params?.user?.user_id,
      },
      { transaction: t }
    );

    return recentViewer;
  },

  setUserCamPreference: async (user, cams, t) => {
    const { Family, Users } = await connectToDatabase();
    let camObj = {
      cam_preference: cams,
    };
    let camSettings;
    if (user?.family_member_id) {
      camSettings = await Family.update(
        camObj,
        {
          where: {
            family_member_id: user.family_member_id,
          },
        },
        { transaction: t }
      );
    } else {
      camSettings = await Users.update(
        camObj,
        {
          where: {
            user_id: user?.user_id,
          },
        },
        { transaction: t }
      );
    }

    return camSettings;
  },
};
