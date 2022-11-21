const { Camera, Room, RecentViewers, Child } = require('../models/index');
const Sequelize = require('sequelize');
const sequelize = require('../lib/database');
const _ = require('lodash');

module.exports = {
  /* Create new camera */
  getAllCamForLocation: async (user, location) => {
    let rooms = [];
    if (user?.family_id) {
      let childDetails;
      if (user?.family_id) {
        childDetails = await Child.findAll({
          raw: true,
          where: { family_id: user.family_id }
        });
      }

      let childDetailsForlocation = [];
      childDetails?.forEach((child) => {
        let count = 0;
        child?.location?.locations?.forEach((loc) => {
          if (loc === location) {
            count = count + 1;
          }
        });

        if (count > 0) {
          childDetailsForlocation.push(child);
        }
      });

      childDetailsForlocation?.forEach((child) => {
        child?.rooms?.rooms.forEach((room) => rooms.push(room));
      });

      rooms = _.uniq(rooms);
    } else {
      rooms = await Room.findAll({
        raw: true,
        where: { user_id: user.user_id, location: location }
      });
    }

    let cameras = Promise.all(
      rooms.map(async (room) => {
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
    return cameraDetails;
  },

  getAllCamForUser: async (user) => {
    let children = [];
    if (user?.family_id) {
      let childDetails;
      if (user?.family_id) {
        childDetails = await Child.findAll({
          raw: true,
          where: { family_id: user.family_id }
        });
      }

      let childDetailsForlocation = childDetails;

      childDetailsForlocation?.forEach((child) => {
        let rooms = [];
        child?.rooms?.rooms.forEach((room) =>
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
        children.map(async (child) => {
          const childObj = Promise.all(
            child.rooms.map(async (room) => {
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
          const finalChildData = await childObj;
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

      let cameras = Promise.all(
        children.map(async (room) => {
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
      return cameraDetails;
    }
  },

  addRecentViewers: async (params) => {
    let recentViewerObj = { ...params, requested_at: Sequelize.literal('CURRENT_TIMESTAMP') };
    let recentViewer;
    let viewerAlreadyExist = await RecentViewers.count({ where: { user_id: params.user_id } });
    if (viewerAlreadyExist === 0) {
      recentViewer = await RecentViewers.create(recentViewerObj);
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
