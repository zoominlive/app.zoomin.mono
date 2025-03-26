import { useState, useEffect } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { Button, Stack, Typography } from '@mui/material';

const VideoExpirationTimer = ({ expirationTime, handleDeleteRecord }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isSameDay, setIsSameDay] = useState(false);

  useEffect(() => {
    if (!expirationTime) return;

    const updateRemainingTime = () => {
      const now = moment();
      const expiresAt = moment(expirationTime);
      setIsSameDay(now.isSame(expiresAt, 'day')); // Check if expiration is today

      const diff = moment.duration(expiresAt.diff(now));

      if (diff.asSeconds() <= 0) {
        setTimeLeft('Expired');
        return;
      }

      if (now.isSame(expiresAt, 'day')) {
        // Show countdown only if expiration is today
        const hours = Math.floor(diff.asHours());
        const minutes = Math.floor(diff.minutes());
        setTimeLeft(`${hours} hours ${minutes} minutes`);
      } else {
        // Show full date if it's on a different day
        setTimeLeft(expiresAt.format('MMM DD, YYYY hh:mm A'));
      }
    };

    updateRemainingTime(); // Initial call
    const interval = setInterval(updateRemainingTime, 60000); // Update every minute

    return () => clearInterval(interval); // Cleanup on unmount
  }, [expirationTime]);

  return (
    <>
      <Stack direction={'row'} alignItems={'center'} gap={2}>
        <Typography variant="body1" fontWeight="bold">
          <strong>Video {isSameDay ? 'Expires In:' : 'Expires On:'}</strong> {timeLeft}
        </Typography>
        <Button
          variant="contained"
          sx={{
            backgroundColor: '#D52C2C !important',
            borderRadius: '100px',
            textTransform: 'capitalize'
          }}
          onClick={handleDeleteRecord}>
          Expire Video Now
        </Button>
      </Stack>
    </>
  );
};

export default VideoExpirationTimer;

VideoExpirationTimer.propTypes = {
  expirationTime: PropTypes.string,
  handleDeleteRecord: PropTypes.func
};
