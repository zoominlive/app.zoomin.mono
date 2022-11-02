
var serverlessSDK = require('./serverless_sdk/index.js');
serverlessSDK = new serverlessSDK({
  orgId: 'dakshesh',
  applicationName: 'zoomin',
  appUid: 'h8VsmQcnSMRncC37WB',
  orgUid: 'bb6ec0ff-5e53-4bd3-a09a-2e9f97f41910',
  deploymentUid: 'bf7c3866-7faa-417f-a4d6-14630314ec36',
  serviceName: 'zoomin',
  shouldLogMeta: true,
  shouldCompressLogs: true,
  disableAwsSpans: false,
  disableHttpSpans: false,
  stageName: 'dev',
  serverlessPlatformStage: 'prod',
  devModeEnabled: false,
  accessKey: null,
  pluginVersion: '6.2.2',
  disableFrameworksInstrumentation: false
});

const handlerWrapperArgs = { functionName: 'zoomin-dev-disableScheduledMembers', timeout: 20 };

try {
  const userHandler = require('./cron.js');
  module.exports.handler = serverlessSDK.handler(userHandler.disableScheduledFamilyAndChild, handlerWrapperArgs);
} catch (error) {
  module.exports.handler = serverlessSDK.handler(() => { throw error }, handlerWrapperArgs);
}