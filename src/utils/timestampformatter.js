import moment from 'moment';

export const formatTimestamp = (isoString) => {
  const formattedDateTime = moment(isoString).format('D MMM | h:mm A');

  return formattedDateTime;
};
