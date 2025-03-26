const AWS = require('aws-sdk');
var s3 = new AWS.S3();
var detect = require('detect-file-type');
const s3ParseUrl = require('s3-url-parser');
const crypto = require('crypto');
const { S3Client, CopyObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const path = require('path');
const url = require('url');

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

const getPresignedUrlForRecordingImgAndVideo = async (url) => {
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

const getPresignedCfnUrlForRecordingVideo = async (url, days) => {
  const secretsManager = new AWS.SecretsManager({ region: "us-west-2" });

  async function getPrivateKey() {
    const secret = await secretsManager
      .getSecretValue({ SecretId: "zoomin" })
      .promise();

    // Decode Base64 private key before using it
    return Buffer.from(JSON.parse(secret.SecretString).CFN_PRIVATE_KEY, 'base64').toString('utf8');
  }

  const privateKey = await getPrivateKey();
  
  // CloudFront Config
  const cloudFrontUrl = url;
  const keyPairId = 'K3HBKKLGB2WJI7'; // Get this from AWS
  // const privateKeyPath = 'path-to-your-private-key.pem';
  let expiresAtUnix;
  if (days === "forever") {
    expiresAtUnix = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365 * 10); // 10 years (arbitrary large value)
  } else if (days) {
    expiresAtUnix = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * parseInt(days, 10)); // Convert days to seconds
  } else {
    expiresAtUnix = Math.floor(Date.now() / 1000) + 3600; // Expiry in 1 hour (UTC) by default
  }
  
  // Load Private Key
  // const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  
  // Function to Generate Signed URL
  const generateSignedUrl = (url, keyPairId, privateKey, expires) => {
    const policy = JSON.stringify({
      Statement: [
        {
          Resource: url,
          Condition: {
            DateLessThan: { 'AWS:EpochTime': expires }
          }
        }
      ]
    });
  
    // Sign the policy using the private key
    const sign = crypto.createSign('RSA-SHA1');
    sign.update(policy);
    const signature = sign.sign(privateKey, 'base64');
  
    // Construct the signed URL
    return `${url}?Expires=${expires}&Signature=${encodeURIComponent(signature)}&Key-Pair-Id=${keyPairId}`;
  };
  
  // Generate and Log the Signed URL
  const signedUrl = generateSignedUrl(cloudFrontUrl, keyPairId, privateKey, expiresAtUnix);
  console.log('Signed CloudFront URL:', signedUrl);
  return signedUrl;
}
 
const cloneS3ObjectForUser = async (s3Url, userId) => {
  const s3 = new S3Client({ region: "us-west-2" });
  try {
    // Parse S3 URL
    const { host, pathname } = new url.URL(s3Url);
    const bucketName = host.split('.')[0]; // Assuming URL like https://bucket.s3.amazonaws.com/key
    const originalKey = pathname.slice(1); // Remove the leading "/"

    // Extract original object name (without extension)
    const originalName = path.basename(originalKey, path.extname(originalKey));

    // Get the last 4 characters of the userId (or any unique identifier)
    const last4 = userId.slice(-4);

    // Generate new key with same folder structure
    const dir = path.dirname(originalKey);
    const ext = path.extname(originalKey);
    const newKey = `${dir}/${originalName}-share-${last4}${ext}`;

    // Copy object
    const copyParams = {
      Bucket: bucketName,
      CopySource: `/${bucketName}/${originalKey}`,
      Key: newKey,
    };

    await s3.send(new CopyObjectCommand(copyParams));

    console.log(`✅ Object cloned as: ${newKey}`);
    return `https://${bucketName}.s3.amazonaws.com/${newKey}`;
  } catch (err) {
    console.error('❌ Error cloning S3 object:', err);
    throw err;
  }
}

const deleteS3Object = async (s3Url, bucketName) => {
  const s3 = new S3Client({ region: "us-west-2" });
  try {
    console.log('s3Url==>', s3Url);
    
    const url = new URL(s3Url);
    const objectKey = decodeURIComponent(url.pathname.slice(1)); // remove leading '/'

    const deleteParams = {
      Bucket: bucketName,
      Key: objectKey
    };

    await s3.send(new DeleteObjectCommand(deleteParams));
    console.log(`✅ Successfully deleted: ${objectKey}`);
  } catch (error) {
    console.error(`❌ Failed to delete S3 object:`, error);
  }
};

module.exports = {
  _upload,
  deleteObject,
  getPresignedUrl,
  getPresignedUrlForThumbnail,
  getPresignedUrlForThumbnail2,
  getPresignedUrlForRecordingImgAndVideo,
  getPresignedCfnUrlForRecordingVideo,
  cloneS3ObjectForUser,
  deleteS3Object
};
