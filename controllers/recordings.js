const _ = require('lodash');
const liveStreamServices = require('../services/liveStream');
const CONSTANTS = require('../lib/constants');
const sequelize = require("../lib/database");
const { v4: uuidv4 } = require("uuid");
const s3BucketImageUploader = require("../lib/aws-services");

module.exports = {
  // get all recording details
  getAllRecordings: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      custId = req.user.cust_id || req.query.cust_id;
      pageNumber = req.query?.pageNumber;
      pageSize = req.query?.pageSize;
      pageCount = req.query?.pageCount;
      const activeLiveStreams = await liveStreamServices.getAllActiveStreams(custId, req?.query?.location, t);
      let recentLiveStreams = await liveStreamServices.getRecentStreams(custId, req?.query?.location, t);
      let recordedStreams = await liveStreamServices.getRecordedStreams(custId, req?.query?.from, req?.query?.to, req?.query?.location, req?.query?.rooms,req.query?.live,req.query?.vod, req.query?.sortBy, pageNumber, pageSize, pageCount, t);
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
    //  recordedStreams.forEach(element => {
    //   element.room.live_stream_cameras.forEach(cam => 
    //     cam.stream_uri = `${cam?.stream_uri}?uid=${req.user?.family_member_id || req.user?.user_id}&sid=${cam?.stream_uri.split('/') [cam?.stream_uri.split('/').length - 1].split('.')[0]}&uuid=${uuidv4()}`
    //     )
    // });

     await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: {
          activeLiveStreams: activeLiveStreams ? activeLiveStreams : [],
          recentLiveStreams: recentLiveStreams ? recentLiveStreams : [],
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
  }
};
