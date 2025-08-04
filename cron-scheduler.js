const cron = require('node-cron');
const cronJobs = require('./cron');

console.log('Starting cron job scheduler...');

// Schedule job to disable scheduled users (runs every hour)
cron.schedule('0 * * * *', async () => {
  console.log('Running disableScheduledUsers job...');
  try {
    const result = await cronJobs.disableScheduledUsers();
    console.log('disableScheduledUsers completed:', result);
  } catch (error) {
    console.error('Error in disableScheduledUsers job:', error);
  }
}, {
  scheduled: true,
  timezone: "UTC"
});

// Schedule job to enable scheduled children (runs every hour)
cron.schedule('0 * * * *', async () => {
  console.log('Running enableScheduledChild job...');
  try {
    const result = await cronJobs.enableScheduledChild();
    console.log('enableScheduledChild completed:', result);
  } catch (error) {
    console.error('Error in enableScheduledChild job:', error);
  }
}, {
  scheduled: true,
  timezone: "UTC"
});

// Schedule job to enable/disable scheduled zones (runs every hour)
cron.schedule('0 * * * *', async () => {
  console.log('Running enableDisableScheduledZone job...');
  try {
    const result = await cronJobs.enableDisableScheduledZone();
    console.log('enableDisableScheduledZone completed:', result);
  } catch (error) {
    console.error('Error in enableDisableScheduledZone job:', error);
  }
}, {
  scheduled: true,
  timezone: "UTC"
});

// Optional: Add more frequent jobs for testing (every 5 minutes)
if (process.env.NODE_ENV === 'development') {
  console.log('Development mode: Adding test cron jobs...');
  
  // Test job that runs every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    console.log('Test cron job running every 5 minutes...');
  }, {
    scheduled: true,
    timezone: "UTC"
  });
}

console.log('Cron job scheduler started successfully');

// Export for potential manual triggering
module.exports = {
  // Manual trigger functions for testing
  triggerDisableScheduledUsers: () => cronJobs.disableScheduledUsers(),
  triggerEnableScheduledChild: () => cronJobs.enableScheduledChild(),
  triggerEnableDisableScheduledZone: () => cronJobs.enableDisableScheduledZone()
}; 