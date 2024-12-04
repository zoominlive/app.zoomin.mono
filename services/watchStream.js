const connectToDatabase = require("../models/index");
const Sequelize = require("sequelize");
const _ = require("lodash");
const moment = require("moment-timezone");
const customerServices = require("../services/customers");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

const liveStream = require("./liveStream");
const livestreamCameras = require("./livestreamCameras");
// const livestreamCameras = require("./livestreamCameras");
module.exports = {
  /* Create new camera */
  getAllCamForLocation: async (user) => {
    try {
      const {
        Camera,
        Room,
        Child,
        RoomsInChild,
        CamerasInRooms,
        CustomerLocations,
        RoomsInTeacher,
        LiveStreamCameras,
      } = await connectToDatabase();

      let availableLocations = await CustomerLocations.findAll({
        where: { cust_id: user.cust_id },
        raw: true,
      });

      if (user?.family_id) {
        console.log("user-->", user);
        const baseUrl = await customerServices.getTranscoderUrlFromCustLocations(user?.locations.map((item) => item.loc_id), user?.cust_id);
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
                  where: { loc_id: user.locations.map((item) => item.dataValues.loc_id) },
                  include: [
                    {
                      model: CamerasInRooms,
                      include: [
                        {
                          model: Camera,
                        },
                      ],
                    },
                    {
                      model: LiveStreamCameras,
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
                (loc) => loc.loc_id == room.room.loc_id
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
                    let uid = user?.family_member_id || user?.user_id;
                    let sid = cam?.camera?.cam_id;
                    let uuid = uuidv4();
                    const token = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
                    return {
                      cam_id: cam?.camera?.cam_id,
                      cam_name: cam?.camera?.cam_name,
                      description: cam?.camera?.description,
                      stream_uri: `${baseUrl}${cam?.camera?.stream_uri}?seckey=${token}`
                      
                    };
                  })
                  .filter((cam) => cam?.cam_id);

                let livStreamCams = room.room?.live_stream_cameras?.map((cam) => {
                  let uid = user?.family_member_id || user?.user_id;
                  let sid = cam?.stream_uri.split('/') [cam?.stream_uri.split('/').length - 1].split('.')[0];
                  let uuid = uuidv4();
                  const token = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
                  return {
                    cam_id: cam?.cam_id,
                    cam_name: cam?.cam_name,
                    description: cam?.description || "",
                    stream_uri: `${cam?.stream_uri}?seckey=${token}`,
                  };
                });
                cams = cams.concat(livStreamCams);

                finalRooms.push({
                  room_id: room.room.room_id,
                  room_name: room.room.room_name,
                  location: room.room.loc_id,
                  cameras: cams,
                });
              }
            } else {
              let cams = room?.room?.cameras_assigned_to_rooms
                ?.map((cam) => {
                  let uid = user?.family_member_id || user?.user_id;
                  let sid = cam?.camera?.cam_id;
                  let uuid = uuidv4();
                  const token = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
                  return {
                    cam_id: cam?.camera?.cam_id,
                    cam_name: cam?.camera?.cam_name,
                    description: cam?.camera?.description,
                    stream_uri: `${baseUrl}${cam?.camera?.stream_uri}?seckey=${token}`,
                  };
                })
                .filter((cam) => cam?.cam_id);

              let livStreamCams = room.room?.live_stream_cameras?.map((cam) => {
                let uid = user?.family_member_id || user?.user_id;
                let sid = cam?.stream_uri.split('/') [cam?.stream_uri.split('/').length - 1].split('.')[0];
                let uuid = uuidv4();
                const token = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
                return {
                  cam_id: cam?.cam_id,
                  cam_name: cam?.cam_name,
                  description: cam?.description || "",
                  stream_uri: `${cam?.stream_uri}?seckey=${token}`,
                };
              });
              cams = cams.concat(livStreamCams);

              finalRooms.push({
                room_id: room.room.room_id,
                room_name: room.room.room_name,
                location: room.room.loc_id,
                cameras: cams,
              });
            }
          });
        });

        finalRooms = _.uniqBy(finalRooms, "room_id");
        return finalRooms;
      } else {
        let rooms;

        if (user.role == "Admin" || user.role == "Super Admin" || user.role == "User") {
          let loc_obj = {};
          if (user.role == "Super Admin") {
            let availableLocations = await customerServices.getLocationDetails(
              user.cust_id || req?.query?.cust_id
            );
            let locs = availableLocations.flatMap((i) => i.loc_id);
            loc_obj = { loc_id: locs };
          } else {            
            loc_obj = { loc_id: user.locations.map((item) => item.loc_id) };
          }
          rooms = await Room.findAll({
            where: {
              cust_id: user.cust_id,
              ...loc_obj,
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
              {
                model: LiveStreamCameras,
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
              {
                model: LiveStreamCameras,
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
              {
                model: LiveStreamCameras,
              },
            ],
          });
        }
        
        rooms = await Promise.all(
          rooms?.map(async (room) => {
            //.filter((cam) => cam?.cam_id);
            const location = user.role == "Teacher" ? room?.dataValues?.room?.dataValues?.location : room?.loc_id;
            const baseUrl = await customerServices.getTranscoderUrlFromCustLocations(location, user?.cust_id)
            let cameras = room.dataValues.cameras_assigned_to_rooms
            ?.map((cam) => {
                let uid = user?.family_member_id || user?.user_id;
                let sid = cam?.camera?.cam_id;
                let uuid = uuidv4();
                const token = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
                return {
                  cam_id: cam?.camera?.cam_id,
                  cam_name: cam?.camera?.cam_name,
                  description: cam?.camera?.description,
                  stream_uri: `${baseUrl}${cam?.camera?.stream_uri}?seckey=${token}`,
                };
              })
              .filter((cam) => cam?.cam_id);
    
            let livStreamCameras = room.dataValues.live_stream_cameras?.map(
              (cam) => {
                let uid = user?.family_member_id || user?.user_id;
                let sid = cam?.stream_uri.split('/') [cam?.stream_uri.split('/').length - 1].split('.')[0];
                let uuid = uuidv4();
                const token = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
                return {
                  cam_id: cam?.cam_id,
                  cam_name: cam?.cam_name,
                  description: cam?.description || "",
                  stream_uri: `${cam?.stream_uri}?seckey=${token}`,
                };
              }
            );
            cameras = cameras.concat(livStreamCameras);
    
            return {
              room_id: room.room_id,
              room_name:
                room.room_name || room.dataValues?.room?.dataValues?.room_name,
              location:
                room.loc_id || room.dataValues?.room?.dataValues?.loc_id,
              cameras: cameras,
            };
          })
        ) 
        return rooms;
      }
    } catch (error) {
      console.log('error==>', error);
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
      LiveStreamCameras,
      RoomsInTeacher,
    } = await connectToDatabase();

    let availableLocations = await CustomerLocations.findAll({
      where: { cust_id: user.cust_id },
      raw: true,
    });

    const liveStreamCameras = await livestreamCameras.getAllLivestreamCameras();
    let liveStreamObj;
    let sendbird_channel_url;
    let streamName;
    if(!_.isEmpty(liveStreamCameras)) {
      let liveStreamRoomID = liveStreamCameras[0]?.room_id;
      liveStreamObj = await liveStream.getActiveStreamObjByRoomId(liveStreamRoomID);
      sendbird_channel_url = liveStreamObj[0]?.sendbird_channel_url;
      streamName = liveStreamObj[0]?.stream_name;
    }
    if (user?.family_id) {
      // console.log('user-->', user);
      const baseUrl = await customerServices.getTranscoderUrlFromCustLocations(user?.locations?.map((item) => item.loc_id), user?.cust_id);
      console.log('baseUrl==>',baseUrl);
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
                  loc_id: user.locations.map((item) => item.loc_id),
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
                  {
                    model: LiveStreamCameras,
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
                  let uid = user?.family_member_id || user?.user_id;
                  let sid = cam?.camera?.cam_id;
                  let uuid = uuidv4();
                  const token = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
                  return {
                    cam_id: cam?.camera?.cam_id,
                    cam_name: cam?.camera?.cam_name,
                    thumbnail: cam?.camera?.thumbnail,
                    description: cam?.camera?.description,
                    sendbird_channel_url: '',
                    stream_uri: `${baseUrl}${cam?.camera?.stream_uri}?seckey=${token}`,
                  };
                })
                .filter((cam) => cam?.cam_id);

              let livStreamCams = room.room?.live_stream_cameras?.map((cam) => {
                let uid = user?.family_member_id || user?.user_id;
                let sid = cam?.stream_uri.split('/') [cam?.stream_uri.split('/').length - 1].split('.')[0];
                let uuid = uuidv4();
                const token = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
                return {
                  cam_id: cam?.cam_id,
                  cam_name: cam?.cam_name,
                  thumbnail: cam?.thumbnail,
                  description: cam?.description || streamName,
                  sendbird_channel_url: sendbird_channel_url,
                  stream_uri:`${cam?.stream_uri}?seckey=${token}`,
                };
              });
              cams = cams.concat(livStreamCams);

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
                let uid = user?.family_member_id || user?.user_id;
                let sid = cam?.camera?.cam_id;
                let uuid = uuidv4();
                const token = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
                return {
                  cam_id: cam?.camera?.cam_id,
                  cam_name: cam?.camera?.cam_name,
                  thumbnail: cam?.camera?.thumbnail,
                  description: cam?.camera?.description,
                  sendbird_channel_url: '',
                  stream_uri: `${baseUrl}${cam?.camera?.stream_uri}?seckey=${token}`,
                };
              })
              .filter((cam) => cam?.cam_id);
            let livStreamCams = room.room?.live_stream_cameras?.map((cam) => {
              let uid = user?.family_member_id || user?.user_id;
              let sid = cam?.stream_uri.split('/') [cam?.stream_uri.split('/').length - 1].split('.')[0];
              let uuid = uuidv4();
              const token = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
              return {
                cam_id: cam?.cam_id,
                cam_name: cam?.cam_name,
                thumbnail: cam?.thumbnail,
                description: cam?.description || streamName,
                sendbird_channel_url: sendbird_channel_url,
                stream_uri: `${cam?.stream_uri}?seckey=${token}`,
              };
            });
            cams = cams.concat(livStreamCams);
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
      if (user.role == "Admin" || user.role == "User") {
        let locations = await CustomerLocations.findAll({
          where: {
            loc_name: user.locations.map((item) => item.loc_name),
            cust_id: user.cust_id
          },
          attributes: ["loc_name", "transcoder_endpoint"],
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
                {
                  model: LiveStreamCameras,
                },
              ],
            },
          ],
        });

        locations = locations?.map((loc) => {
          let rooms = loc?.rooms?.map((room) => {
            let cams = room?.cameras_assigned_to_rooms
              ?.map((cam) => {
                let uid = user?.family_member_id || user?.user_id;
                let sid = cam?.camera?.cam_id;
                let uuid = uuidv4();
                const token = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
                return {
                  cam_id: cam?.camera?.cam_id,
                  cam_name: cam?.camera?.cam_name,
                  thumbnail: cam?.camera?.thumbnail,
                  description: cam?.camera?.description,
                  sendbird_channel_url: '',
                  stream_uri: `${loc?.transcoder_endpoint}${cam?.camera?.stream_uri}?seckey=${token}`,
                };
              })
              .filter((cam) => cam?.cam_id);
            let livStreamCams = room.live_stream_cameras?.map((cam) => {
              let uid = user?.family_member_id || user?.user_id;
              let sid = cam?.stream_uri.split('/') [cam?.stream_uri.split('/').length - 1].split('.')[0];
              let uuid = uuidv4();
              const token = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
              return {
                cam_id: cam?.cam_id,
                cam_name: cam?.cam_name,
                thumbnail: cam?.thumbnail,
                description: cam?.description || streamName,
                sendbird_channel_url: sendbird_channel_url,
                stream_uri: `${cam?.stream_uri}?seckey=${token}`,
              };
            });
            cams = cams.concat(livStreamCams);
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
        console.log('user==>', user);
        let locations = await CustomerLocations.findAll({
          where: {
            loc_name: user.locations.map((item) => item.loc_name),
          },
          attributes: ["loc_name", "transcoder_endpoint"],
          include: [
            {
              model: Room,
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
                {
                  model: LiveStreamCameras,
                },
              ],
            },
          ],
        });
        if (user.role == "Teacher") {
          const baseUrl = await customerServices.getTranscoderUrlFromCustLocations(user?.locations?.map((item) => item.loc_id), user?.cust_id);
          let rooms = await RoomsInTeacher.findAll({
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
              {
                model: LiveStreamCameras,
                raw: true,
              },
              {
                model: Room,
                as: "room",
                raw: true,
                where: {
                  loc_id: user.locations.map((item) => item.loc_id),
                },
              },
            ],
          });
          rooms = rooms?.map((room) => {
            //.filter((cam) => cam?.cam_id);

            let cameras = room.dataValues.cameras_assigned_to_rooms
              ?.map((cam) => {
                let uid = user?.family_member_id || user?.user_id;
                let sid = cam?.camera?.cam_id;
                let uuid = uuidv4();
                const token = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
                return {
                  cam_id: cam?.camera?.cam_id,
                  cam_name: cam?.camera?.cam_name,
                  thumbnail: cam?.camera?.thumbnail,
                  description: cam?.camera?.description,
                  sendbird_channel_url: '',
                  stream_uri: `${baseUrl}${cam?.camera?.stream_uri}?seckey=${token}`
                  ,
                };
              })
              .filter((cam) => cam?.cam_id);

            let livStreamCameras = room.dataValues.live_stream_cameras?.map(
              (cam) => {
                let uid = user?.family_member_id || user?.user_id;
                let sid = cam?.stream_uri.split('/') [cam?.stream_uri.split('/').length - 1].split('.')[0];
                let uuid = uuidv4();
                const token = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
                return {
                  cam_id: cam?.cam_id,
                  cam_name: cam?.cam_name,
                  thumbnail: cam?.thumbnail,
                  description: cam?.description || streamName,
                  sendbird_channel_url: sendbird_channel_url,
                  stream_uri: `${cam?.stream_uri}?seckey=${token}`,
                };
              }
            );
            cameras = cameras.concat(livStreamCameras);
            return {
              room_id: room.room_id,
              room_name:
                room.room_name || room.dataValues?.room?.dataValues?.room_name,
              location:
                room.location || room.dataValues?.room?.dataValues?.loc_id,
              cameras: cameras,
            };
          });
        
          for (const item of rooms) {
            const location = await CustomerLocations.findOne({ where: { loc_id: item.location } });
            item.location = location.loc_name;
          }
          let result = _.chain(rooms)
            .groupBy("location")
            .map((value, key) => ({
              location: key,
              rooms: value,
            }))
            .value();

          result = result.map((item) => {
            let { rooms, ...rest } = item;
            let newRooms = _.map(rooms, (object) => {
              return _.omit(object, ["location"]);
            });
            return {
              ...rest,
              rooms: newRooms,
            };
          });

          return result;
        }
        locations = locations?.map((loc) => {
          let rooms = loc?.rooms?.map((room) => {
            let cams = room?.cameras_assigned_to_rooms
              ?.map((cam) => {
                let uid = user?.family_member_id || user?.user_id;
                let sid = cam?.camera?.cam_id;
                let uuid = uuidv4();
                const token = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
                return {
                  cam_id: cam?.camera?.cam_id,
                  cam_name: cam?.camera?.cam_name,
                  thumbnail: cam?.camera?.thumbnail,
                  description: cam?.camera?.description,
                  sendbird_channel_url: '',
                  stream_uri: `${loc?.transcoder_endpoint}${cam?.camera?.stream_uri}?seckey=${token}`
                  ,
                };
              })
              .filter((cam) => cam?.cam_id);
            console.log(
              "===room.live_stream_cameras==",
              room.live_stream_cameras
            );
            let livStreamCams = room.live_stream_cameras?.map((cam) => {
              let uid = user?.family_member_id || user?.user_id;
              let sid = cam?.stream_uri.split('/') [cam?.stream_uri.split('/').length - 1].split('.')[0];
              let uuid = uuidv4();
              const token = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
              return {
                cam_id: cam?.cam_id,
                cam_name: cam?.cam_name,
                thumbnail: cam?.thumbnail,
                description: cam?.description || streamName,
                sendbird_channel_url: sendbird_channel_url,
                stream_uri: `${cam?.stream_uri}?seckey=${token}`,
              };
            });
            cams = cams.concat(livStreamCams);

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
    const { Family, Users, CamPreference } = await connectToDatabase();
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
      if (user.role === "Super Admin") {
        let prefrenceDetails = await CamPreference.findOne({
          where: { cust_id: cams.cust_id },
          raw: true,
        });
  
        let { cust_id, ...rest } = cams;
        if (prefrenceDetails) {
          camSettings = await CamPreference.update(
            { watchstream_cam: rest },
            {
              where: {
                cust_id: cams.cust_id,
              },
            }
          );
        } else {
          camSettings = await CamPreference.create({
            cust_id: cust_id,
            watchstream_cam: rest,
          });
        }
      } 
      else{

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
    }

    return camSettings;
  },

  getCamPreference: async (custId) => {
    const { CamPreference } = await connectToDatabase();
    let prefrenceDetails = await CamPreference.findOne({
      where: { cust_id: custId },
      raw: true,
    });
     
    return prefrenceDetails?.watchstream_cam
  },

  reportViewers: async (params, t) => {
    const { MountedCameraRecentViewers } = await connectToDatabase();
    let recentViewerObj = {
      ...params,
      requested_at: Sequelize.literal("CURRENT_TIMESTAMP"),
    };
    let recentViewer = await MountedCameraRecentViewers.create(
      recentViewerObj,
      { transaction: t }
    );

    return recentViewer;
  },

   /* Create sec token */
   createSecToken: async (uId, sId, uuId) => {
    const token = jwt.sign({ user_id: uId, cam_id: sId, uuid: uuId }, process.env.STREAM_URL_SECRET_KEY);
    return { token };
  },
};
