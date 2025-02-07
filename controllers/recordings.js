const _ = require('lodash');
const liveStreamServices = require('../services/liveStream');
const CONSTANTS = require('../lib/constants');
const sequelize = require("../lib/database");
const { v4: uuidv4 } = require("uuid");
const s3BucketImageUploader = require("../lib/aws-services");
const connectToDatabase = require("../models/index");

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
      const activeLiveStreams = await liveStreamServices.getAllActiveStreams(custId, req?.query?.location, t);
      let recentLiveStreams = await liveStreamServices.getRecentStreams(custId, req?.query?.location, t);
      let recentFixedRecordings = await liveStreamServices.getFixedCameraRecordings(user_id, req?.query?.from, req?.query?.to, req?.query?.location, req.query?.sortBy, pageNumber, pageSize, req.query.tags);
      let lastTenFixedRecordings = await liveStreamServices.getRecentFixedCameraRecordings(user_id, req?.query?.location, req.query.tags);
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
      let mappedData;
      if(recentFixedRecordings.data.length > 0){        
          mappedData = await Promise.all(recentFixedRecordings.data.map(async item => {
          const presigned_thumbnail_url = item?.dataValues?.thumbnail_url ? await s3BucketImageUploader.getPresignedUrlForRecordingImgAndVideo(item?.dataValues?.thumbnail_url) : ""
          const presigned_video_url = item?.dataValues?.video_url ? await s3BucketImageUploader.getPresignedUrlForRecordingImgAndVideo(item?.dataValues?.video_url) : ""
          let newDataValue = item.dataValues;
          newDataValue.thumbnail_url = presigned_thumbnail_url;
          newDataValue.video_url = presigned_video_url;
          item.dataValues = newDataValue;          
          return item
        }))
      } else {
        mappedData = [];
      }
      if(lastTenFixedRecordings.data.length > 0){        
        lastTenFixedRecordings = await Promise.all(lastTenFixedRecordings.data.map(async item => {
          const presigned_thumbnail_url = item?.dataValues?.thumbnail_url ? await s3BucketImageUploader.getPresignedUrlForRecordingImgAndVideo(item?.dataValues?.thumbnail_url) : ""
          const presigned_video_url = item?.dataValues?.video_url ? await s3BucketImageUploader.getPresignedUrlForRecordingImgAndVideo(item?.dataValues?.video_url) : ""
          let newDataValue = item.dataValues;
          newDataValue.thumbnail_url = presigned_thumbnail_url;
          newDataValue.video_url = presigned_video_url;
          item.dataValues = newDataValue;          
          return item
        }))
      }
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
          recentFixedCameraRecordings: recentFixedRecordings ? {data: mappedData, count: recentFixedRecordings.count} : [],
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
};
