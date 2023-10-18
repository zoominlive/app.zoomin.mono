const AWS = require('aws-sdk');
var s3 = new AWS.S3();
var detect = require('detect-file-type');

AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  AWS_SDK_LOAD_CONFIG: 1
});

var s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  signatureVersion: 'v4'
});

/* Upload Image on s3 bucket */
const _upload = async (file) => {
  try {
    const base64Data = new Buffer.from(file.replace(/^data:image\/\w+;base64,/, ''), 'base64');

    const type = file.split(';')[0].split('/')[1];

    var base64string_buffer = Buffer.from(file, 'base64');

    let file_type;
    await detect.fromBuffer(base64string_buffer, function (error, result) {
      if (error) {
        return error;
      }
      file_type = result;
    });
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${Date.now()}`,
      Body: base64Data,
      ACL: 'public-read',
      ContentEncoding: 'base64',
      ContentType: file_type?.mime
    };

    let location = '';
    try {
      const { Location, Key } = await s3.upload(params).promise();
      location = Location;
    } catch (error) {
      return error;
    }

    return location;
  } catch (error) {
    return error;
  }
};

// delete image from aws s3 bucket
const deleteObject = async (user) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: user.profile_image.substr(user.profile_image.search('.com/') + 5)
  };

  try {
    const isDeleted = await s3.deleteObject(params).promise();
    return isDeleted;
  } catch (error) {
    return error;
  }
};

const getPresignedUrl = async (s3Url) => {
  const urlParts = s3Url.split('/');
  const bucket = urlParts[2];
  const key = urlParts.slice(3).join('/');
  const s3_obj = new AWS.S3();
  const params = {
     Bucket: bucket,
     Key: key,
     Expires: 60 * 60 // 1 hour
  };
 
  try {
     const data = await s3_obj.getSignedUrlPromise('getObject', params);
     console.log('Pre-signed URL:', data);
     return data
  } catch (error) {
     console.error('Error getting pre-signed URL:', error);
     return error
  }
 };

 
module.exports = {
  _upload,
  deleteObject,
  getPresignedUrl
};
