const Users = require('./users');
const Customers = require('./customers');
const CustomerLocations = require('./customer_locations');
const Family = require('./family');
const Child = require('./child');
const Camera = require('./camera');
const RecentViewers = require('./recent_viewers');
const Room = require('./room');
const Zone = require('./zone');
const ScheduledToDisable = require('./scheluled_to_disable');
const RoomsInChild = require('./rooms_assigned_to_child');
const DefaultSchedule = require('./default_schedule');
const RoomsInTeacher = require('./rooms_assigned_to_teacher');
const CamerasInRooms = require('./cameras_assigned_to_rooms');
const AccessLogs = require('./access_logs');
const ChangeLogs = require('./change_logs');
const LiveStreams = require('./live_stream');
const LiveStreamCameras = require('./live_stream_cameras');
const LiveStreamRecentViewers = require('./live_stream_recent_viewers');
const MountedCameraRecentViewers = require('./mounted_camera_recent_viewers');
const FcmTokens = require('./fcm_tokens');
const CamPreference = require('./cam_preference');
const Subscriptions = require('./subscriptions');
const Invoice = require('./invoice');
const Webhooks = require('./webhooks');
const SubscriptionItems = require('./subscriptions_items');
const CustomerTermsApproval = require('./customer_terms_approval');
const ApiKeys = require('./api_keys');
const CustomerLocationAssignments = require('./customer_location_assignment');
const CustomerLocationAssignmentsCopy = require('./customer_location_assignment_copy');
const sequelize = require('../lib/database');

CustomerLocations.belongsTo(Customers, { foreignKey: 'cust_id' });
Customers.hasMany(CustomerLocations, {
  sourceKey: 'cust_id',
  foreignKey: {
    name: 'cust_id'
  }
});

DefaultSchedule.belongsTo(Customers, { foreignKey: 'cust_id' });
Customers.hasMany(DefaultSchedule, {
  sourceKey: 'cust_id',
  foreignKey: {
    name: 'cust_id'
  }
});
Customers.hasMany(Users, {
  sourceKey: 'cust_id',
  foreignKey: {
    name: 'cust_id'
  }
});

Family.hasMany(Child, {
  sourceKey: 'family_id',
  foreignKey: {
    name: 'family_id'
  }
});

Users.belongsTo(AccessLogs, { foreignKey: 'user_id' });
AccessLogs.hasOne(Users, {
  sourceKey: 'user_id',
  foreignKey: {
    name: 'user_id'
  }
});

Family.belongsTo(AccessLogs, { foreignKey: 'family_member_id' });
AccessLogs.hasOne(Family, {
  sourceKey: 'user_id',
  foreignKey: {
    name: 'family_member_id'
  }
});

Users.belongsTo(ChangeLogs, { foreignKey: 'user_id' });
ChangeLogs.hasOne(Users, {
  sourceKey: 'user_id',
  foreignKey: {
    name: 'user_id'
  }
});

RoomsInChild.belongsTo(Child, { foreignKey: 'child_id' });
Child.hasMany(RoomsInChild, {
  as: 'roomsInChild',
  sourceKey: 'child_id',
  foreignKey: {
    name: 'child_id'
  }
});

RoomsInTeacher.belongsTo(Users, { foreignKey: 'teacher_id', targetKey: 'user_id' });
Users.hasMany(RoomsInTeacher, {
  as: 'roomsInTeacher',
  sourceKey: 'user_id',
  foreignKey: {
    name: 'teacher_id'
  }
});

CamerasInRooms.belongsTo(Room, { foreignKey: 'room_id' });
Room.hasMany(CamerasInRooms, {
  sourceKey: 'room_id',
  foreignKey: {
    name: 'room_id'
  }
});
LiveStreams.belongsTo(Room, { foreignKey: 'room_id' });
LiveStreamCameras.belongsTo(Room, { foreignKey: 'room_id' });
Room.hasMany(LiveStreamCameras, {
  sourceKey: 'room_id',
  foreignKey: {
    name: 'room_id'
  }
});
LiveStreamRecentViewers.belongsTo(LiveStreams, { foreignKey: 'stream_id' })

RoomsInTeacher.hasMany(CamerasInRooms, {
  sourceKey: 'room_id',
  foreignKey: {
    name: 'room_id'
  }
});

RoomsInTeacher.hasMany(LiveStreamCameras, {
  sourceKey: 'room_id',
  foreignKey: {
    name: 'room_id'
  }
});


CamerasInRooms.belongsTo(Camera, { foreignKey: 'cam_id' });
Camera.hasMany(CamerasInRooms, {
  sourceKey: 'cam_id',
  foreignKey: {
    name: 'cam_id'
  }
});
MountedCameraRecentViewers.belongsTo(Camera, { foreignKey: 'cam_id' })


Room.belongsTo(RoomsInChild, { foreignKey: 'room_id' });
RoomsInChild.hasOne(Room, {
  as: 'room',
  sourceKey: 'room_id',
  foreignKey: {
    name: 'room_id'
  }
});

