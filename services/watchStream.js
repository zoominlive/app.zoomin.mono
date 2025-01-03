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
        Zone,
        Child,
        ZonesInChild,
        CamerasInZones,
        CustomerLocations,
        ZonesInTeacher,
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
              model: ZonesInChild,
              where: {
                disabled: "false",
              },
              as: "zonesInChild",
              include: [
                {
                  model: Zone,
                  as: "zone",
                  where: { loc_id: user.locations.map((item) => item.dataValues.loc_id) },
                  include: [
                    {
                      model: CamerasInZones,
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

        let finalZones = [];
        cameras?.forEach((zones) => {
          zones?.zonesInChild?.forEach((zone) => {
            if (zone?.schedule?.timeRange) {
              const timeZone = availableLocations.find(
                (loc) => loc.loc_id == zone.zone.loc_id
              );
              let hasAccess = false;
              zone.schedule.timeRange?.forEach((range) => {
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
                let cams = zone?.zone?.cameras_assigned_to_zones
                  ?.map((cam) => {
                    let uid = user?.family_member_id || user?.user_id;
                    let sid = cam?.camera?.cam_id;
                    let uuid = uuidv4();
                    const token = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
                    return {
                      cam_id: cam?.camera?.cam_id,
                      cam_name: cam?.camera?.cam_name,
                      description: cam?.camera?.description,
                      cam_alias: cam?.camera?.cam_alias,
                      stream_uri: `${baseUrl}${cam?.camera?.stream_uri}?seckey=${token}`
                      
                    };
                  })
                  .filter((cam) => cam?.cam_id);

                let livStreamCams = zone.zone?.live_stream_cameras?.map((cam) => {
                  let uid = user?.family_member_id || user?.user_id;
                  let sid = cam?.stream_uri.split('/') [cam?.stream_uri.split('/').length - 1].split('.')[0];
                  let uuid = uuidv4();
                  const token = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
                  return {
                    cam_id: cam?.cam_id,
                    cam_name: cam?.cam_name,
                    description: cam?.description || "",
                    cam_alias: cam?.camera?.cam_alias,
                    stream_uri: `${cam?.stream_uri}?seckey=${token}`,
                  };
                });
                cams = cams.concat(livStreamCams);

                finalZones.push({
                  zone_id: zone.zone.zone_id,
                  zone_name: zone.zone.zone_name,
                  location: zone.zone.loc_id,
                  cameras: cams,
                });
              }
            } else {
              let cams = zone?.zone?.cameras_assigned_to_zones
                ?.map((cam) => {
                  let uid = user?.family_member_id || user?.user_id;
                  let sid = cam?.camera?.cam_id;
                  let uuid = uuidv4();
                  const token = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
                  return {
                    cam_id: cam?.camera?.cam_id,
                    cam_name: cam?.camera?.cam_name,
                    description: cam?.camera?.description,
                    cam_alias: cam?.camera?.cam_alias,
                    stream_uri: `${baseUrl}${cam?.camera?.stream_uri}?seckey=${token}`,
                  };
                })
                .filter((cam) => cam?.cam_id);

              let livStreamCams = zone.zone?.live_stream_cameras?.map((cam) => {
                let uid = user?.family_member_id || user?.user_id;
                let sid = cam?.stream_uri.split('/') [cam?.stream_uri.split('/').length - 1].split('.')[0];
                let uuid = uuidv4();
                const token = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
                return {
                  cam_id: cam?.cam_id,
                  cam_name: cam?.cam_name,
                  description: cam?.description || "",
                  cam_alias: cam?.camera?.cam_alias,
                  stream_uri: `${cam?.stream_uri}?seckey=${token}`,
                };
              });
              cams = cams.concat(livStreamCams);

              finalZones.push({
                zone_id: zone.zone.zone_id,
                zone_name: zone.zone.zone_name,
                location: zone.zone.loc_id,
                cameras: cams,
              });
            }
          });
        });

        finalZones = _.uniqBy(finalZones, "zone_id");
        return finalZones;
      } else {
        let zones;

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
          zones = await Zone.findAll({
            where: {
              cust_id: user.cust_id,
              ...loc_obj,
            },
            include: [
              {
                model: CamerasInZones,
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
          zones = await ZonesInTeacher.findAll({
            where: { teacher_id: user.user_id },
            include: [
              {
                model: CamerasInZones,
                include: [
                  {
                    model: Camera,
                  },
                ],
              },
              {
                model: LiveStreamCameras,
              },
              { model: Zone, as: "zone", raw: true },
            ],
          });
        } else {
          zones = await Zone.findAll({
            where: {
              user_id: user.user_id,
            },
            include: [
              {
                model: CamerasInZones,
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
        
        zones = await Promise.all(
          zones?.map(async (zone) => {
            //.filter((cam) => cam?.cam_id);
            const location = user.role == "Teacher" ? zone?.dataValues?.zone?.dataValues?.location : zone?.loc_id;
            const baseUrl = await customerServices.getTranscoderUrlFromCustLocations(location, user?.cust_id)
            let cameras = zone.dataValues.cameras_assigned_to_zones
            ?.map((cam) => {
                let uid = user?.family_member_id || user?.user_id;
                let sid = cam?.camera?.cam_id;
                let uuid = uuidv4();
                const token = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
                return {
                  cam_id: cam?.camera?.cam_id,
                  cam_name: cam?.camera?.cam_name,
                  description: cam?.camera?.description,
                  cam_alias: cam?.camera?.cam_alias,
                  stream_uri: `${baseUrl}${cam?.camera?.stream_uri}?seckey=${token}`,
                };
              })
              .filter((cam) => cam?.cam_id);
    
            let livStreamCameras = zone.dataValues.live_stream_cameras?.map(
              (cam) => {
                let uid = user?.family_member_id || user?.user_id;
                let sid = cam?.stream_uri.split('/') [cam?.stream_uri.split('/').length - 1].split('.')[0];
                let uuid = uuidv4();
                const token = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
                return {
                  cam_id: cam?.cam_id,
                  cam_name: cam?.cam_name,
                  description: cam?.description || "",
                  cam_alias: cam?.camera?.cam_alias,
                  stream_uri: `${cam?.stream_uri}?seckey=${token}`,
                };
              }
            );
            cameras = cameras.concat(livStreamCameras);
    
            return {
              zone_id: zone.zone_id,
              zone_name:
                zone.zone_name || zone.dataValues?.zone?.dataValues?.zone_name,
              location:
                zone.loc_id || zone.dataValues?.zone?.dataValues?.loc_id,
              cameras: cameras,
            };
          })
        ) 
        return zones;
      }
    } catch (error) {
      console.log('error==>', error);
    }
  },

  getAllCamForUser: async (user) => {
    const {
      Camera,
      Zone,
      Child,
      ZonesInChild,
      CamerasInZones,
      CustomerLocations,
      LiveStreamCameras,
      ZonesInTeacher,
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
      let liveStreamZoneID = liveStreamCameras[0]?.zone_id;
      liveStreamObj = await liveStream.getActiveStreamObjByZoneId(liveStreamZoneID);
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
            model: ZonesInChild,
            as: "zonesInChild",
            where: {
              disabled: "false",
            },
            include: [
              {
                model: Zone,
                as: "zone",
                where: {
                  loc_id: user.locations.map((item) => item.loc_id),
                },
                include: [
                  {
                    model: CamerasInZones,
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
        let finalZones = [];
        child?.zonesInChild?.forEach((zone) => {
          if (zone?.schedule?.timeRange) {
            const timeZone = availableLocations.find(
              (loc) => loc.loc_name == zone.zone.location
            );
            let hasAccess = false;
            zone.schedule.timeRange?.forEach((range) => {
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
              let cams = zone?.zone?.cameras_assigned_to_zones
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

              let livStreamCams = zone.zone?.live_stream_cameras?.map((cam) => {
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

              finalZones.push({
                zone_id: zone.zone.zone_id,
                zone_name: zone.zone.zone_name,
                location: zone.zone.location,
                cameras: cams,
              });
            }
          } else {
            let cams = zone?.zone?.cameras_assigned_to_zones
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
            let livStreamCams = zone.zone?.live_stream_cameras?.map((cam) => {
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
            finalZones.push({
              zone_id: zone.zone.zone_id,
              zone_name: zone.zone.zone_name,
              location: zone.zone.location,
              cameras: cams,
            });
          }
        });
        return {
          childFirstName: child.first_name,
          childLastName: child.last_name,
          zones: finalZones,
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
              model: Zone,
              attributes: ["zone_id", "zone_name"],
              include: [
                {
                  model: CamerasInZones,
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
          let zones = loc?.zones?.map((zone) => {
            let cams = zone?.cameras_assigned_to_zones
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
            let livStreamCams = zone.live_stream_cameras?.map((cam) => {
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
              zone_id: zone.zone_id,
              zone_name: zone.zone_name,
              cameras: cams,
            };
          });

          return { location: loc.loc_name, zones: zones };
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
              model: Zone,
              attributes: ["zone_id", "zone_name"],
              where: {
                user_id: user.user_id,
              },
              include: [
                {
                  model: CamerasInZones,
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
          let zones = await ZonesInTeacher.findAll({
            where: { teacher_id: user.user_id },
            include: [
              {
                model: CamerasInZones,
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
                model: Zone,
                as: "zone",
                raw: true,
                where: {
                  loc_id: user.locations.map((item) => item.loc_id),
                },
              },
            ],
          });
          zones = zones?.map((zone) => {
            //.filter((cam) => cam?.cam_id);

            let cameras = zone.dataValues.cameras_assigned_to_zones
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

            let livStreamCameras = zone.dataValues.live_stream_cameras?.map(
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
              zone_id: zone.zone_id,
              zone_name:
                zone.zone_name || zone.dataValues?.zone?.dataValues?.zone_name,
              location:
                zone.location || zone.dataValues?.zone?.dataValues?.loc_id,
              cameras: cameras,
            };
          });
        
          for (const item of zones) {
            const location = await CustomerLocations.findOne({ where: { loc_id: item.location } });
            item.location = location.loc_name;
          }
          let result = _.chain(zones)
            .groupBy("location")
            .map((value, key) => ({
              location: key,
              zones: value,
            }))
            .value();

          result = result.map((item) => {
            let { zones, ...rest } = item;
            let newZones = _.map(zones, (object) => {
              return _.omit(object, ["location"]);
            });
            return {
              ...rest,
              zones: newZones,
            };
          });

          return result;
        }
        locations = locations?.map((loc) => {
          let zones = loc?.zones?.map((zone) => {
            let cams = zone?.cameras_assigned_to_zones
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
              "===zone.live_stream_cameras==",
              zone.live_stream_cameras
            );
            let livStreamCams = zone.live_stream_cameras?.map((cam) => {
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
              zone_id: zone.zone_id,
              zone_name: zone.zone_name,
              cameras: cams,
            };
          });

          return { location: loc.loc_name, zones: zones };
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
