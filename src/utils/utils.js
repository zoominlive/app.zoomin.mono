import moment from 'moment';

/**
 * Function returning the build date(as per provided epoch)
 * @param epoch Time in milliseconds
 */
export const getBuildDate = (epoch) => {
  const epochUnix = epoch / 1000;
  const buildDate = moment.unix(epochUnix).format('DD-MM-YYYY HH:mm');
  return buildDate;
};
