const { Camera, Room, RecentViewers, Child, Family } = require('../models/index');
const Sequelize = require('sequelize');
const sequelize = require('../lib/database');
const _ = require('lodash');
const { cons } = require('lodash-contrib');

module.exports = {
  /* Create new camera */
  getAllCamForLocation: async (user) => {
    let rooms = [];
    if (user?.family_id) {
      let childDetails;
      if (user?.family_id) {
        childDetails = await Child.findAll({
          raw: true,
          where: { family_id: user.family_id, status: 'Enabled' }
        });
      }

      childDetails?.forEach((child) => {
        child?.rooms?.rooms.forEach((room) => rooms.push(room));
      });

      rooms = _.uniq(rooms);
    } else {
      rooms = await Room.findAll({
        raw: true,
        where: { user_id: user.user_id }
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

    let newCameras = rooms
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

        user.accessable_locations.selected_locations.forEach((location) => {
          if (rooms.location === location) {
            count = 1;
          }
        });

        return count === 1;
      });

    return newCameras;
  },

  getAllCamForUser: async (user) => {
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
      children = await Room.findAll({
        raw: true,
        where: { user_id: user.user_id }
      });

      let families = await Family.findAll({
        where: { member_type: 'primary', user_id: user.user_id },
        raw: true
      });

      let familyIds = families.map((family) => family.family_id);

      let children1 = await Child.findAll({
        where: { family_Id: familyIds },
        raw: true
      });

      let cameras = Promise.all(
        children?.map(async (room) => {
          const query = `SELECT cam_id,cam_name , description, stream_uri FROM camera WHERE room_ids LIKE '%${room.room_id}%'  `;
          let cams = await sequelize.query(
            query,
            { type: Sequelize.QueryTypes.SELECT },
            {
              model: Camera,
              mapToModel: true
            }
          );

          return { ...room, cameras: cams };
        })
      );
      const cameraDetails = await cameras;

      const childDetails = children1.map((child) => {
        const rooms = child.rooms.rooms.map((room) => {
          let cam = [];

          cameraDetails.forEach((room1) => {
            if (room.room_id === room.room_id) {
              cam = room1.cameras;
            }
          });

          return { ...room, cameras: cam };
        });

        return { childFirstName: null, childLastName: null, rooms: rooms };
      });

      return childDetails;
    }
  },

  addRecentViewers: async (params) => {
    let recentViewerObj = { ...params, requested_at: Sequelize.literal('CURRENT_TIMESTAMP') };
    let recentViewer;
    let viewerAlreadyExist = await RecentViewers.findOne({
      where: {
        user_id: params?.user?.family_member_id
          ? params?.user?.family_member_id
          : params?.user?.user_id
      },
      raw: true
    });
    if (!viewerAlreadyExist) {
      recentViewer = await RecentViewers.create({
        ...recentViewerObj,
        user_id: params?.user?.family_member_id
          ? params?.user?.family_member_id
          : params?.user?.user_id
      });
    } else {
      recentViewer = await RecentViewers.update(recentViewerObj, {
        where: {
          user_id: params?.user?.family_member_id
            ? params?.user?.family_member_id
            : params?.user?.user_id
        }
      });
    }

    return recentViewer;
  },

  getRecentViewers: async () => {
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
  }
};
