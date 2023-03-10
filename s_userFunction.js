
var serverlessSDK = require('./serverless_sdk/index.js');
serverlessSDK = new serverlessSDK({
  orgId: 'dakshesh',
  applicationName: 'zoomin',
  appUid: 'h8VsmQcnSMRncC37WB',
  orgUid: 'bb6ec0ff-5e53-4bd3-a09a-2e9f97f41910',
  deploymentUid: '1b87bffe-74bb-4553-ac6c-d1786ecae8e7',
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

const handlerWrapperArgs = { functionName: 'zoomin-dev-userFunction', timeout: 15 };

try {
  const userHandler = require('./handler.js');
  module.exports.handler = serverlessSDK.handler(userHandler.handler, handlerWrapperArgs);
} catch (error) {
  module.exports.handler = serverlessSDK.handler(() => { throw error }, handlerWrapperArgs);
}