const _ = require('lodash');
const liveStreamServices = require('../services/liveStream');
const CONSTANTS = require('../lib/constants');
const { sequelize } = require('../lib/database');
const { v4: uuidv4 } = require("uuid");
const s3BucketImageUploader = require("../lib/aws-services");
const connectToDatabase = require("../models/index");
const { shareRecordingUrl, reportIssue } = require('../lib/ses-mail-sender');
const customerServices = require('../services/customers');
const { Op } = require('sequelize');
const socketServices = require('../services/socket');

module.exports = {
  // get all recording details
  getAllRecordings: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      custId = req.user.cust_id || req.query.cust_id;
      user_id = req.user.user_id;
      pageNumber = req.query?.pageNumber;
      pageSize = req.query?.pageSize;
      pageCount = req.query?.pageCount;
      recordingType = req.query?.type;
      locations = req.user.locations.map((item) => item.loc_id);
      const activeLiveStreams = await liveStreamServices.getAllActiveStreams(custId, req?.query?.location, t);
      let recentLiveStreams = await liveStreamServices.getRecentStreams(custId, locations, t);
      let recentFixedRecordings = await liveStreamServices.getFixedCameraRecordings(user_id, req?.query?.from, req?.query?.to, req?.query?.location, req.query?.sortBy, pageNumber, pageSize, req.query.tags, req?.query?.zones);
      let lastTenFixedRecordings = await liveStreamServices.getRecentFixedCameraRecordings(user_id, locations);
      let recordedStreams = await liveStreamServices.getRecordedStreams(custId, req?.query?.from, req?.query?.to, req?.query?.location, req?.query?.zones, req.query?.sortBy, pageNumber, pageSize, t);
     // `${cam?.stream_uri}?uid=${user?.family_member_id || user?.user_id}&sid=${cam?.stream_uri.split('/') [cam?.stream_uri.split('/').length - 1].split('.')[0]}&uuid=${uuidv4()}`
    // recordedStreams.forEach(element => {
      //element.stream_uri = `${cam?.stream_uri}?uid=${req.user?.family_member_id || req.user?.user_id}&sid=${cam?.stream_uri.split('/') [cam?.stream_uri.split('/').length - 1].split('.')[0]}&uuid=${uuidv4()}`
    // });

     if(recordedStreams.data.length > 0){
      recordedStreams.data = await Promise.all(recordedStreams.data.map(async item => {
        const presigned_url = !item?.dataValues?.stream_running && item?.dataValues?.s3_url ? await s3BucketImageUploader.getPresignedUrl(item?.dataValues?.s3_url) : ""
        let newDataValue = item.dataValues;
        newDataValue.presigned_url = presigned_url;
        item.dataValues = newDataValue;
        return item
        }))
      }
      if(recentLiveStreams.length > 0){
        recentLiveStreams = await Promise.all(recentLiveStreams.map(async item => {
          const presigned_url = item?.dataValues?.s3_url ? await s3BucketImageUploader.getPresignedUrl(item?.dataValues?.s3_url) : ""
          let newDataValue = item.dataValues;
          newDataValue.presigned_url = presigned_url;
          item.dataValues = newDataValue;
          return item
          }))
        }
      // let mappedData;
      // if(recentFixedRecordings.data.length > 0){        
      //     mappedData = await Promise.all(recentFixedRecordings.data.map(async item => {
      //     // const presigned_thumbnail_url = item?.dataValues?.thumbnail_url ? await s3BucketImageUploader.getPresignedCfnUrlForRecordingVideo(item?.dataValues?.thumbnail_url) : ""
      //     // const presigned_video_url = item?.dataValues?.video_url ? await s3BucketImageUploader.getPresignedCfnUrlForRecordingVideo(item?.dataValues?.video_url) : ""
      //     let newDataValue = { ...item.dataValues }; // Create a new copy
      //     // newDataValue.thumbnail_url = presigned_thumbnail_url;
      //     // newDataValue.video_url = presigned_video_url;
      //     // newDataValue.unsigned_url = item?.dataValues?.video_url; // Store the original unsigned URL
      //     return newDataValue;
      //   }))
      // } else {
      //   mappedData = [];
      // }
      // if(lastTenFixedRecordings.data.length > 0){        
      //   lastTenFixedRecordings = await Promise.all(lastTenFixedRecordings.data.map(async item => {
      //     // const presigned_thumbnail_url = item?.dataValues?.thumbnail_url ? await s3BucketImageUploader.getPresignedCfnUrlForRecordingVideo(item?.dataValues?.thumbnail_url) : ""
      //     // const presigned_video_url = item?.dataValues?.video_url ? await s3BucketImageUploader.getPresignedCfnUrlForRecordingVideo(item?.dataValues?.video_url) : ""
      //     let newDataValue = { ...item.dataValues }; // Create a new copy
      //     // newDataValue.thumbnail_url = presigned_thumbnail_url;
      //     // newDataValue.video_url = presigned_video_url;
      //     // newDataValue.unsigned_url = item?.dataValues?.video_url; // Store the original unsigned URL
      //     return newDataValue;
      //   }))
      // }
    //  recordedStreams.forEach(element => {
    //   element.zone.live_stream_cameras.forEach(cam => 
    //     cam.stream_uri = `${cam?.stream_uri}?uid=${req.user?.family_member_id || req.user?.user_id}&sid=${cam?.stream_uri.split('/') [cam?.stream_uri.split('/').length - 1].split('.')[0]}&uuid=${uuidv4()}`
    //     )
    // });

     await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: {
          activeLiveStreams: activeLiveStreams ? activeLiveStreams : [],
          recentLiveStreams: recentLiveStreams ? recentLiveStreams : [],
          lastTenFixedCameraRecordings: lastTenFixedRecordings ? lastTenFixedRecordings : [],
          recentFixedCameraRecordings: recentFixedRecordings ? recentFixedRecordings : [],
          recordedStreams: recordedStreams ? recordedStreams : []
        },
        Message: CONSTANTS.RECORDING_DETAILS
      });

      next();
    } catch (error) {      
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  },

  getAllRecordingsByUser: async (req, res, next) => {
    try {
      custId = req.user.cust_id || req.query.cust_id;
      user_id = req.user.user_id;

      let recentFixedRecordingsByUser = await liveStreamServices.getFixedCameraRecordingsByUser(user_id);
      const activeCameras = recentFixedRecordingsByUser.data.map((_) => _.cam_id);
      res.status(200).json({
        IsSuccess: true,
        Data: {
          fixedCameraRecordingsByUser: recentFixedRecordingsByUser ? recentFixedRecordingsByUser : [],
          activeCameras: activeCameras ? Array.from(new Set(activeCameras)) : []
        },
        Message: CONSTANTS.RECORDING_DETAILS
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  },

  editRecording: async (req, res, next) => {
    const t = await sequelize.transaction();
    const { RecordRtsp } = await connectToDatabase();
    try { 
      const params = req.body;

      let update = {
        event_name: params.event_name,
        tag_id: params.tag
      }

      let updateRecord = await RecordRtsp.update(
        update,
        {
          where: { record_uuid: params.record_uuid },
        },
        { transaction: t }
      );

      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: updateRecord,
        Message: "Record updated",
      });

      next();
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  },

  editMobileRecording: async (req, res, next) => {
    const t = await sequelize.transaction();
    const { LiveStreams } = await connectToDatabase();
    try { 
      const params = req.body;

      let update = {
        stream_name: params.stream_name,
      }

      let updateRecord = await LiveStreams.update(
        update,
        {
          where: { stream_id: params.stream_id },
        },
        { transaction: t }
      );

      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: updateRecord,
        Message: "Stream Record updated",
      });

      next();
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  },

  deleteRecording: async (req, res, next) => {
    const t = await sequelize.transaction();
    const { RecordRtsp } = await connectToDatabase();
    try { 
      const params = req.body;

      let recordDeleted = await RecordRtsp.destroy(
        {
          where: { record_uuid: params.record_uuid },
        },
        { transaction: t }
      );

      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: recordDeleted,
        Message: "Record deleted",
      });

      next();
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  },

  deleteMobileRecording: async (req, res, next) => {
    const t = await sequelize.transaction();
    const { LiveStreams } = await connectToDatabase();
    try { 
      const params = req.body;

      let recordDeleted = await LiveStreams.destroy(
        {
          where: { stream_id: params.stream_id },
        },
        { transaction: t }
      );

      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: recordDeleted,
        Message: "Stream record deleted",
      });

      next();
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  },

  shareRecording: async (req, res, next) => {
    const t = await sequelize.transaction();
    const { user_id, recipient, shared_link, days, thumbnail_url, record_uuid, event_name, cust_id, reshare, req_share_id } = req.body;
    const { RecordingShareHistory, RecordingShareRecipients, RecordRtsp } = await connectToDatabase();
    const user = req.user;
    try {
      const shared_on = new Date(); // Get current date and time
      const expires_on = new Date(); 
      expires_on.setDate(expires_on.getDate() + parseInt(days)); // Add the given days to current date
      const share_id = uuidv4();
      let urlToSend;
      const customer = await customerServices.getCustomerDetails(user.cust_id || cust_id, t);
      if (reshare) {
        await shareRecordingUrl(recipient.receiver_email, recipient.video_url, user.first_name, recipient.receiver_name, recipient.expires_on, recipient.thumbnail_url, customer.company_name);
        const shareHistoryUpdated = await RecordingShareHistory.update(
          {
            shared_on: new Date(),
          },
          { where: { share_id: req_share_id } },
          { transaction: t }
        );

        // Send socket notification for reshare
        try {
          const recordingDetails = {
            share_id: req_share_id,
            record_uuid: record_uuid,
            event_name: event_name,
            thumbnail_url: recipient.thumbnail_url,
            expires_on: recipient.expires_on,
            shared_link: recipient.video_url,
            is_reshare: true
          };
          
          await socketServices.sendRecordingShareNotification(
            recipient.receiver_id,
            user.first_name,
            recordingDetails
          );
        } catch (socketError) {
          console.error('Socket notification error for reshare:', socketError);
          // Don't fail the request if socket notification fails
        }

        return res.status(201).json({
          IsSuccess: true,
          Data: shareHistoryUpdated,
          Message: "Recording re-shared successfully",
        });
      }
      const clonedS3Url = await s3BucketImageUploader.cloneS3ObjectForUser(shared_link, recipient.receiver_id);
      
      // Convet shared_link(s3 url) to cloudfront url
      const convertS3ToCloudFront = (s3Url, cloudFrontDomain) => {
        if (!s3Url) return null; // Handle empty URLs gracefully
        return s3Url.replace(/https?:\/\/[^/]+/, cloudFrontDomain);
      };
  
      const cloudFrontDomain = "https://d21wx6fkc3aal5.cloudfront.net";

      const cloudFrontRecordingUrl = convertS3ToCloudFront(clonedS3Url, cloudFrontDomain);

      const receiverName = recipient.receiver_name;
      const receiverEmail = recipient.receiver_email;
      const signedUrl = await s3BucketImageUploader.getPresignedCfnUrlForRecordingVideo(cloudFrontRecordingUrl, days);
      urlToSend = process.env.FE_SITE_BASE_URL + 'shared-clips?' + 'video=' + encodeURIComponent(signedUrl) + '&shareId=' + share_id;
      await shareRecordingUrl(receiverEmail, urlToSend, user.first_name, receiverName, expires_on, thumbnail_url, customer.company_name);

      const shareHistoryCreated = await RecordingShareHistory.create(
        {
          share_id: share_id,
          sender: user_id,
          record_uuid: record_uuid,
          shared_link: clonedS3Url,
          shared_cf_link: urlToSend,
          thumbnail_url: thumbnail_url,
          shared_on: shared_on,
          expires_on: expires_on,
        },
        { transaction: t }
      );

      await RecordingShareRecipients.create(
        {
          share_id: share_id,
          user_id: recipient.receiver_id,
        },
        { transaction: t }
      );
      
      const updateEventName = await RecordRtsp.update(
        { event_name: event_name },
        { where: { record_uuid: record_uuid } },
        { transaction: t }
      );

      await t.commit();

      // Send socket notification to the recipient
      try {
        const recordingDetails = {
          share_id: share_id,
          record_uuid: record_uuid,
          event_name: event_name,
          thumbnail_url: thumbnail_url,
          expires_on: expires_on,
          shared_link: urlToSend
        };
        
        await socketServices.sendRecordingShareNotification(
          recipient.receiver_id,
          user.first_name,
          recordingDetails
        );
      } catch (socketError) {
        console.error('Socket notification error:', socketError);
        // Don't fail the request if socket notification fails
      }

      res.status(201).json({
        IsSuccess: true,
        Data: shareHistoryCreated,
        EventUpdated: updateEventName,
        Message: "Record created",
      });

      next();
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  },

  listShareHistory: async (req, res, next) => {
    const { record_uuid, user_id } = req.query
    const { RecordingShareHistory, RecordingShareRecipients, Users, Family, RecordRtsp, Camera, Customers, CustomerLocations } = await connectToDatabase();
    try {
      let shareHistory = [];
      if(record_uuid) {
        shareHistory = await RecordingShareHistory.findAll({
          order: [ ['created_at', 'DESC'] ],
          where: {
            record_uuid: record_uuid
          },
          include: [
            {
              model: RecordingShareRecipients,
              include: [
                {
                  model: Users,
                  attributes: ['first_name', 'last_name', 'email'] 
                },
                {
                  model: Family,
                  attributes: ['first_name', 'last_name', 'email'] 
                },
              ]
            }
          ]
        });
      } else if(user_id) {
        shareHistory = await RecordingShareHistory.findAll({
          order: [["created_at", "DESC"]],
          where: {
            expires_on: { [Op.gt]: sequelize.literal("NOW()") }, // Filter out expired records
          },
          include: [
            {
              model: RecordingShareRecipients,
              where: { user_id: user_id }, // Filter by user_id
              required: true, // Ensures only matching records are returned
              include: [
                {
                  model: Users, // Optional: Include user details if needed
                },
                {
                  model: Family, // Optional: Include family details if needed
                },
              ],
            },
            {
              model: RecordRtsp,
              include: [
                {
                  model: Camera,
                  as: "record_camera_tag",
                  include: [{ model: CustomerLocations }],
                },
              ], // Optional: Include family details if needed
            },
            {
              model: Users,
              as: "senderUser",
              attributes: ["user_id", "first_name", "last_name", "email"],
              include: [{
                model: Customers,
                as: "customer",
                attributes: ["company_name"],
              }]
            },
          ],
        });
      }
      if (!shareHistory || shareHistory.length === 0) {
        return res.status(404).json({
          IsSuccess: false,
          Data: [],
          Message: "No share history found.",
        });
      }
      res.status(200).json({
        IsSuccess: true,
        Data: shareHistory,
        Message: "Share history retrieved",
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  },

  invalidateLink: async (req, res, next) => {
    const { RecordingShareHistory, RecordingShareRecipients } = await connectToDatabase();
    try {
      const { share_id } = req.body;
      const shareRecord = await RecordingShareHistory.findOne({where: {share_id: share_id}});
  
      if (!shareRecord) {
        return res.status(404).json({ error: "Share record not found" });
      }
  
      // Invalidate the link by setting it to null
      // shareRecord.dataValues.shared_link = null;
      shareRecord.dataValues.expires_on = new Date(); // Mark as expired
      const s3Url = shareRecord.dataValues.shared_link;
      const bucketName = "zoomin-recordings-rtsp";

      await s3BucketImageUploader.deleteS3Object(s3Url, bucketName);
      await RecordingShareHistory.destroy(
        { where: { share_id: share_id } }
      );
      await RecordingShareRecipients.destroy(
        { where: { share_id: share_id } }
      );
  
      res.status(201).json({ message: "Video link invalidated successfully!" });
      next();
    } catch (error) {
      console.error("Error invalidating video:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  markSeen: async (req, res, next) => {
    try {
      const { share_id } = req.body;
      const { RecordingShareHistory } = await connectToDatabase();

      await RecordingShareHistory.update(
        { seen: true },
        { where: { share_id } }
      );
      res.status(200).json({ message: 'Marked as seen' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error updating seen status' });
    }
  },

  streamVideo: async (req, res, next) => {
    const { share_id } = req.query;
    const { RecordingShareHistory, RecordingShareRecipients } = await connectToDatabase();
    try {      
       // Ensure user is authenticated
       
      const user_id = req.user?.family_member_id ? req.user?.family_member_id : req.user?.user_id; 
      
      if (!user_id) {
        return res.status(401).json({ Message: "Unauthorized request." });
      }

      const shareRecord = await RecordingShareHistory.findOne({where: {share_id: share_id}});
      if(!shareRecord) {
        return res.status(403).json({ Message: "This link has expired or is no longer valid." });
      }

      if (!shareRecord.shared_link || new Date() > new Date(shareRecord.expires_on)) {
        return res.status(403).json({ Message: "This link has expired or is no longer valid." });
      }
      // Check if the authenticated user is in the recipients list
      const isAuthorized = await RecordingShareRecipients.findOne({
        where: { share_id, user_id },
      });

      if (!isAuthorized) {
        return res.status(403).json({ Message: "You are not authorized to view this recording." });
      }
      
      // res.redirect(shareRecord.shared_link); // Redirect to the valid video URL
      res.status(200).json({ url: shareRecord?.dataValues.shared_link, Message: "Recording Found" })
    } catch (error) {
      console.error("Error invalidating video:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  reportVideo: async (req, res, next) => {
    const {
      issueType,
      reporterName,
      reporterEmail,
      issueReportedAt,
      eventName,
      custName,
      location,
      camName,
      zoneName,
      url,
      thumbnail_url
    } = req.body;
    try {
      const convertS3ToCloudFront = (s3Url, cloudFrontDomain) => {
        if (!s3Url) return null; // Handle empty URLs gracefully
        return s3Url.replace(/https?:\/\/[^/]+/, cloudFrontDomain);
      };
  
      const cloudFrontDomain = "https://d21wx6fkc3aal5.cloudfront.net";

      const cloudFrontRecordingUrl = convertS3ToCloudFront(url, cloudFrontDomain);
      const signedUrl = await s3BucketImageUploader.getPresignedCfnUrlForRecordingVideo(cloudFrontRecordingUrl, 3);
      
      const sendEmail = await reportIssue(
        issueType, 
        'support@zoominlive.com', 
        reporterName, 
        reporterEmail,
        issueReportedAt,
        eventName,
        custName,
        location,
        camName,
        zoneName,
        signedUrl,
        thumbnail_url
      );
      if (!sendEmail.IsSuccess) {
        return res.status(400).json(sendEmail); // Send error response if email fails
      }
    
      return res.status(200).json({
        IsSuccess: true,
        Message: "Issue Reported"
      });

    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  },

  convertS3toCloudfront: async (req, res, next) => {
    const { record_uuids } = req.body;
    const { RecordRtsp } = await connectToDatabase();
  
    try {
      // Fetch all records matching the record_uuids array
      const recordingData = await RecordRtsp.findAll({
        where: { record_uuid: record_uuids },
        raw: true
      });
  
      if (!recordingData.length) {
        return res.status(404).json({
          Message: "No recordings found for the provided UUIDs",
        });
      }
  
      const convertS3ToCloudFront = (s3Url, cloudFrontDomain) => {
        if (!s3Url) return null; // Handle empty URLs gracefully
        return s3Url.replace(/https?:\/\/[^/]+/, cloudFrontDomain);
      };
  
      const cloudFrontDomain = "https://d21wx6fkc3aal5.cloudfront.net";
  
      // Process each record to get the converted and presigned URLs
      const convertedData = await Promise.all(
        recordingData.map(async (record) => {
          const cloudFrontThumbnailUrl = convertS3ToCloudFront(record.thumbnail_url, cloudFrontDomain);
          const cloudFrontRecordingUrl = convertS3ToCloudFront(record.video_url, cloudFrontDomain);
  
          const presignedImgUrl = cloudFrontThumbnailUrl
            ? await s3BucketImageUploader.getPresignedCfnUrlForRecordingVideo(cloudFrontThumbnailUrl, 1)
            : null;
  
          const presignedRecordingsUrl = cloudFrontRecordingUrl
            ? await s3BucketImageUploader.getPresignedCfnUrlForRecordingVideo(cloudFrontRecordingUrl, 1)
            : null;
  
          return {
            record_uuid: record.record_uuid,
            thumbnail: presignedImgUrl,
            recording: presignedRecordingsUrl,
          };
        })
      );
  
      return res.status(200).json({
        Data: convertedData,
        Message: "S3 URL conversion successful",
      });
    } catch (error) {
      console.error("Error converting URLs:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  
};
