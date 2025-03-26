const Users = require('./users');
const Customers = require('./customers');
const CustomerLocations = require('./customer_locations');
const Family = require('./family');
const Child = require('./child');
const Camera = require('./camera');
const RecentViewers = require('./recent_viewers');
const Zone = require('./zone');
const ZoneType = require('./zone_type');
const ScheduledToDisable = require('./scheluled_to_disable');
const ZonesInChild = require('./zones_assigned_to_child');
const DefaultSchedule = require('./default_schedule');
const ZonesInTeacher = require('./zones_assigned_to_teacher');
const CamerasInZones = require('./cameras_assigned_to_zones');
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
const RecordRtsp = require('./record_rtsp');
const RecordTag = require('./record_tag');
const RecordingShareHistory = require('./recordings_share_history');
const RecordingShareRecipients = require('./recordings_share_recipients');

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

ZonesInChild.belongsTo(Child, { foreignKey: 'child_id' });
Child.hasMany(ZonesInChild, {
  as: 'zonesInChild',
  sourceKey: 'child_id',
  foreignKey: {
    name: 'child_id'
  }
});

ZonesInTeacher.belongsTo(Users, { foreignKey: 'teacher_id', targetKey: 'user_id' });
Users.hasMany(ZonesInTeacher, {
  as: 'zonesInTeacher',
  sourceKey: 'user_id',
  foreignKey: {
    name: 'teacher_id'
  }
});

CamerasInZones.belongsTo(Zone, { foreignKey: 'zone_id' });
Zone.hasMany(CamerasInZones, {
  sourceKey: 'zone_id',
  foreignKey: {
    name: 'zone_id'
  }
});
LiveStreams.belongsTo(Zone, { foreignKey: 'zone_id' });
RecordRtsp.belongsTo(Zone, { foreignKey: 'zone_id' });
LiveStreamCameras.belongsTo(Zone, { foreignKey: 'zone_id' });
Zone.hasMany(LiveStreamCameras, {
  sourceKey: 'zone_id',
  foreignKey: {
    name: 'zone_id'
  }
});
LiveStreamRecentViewers.belongsTo(LiveStreams, { foreignKey: 'stream_id' })

ZonesInTeacher.hasMany(CamerasInZones, {
  sourceKey: 'zone_id',
  foreignKey: {
    name: 'zone_id'
  }
});

ZonesInTeacher.hasMany(LiveStreamCameras, {
  sourceKey: 'zone_id',
  foreignKey: {
    name: 'zone_id'
  }
});


CamerasInZones.belongsTo(Camera, { foreignKey: 'cam_id' });
Camera.hasMany(CamerasInZones, {
  sourceKey: 'cam_id',
  foreignKey: {
    name: 'cam_id'
  }
});
MountedCameraRecentViewers.belongsTo(Camera, { foreignKey: 'cam_id' })


Zone.belongsTo(ZonesInChild, { foreignKey: 'zone_id' });
ZonesInChild.hasOne(Zone, {
  as: 'zone',
  sourceKey: 'zone_id',
  foreignKey: {
    name: 'zone_id'
  }
});

Zone.belongsTo(ZonesInTeacher, { foreignKey: 'zone_id' });
ZonesInTeacher.hasOne(Zone, {
  as: 'zone',
  sourceKey: 'zone_id',
  foreignKey: {
    name: 'zone_id'
  }
});

Zone.belongsTo(CustomerLocations, { foreignKey: 'loc_id' });
CustomerLocations.hasMany(Zone, {
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
Zone.belongsTo(Customers, { foreignKey: 'cust_id' });

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

ZoneType.hasMany(Zone, { foreignKey: 'zone_type_id', as: 'zones' }); // A ZoneType has many Zones
Zone.belongsTo(ZoneType, { foreignKey: 'zone_type_id', as: 'zone_type' }); // A Zone belongs to one ZoneType

RecordTag.hasMany(RecordRtsp, { foreignKey: 'tag_id', as: 'tags' }); // A RecordTag has many Recordings
RecordRtsp.belongsTo(RecordTag, { foreignKey: 'tag_id', as: 'record_tag' }); // A Recording belongs to one RecordTag

Camera.hasMany(RecordRtsp, { foreignKey: 'cam_id', as: 'record_camera' }); // A Camera has many Recordings
RecordRtsp.belongsTo(Camera, { foreignKey: 'cam_id', as: 'record_camera_tag' }); // A Recording belongs to one Camera

// A Recording can have many Shares
RecordRtsp.hasMany(RecordingShareHistory, {
  foreignKey: 'record_uuid',
  sourceKey: 'record_uuid'
});

RecordingShareHistory.belongsTo(RecordRtsp, {
  foreignKey: 'record_uuid',
  targetKey: 'record_uuid'
});

// A Share can have many Recipients
RecordingShareHistory.hasMany(RecordingShareRecipients, {
  foreignKey: 'share_id',
  sourceKey: 'share_id'
});
RecordingShareRecipients.belongsTo(RecordingShareHistory, {
  foreignKey: 'share_id',
  targetKey: 'share_id'
});

// User associations (assuming you have a User model)
Users.hasMany(RecordingShareRecipients, {
  foreignKey: 'user_id',
  sourceKey: 'user_id'
});
RecordingShareRecipients.belongsTo(Users, {
  foreignKey: 'user_id',
  targetKey: 'user_id'
});

// Family associations (assuming you have a family model)
Family.hasMany(RecordingShareRecipients, {
  foreignKey: 'user_id',
  sourceKey: 'family_member_id'
});
RecordingShareRecipients.belongsTo(Family, {
  foreignKey: 'user_id',
  targetKey: 'family_member_id'
});

// ✅ Define association: A RecordingShareHistory belongs to a User (sender)
RecordingShareHistory.belongsTo(Users, {
  foreignKey: 'sender', // FK in recordings_share_history table
  targetKey: 'user_id', // PK in Users table
  as: 'senderUser', // Alias to access sender details
});

// ✅ Define association: A User can have multiple shared recordings
Users.hasMany(RecordingShareHistory, {
  foreignKey: 'sender',
  sourceKey: 'user_id',
  as: 'sharedRecordings', // Alias to access user's shared recordings
});
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
      Zone,
      ZoneType,
      Camera,
      ScheduledToDisable,
      ZonesInChild,
      ZonesInTeacher,
      CamerasInZones,
      RecordRtsp,
      RecordTag,
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
      RecordingShareHistory,
      RecordingShareRecipients,
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
    Zone,
    ZoneType,
    Camera,
    ScheduledToDisable,
    ZonesInChild,
    ZonesInTeacher,
    CamerasInZones,
    RecordRtsp,
    RecordTag,
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
    RecordingShareHistory,
    RecordingShareRecipients,
    CustomerLocationAssignmentsCopy
  };
};