Room.belongsTo(RoomsInTeacher, { foreignKey: 'room_id' });
RoomsInTeacher.hasOne(Room, {
  as: 'room',
  sourceKey: 'room_id',
  foreignKey: {
    name: 'room_id'
  }
});

Room.belongsTo(CustomerLocations, { foreignKey: 'loc_id' });
CustomerLocations.hasMany(Room, {
  sourceKey: 'loc_id',
  foreignKey: {
    name: 'loc_id'
  }
});

Camera.belongsTo(CustomerLocations, { foreignKey: 'loc_id' });
CustomerLocations.hasMany(Camera, {
  sourceKey: 'loc_id',
  foreignKey: {
    name: 'loc_id'
  }
});


Family.belongsTo(RecentViewers, { foreignKey: 'family_member_id' });
RecentViewers.hasOne(Family, {
  sourceKey: 'recent_user_id',
  foreignKey: {
    name: 'family_member_id'
  }
});

Users.belongsTo(RecentViewers, { foreignKey: 'user_id' });
RecentViewers.hasOne(Users, {
  sourceKey: 'recent_user_id',
  foreignKey: {
    name: 'user_id'
  }
});

Family.belongsTo(Family, { foreignKey: 'family_id' });
Family.hasMany(Family, {
  as: 'secondary',
  sourceKey: 'family_id',
  foreignKey: {
    name: 'family_id'
  }
});

Child.belongsTo(Family, { foreignKey: 'family_id' });
Child.hasOne(Family, {
  sourceKey: 'family_id',
  foreignKey: {
    name: 'family_id'
  }
});

Users.belongsTo(Customers, { foreignKey: 'cust_id' });
Room.belongsTo(Customers, { foreignKey: 'cust_id' });

// Define Many-to-Many Relationship
Users.belongsToMany(CustomerLocations, {
  through: CustomerLocationAssignments,
  foreignKey: 'user_id',
  as: 'locations'
});

CustomerLocations.belongsToMany(Users, {
  through: CustomerLocationAssignments,
  foreignKey: 'loc_id',
  as: 'users'
});

ApiKeys.belongsToMany(CustomerLocations, {
  through: CustomerLocationAssignments,
  foreignKey: 'api_key_id',
  as: 'api_key_locations'
});

CustomerLocations.belongsToMany(ApiKeys, {
  through: CustomerLocationAssignments,
  foreignKey: 'loc_id',
  as: 'apikeys'
});

Family.belongsToMany(CustomerLocations, {
  through: CustomerLocationAssignments,
  foreignKey: 'family_member_id',
  as: 'family_user_locations'
});

CustomerLocations.belongsToMany(Family, {
  through: CustomerLocationAssignments,
  foreignKey: 'loc_id',
  as: 'family_users'
});

Child.belongsToMany(CustomerLocations, {
  through: CustomerLocationAssignments,
  foreignKey: 'child_id',
  as: 'child_locations'
});

CustomerLocations.belongsToMany(Child, {
  through: CustomerLocationAssignments,
  foreignKey: 'loc_id',
  as: 'child'
});

Zone.hasMany(Room, { foreignKey: 'zone_id', as: 'rooms' }); // A Zone has many Rooms
Room.belongsTo(Zone, { foreignKey: 'zone_id', as: 'zone' }); // A Room belongs to one Zone

const connection = {};

module.exports = async () => {
  if (connection?.isConnected) {
    //Using existing connection
    return {
      ChangeLogs,
      AccessLogs,
      Users,
      Customers,
      CustomerLocations,
      CustomerTermsApproval,
      DefaultSchedule,
      Family,
      Child,
      RecentViewers,
      Room,
      Zone,
      Camera,
      ScheduledToDisable,
      RoomsInChild,
      RoomsInTeacher,
      CamerasInRooms,
      LiveStreams,
      LiveStreamCameras,
      LiveStreamRecentViewers,
      MountedCameraRecentViewers,
      FcmTokens,
      CamPreference,
      Subscriptions,
      Invoice,
      SubscriptionItems,
      Webhooks,
      ApiKeys,
      CustomerLocationAssignments
    };
  }

  await sequelize.sync();
  await sequelize.authenticate();
  connection.isConnected = true;
  //Created a new connection
  return {
    ChangeLogs,
    AccessLogs,
    Users,
    Customers,
    CustomerLocations,
    CustomerTermsApproval,
    DefaultSchedule,
    Family,
    Child,
    RecentViewers,
    Room,
    Zone,
    Camera,
    ScheduledToDisable,
    RoomsInChild,
    RoomsInTeacher,
    CamerasInRooms,
    LiveStreams,
    LiveStreamCameras,
    LiveStreamRecentViewers,
    MountedCameraRecentViewers,
    FcmTokens,
    CamPreference,
    Subscriptions,
    Invoice,
    SubscriptionItems,
    Webhooks,
    ApiKeys,
    CustomerLocationAssignments,
    CustomerLocationAssignmentsCopy
  };
};
