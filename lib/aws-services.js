const AWS = require('aws-sdk');
var s3 = new AWS.S3();
var detect = require('detect-file-type');
const s3ParseUrl = require('s3-url-parser');

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
    //  console.log('Pre-signed URL:', data);
     return data
  } catch (error) {
     console.error('Error getting pre-signed URL:', error);
     return error
  }
 };

const getPresignedUrlForThumbnail = async (s3Url) => {
  const parsedUrl = new URL(s3Url);
  const key = parsedUrl.pathname.substr(1); 
  const bucket = parsedUrl.hostname.split('.')[0];
  const s3_obj = new AWS.S3({
    region: ''
  });
  const params = {
     Bucket: bucket,
     Key: key,
     Expires: 604800 // 7 days
  };
 
  try {
     const data = await s3_obj.getSignedUrl('getObject', params);
    //  console.log('Pre-signed URL:', data);
     return data
  } catch (error) {
     console.error('Error getting pre-signed URL:', error);
     return error
  }
 };

const getPresignedUrlForThumbnail2 = async (s3Url) => {
try {
  const parsedUrl = new URL(s3Url);
  const key = parsedUrl.pathname.substr(1); 
  console.log('key-->', key);
  const bucket = parsedUrl.hostname.split('.')[0];
  console.log('bucket-->', bucket);
  const s3_obj = new AWS.S3();
  const encodedUrl = encodeURIComponent(s3Url)
  const url = Buffer.from(encodedUrl, 'base64').toString('utf-8');

  const urlParts = url.split('/');
  const fileName = urlParts[urlParts.length - 1];
  const extension = fileName.split('.').pop();
  const contentType = `application/${extension}`;

  const s3Params = {
    Bucket: bucket,
    Key: key,
  };

  const s3Response = await s3_obj.getObject(s3Params).promise();
  const fileContent = s3Response.Body;

  // Send file data
  // res.set({
  //   'Content-Type': contentType,
  //   'Content-Disposition': `inline; filename="${fileName}"`,
  // });
  // res.send(fileContent);
  console.log('fileContent-->', fileContent);
} catch (error) {
  console.error('Error:', error);
  res.status(500).send('Internal Server Error');
}
};

const getPresignedUrlForRecordingImgAndVideo = async(url) => {
  const s3Client = new AWS.S3({
    region: 'us-west-2',
    apiVersion: '2006-03-01'
  });

  const parsedUrl = url;
  const { bucket, key } = s3ParseUrl(parsedUrl);
  
  const params = {
    Bucket: bucket,
    Key: key
  }
  
  const signedUrl = s3Client.getSignedUrl('getObject', {
    ...params,
    Expires: 60 * 60 // URL expires in 1 hour
  })

  return signedUrl;
}
 
module.exports = {
  _upload,
  deleteObject,
  getPresignedUrl,
  getPresignedUrlForThumbnail,
  getPresignedUrlForThumbnail2,
  getPresignedUrlForRecordingImgAndVideo
};
