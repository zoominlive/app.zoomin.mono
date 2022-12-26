const connectToDatabase = require('../models/index');
const Sequelize = require('sequelize');
const sequelize = require('../lib/database');
const _ = require('lodash');
const { cons } = require('lodash-contrib');
const rooms = require('./rooms');

module.exports = {
  /* Create new camera */
  getAllCamForLocation: async (user) => {
    const { Camera, Room, Child } = await connectToDatabase();
    let rooms = [];
    if (user?.family_id) {
      let childDetails;
      if (user?.family_id) {
        childDetails = await Child.findAll({
          raw: true,
          where: { family_id: user?.family_id, status: 'Enabled' }
        });
      }

      childDetails?.forEach((child) => {
        child?.rooms?.rooms.forEach((room) => rooms.push(room));
      });

      rooms = _.uniq(rooms);
    } else {
      rooms = await Room.findAll({
        raw: true,
        where: { cust_id: user?.cust_id, location: user.location.accessable_locations }
      });
    }

    const roomIds = rooms?.map((room) => room?.room_id);

    const searchQuery = roomIds;

    let orArray = [];
    searchQuery?.forEach((word) => {
      orArray?.push({ room_ids: { [Sequelize.Op.substring]: word } });
    });

    const cameras = await Camera.findAll({
      where: {
        [Sequelize.Op.or]: orArray
      },
      raw: true
    });

    let newCameras;
    if (user?.family_id) {
      newCameras = rooms
        ?.map((room) => {
          let camsToAdd = [];
          cameras?.forEach((cam) => {
            cam?.room_ids?.rooms?.forEach((room1) => {
              if (room1?.room_id === room?.room_id) {
                camsToAdd?.push({
                  cam_id: cam?.cam_id,
                  cam_name: cam?.cam_name,
                  description: cam?.description,
                  stream_uri: cam?.stream_uri
                });
              }
            });
          });

          return { ...room, cameras: camsToAdd };
        })
        .filter((rooms) => {
          let count = 0;

          user?.accessable_locations?.selected_locations?.forEach((location) => {
            if (rooms?.location === location) {
              count = 1;
            }
          });

          return count === 1;
        });
    } else {
      newCameras = rooms?.map((room) => {
        let camsToAdd = [];
        cameras?.forEach((cam) => {
          cam?.room_ids?.rooms?.forEach((room1) => {
            if (room1?.room_id === room?.room_id) {
              camsToAdd?.push({
                cam_id: cam?.cam_id,
                cam_name: cam?.cam_name,
                description: cam?.description,
                stream_uri: cam?.stream_uri
              });
            }
          });
        });

        return { ...room, cameras: camsToAdd };
      });
    }

    return newCameras;
  },

  getAllCamForUser: async (user) => {
    const { Camera, Room, Child, Family } = await connectToDatabase();
    let children = [];
    if (user?.family_id) {
      let childDetails;
      if (user?.family_id) {
        childDetails = await Child.findAll({
          raw: true,
          where: { family_id: user.family_id, status: 'Enabled' }
        });
      }

      let childDetailsForlocation = childDetails;

      childDetailsForlocation?.forEach((child) => {
        let rooms = [];
        child?.rooms?.rooms?.forEach((room) =>
          rooms.push({
            room
          })
        );
        children.push({
          rooms,
          childDetails: { firstName: child.first_name, lastName: child.last_name }
        });
      });

      let cameras = Promise.all(
        children?.map(async (child) => {
          const childObj = Promise.all(
            child?.rooms?.map(async (room) => {
              const query = `SELECT cam_id,cam_name , description, stream_uri FROM camera WHERE room_ids LIKE '%${room.room.room_id}%'  `;
              let cams = await sequelize.query(
                query,
                { type: Sequelize.QueryTypes.SELECT },
                {
                  model: Camera,
                  mapToModel: true
                }
              );

              return {
                ...room.room,
                cameras: cams
              };
            })
          );

          let finalChildData = await childObj;
          finalChildData = finalChildData.filter((room) => {
            let count = 0;

            user.accessable_locations.selected_locations.forEach((location) => {
              if (room.location === location) {
                count = 1;
              }
            });

            return count == 1;
          });

          return {
            childFirstName: child.childDetails.firstName,
            childLastName: child.childDetails.lastName,
            rooms: finalChildData
          };
        })
      );
      const cameraDetails = await cameras;
      return cameraDetails;
    } else {
      if (user.role == 'Admin') {
        children = await Room.findAll({
          raw: true,
          where: { cust_id: user?.cust_id, location: user.location.accessable_locations },
          attributes: ['room_id', 'room_name', 'location']
        });
      } else {
        children = await Room.findAll({
          raw: true,
          where: { user_id: user?.user_id },
          attributes: ['room_id', 'room_name', 'location']
        });
      }

      let roomIds = children.map((room) => {
        return { room_ids: { [Sequelize.Op.substring]: room.room_id } };
      });

      let cameras = await Camera.findAll({
        where: {
          [Sequelize.Op.or]: roomIds
        }
      });

      let locations;
      locations = user?.location?.accessable_locations;

      const finalResponse = locations?.map((loc) => {
        let rooms = children?.filter((room) => room.location == loc);
        let finalrooms = rooms?.map((room) => {
          let camsInRoom = [];
          cameras?.forEach((cam) => {
            cam?.room_ids?.rooms?.forEach((room1) => {
              if (room1.room_id === room.room_id) {
                camsInRoom.push({
                  cam_id: cam.cam_id,
                  cam_name: cam.cam_name,
                  description: cam.description,
                  stream_uri: cam.stream_uri
                });
              }
            });
          });

          return { room_id: room?.room_id, room_name: room?.room_name, cameras: camsInRoom };
        });

        return { location: loc, rooms: finalrooms };
      });
      return finalResponse;
    }
  },

  addRecentViewers: async (params, t) => {
    const { RecentViewers } = await connectToDatabase();
    let recentViewerObj = { ...params, requested_at: Sequelize.literal('CURRENT_TIMESTAMP') };
    let recentViewer;
    let viewerAlreadyExist = await RecentViewers.findOne(
      {
        where: {
          user_id: params?.user?.family_member_id
            ? params?.user?.family_member_id
            : params?.user?.user_id
        },
        raw: true
      },
      { transaction: t }
    );
    if (!viewerAlreadyExist) {
      recentViewer = await RecentViewers.create(
        {
          ...recentViewerObj,
          user_id: params?.user?.family_member_id
            ? params?.user?.family_member_id
            : params?.user?.user_id
        },
        { transaction: t }
      );
    } else {
      recentViewer = await RecentViewers.update(
        recentViewerObj,
        {
          returning: true,
          where: {
            user_id: params?.user?.family_member_id
              ? params?.user?.family_member_id
              : params?.user?.user_id
          }
        },
        { transaction: t }
      );
    }

    return recentViewer;
  },

  getRecentViewers: async () => {
    const { RecentViewers } = await connectToDatabase();
    let twoHoursBefore = new Date();
    twoHoursBefore.setHours(twoHoursBefore.getHours() - 2);

    const currentTime = new Date();

    let recentViewers = await RecentViewers.findAll({
      raw: true,
      where: {
        requested_at: {
          [Sequelize.Op.between]: [twoHoursBefore.toISOString(), currentTime.toISOString()]
        }
      }
    });

    return recentViewers;
  },

  setUserCamPreference: async (user, cams, t) => {
    const { Family, Users } = await connectToDatabase();
    let camObj = {
      cam_preference: cams
    };
    let camSettings;
    if (user?.family_member_id) {
      camSettings = await Family.update(
        camObj,
        {
          where: {
            family_member_id: user.family_member_id
          }
        },
        { transaction: t }
      );
    } else {
      camSettings = await Users.update(
        camObj,
        {
          where: {
            user_id: user?.user_id
          }
        },
        { transaction: t }
      );
    }

    return camSettings;
  }
};
