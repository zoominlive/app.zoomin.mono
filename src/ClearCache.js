import React, { useState, useEffect } from 'react';
import packageJson from '../package.json';
import moment from 'moment';
import { useSnackbar } from 'notistack';
import { Button } from '@mui/material';
const buildDateGreaterThan = (latestDate, currentDate) => {
  const momLatestDateTime = moment(latestDate);
  const momCurrentDateTime = moment(currentDate);

  if (momLatestDateTime.isAfter(momCurrentDateTime)) {
    return true;
  } else {
    return false;
  }
};

function withClearCache(Component) {
  function ClearCacheComponent(props) {
    const [isLatestBuildDate, setIsLatestBuildDate] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
      fetch('/meta.json')
        .then((response) => response.json())
        .then((meta) => {
          const latestVersionDate = meta.buildDate;
          const currentVersionDate = packageJson.buildDate;
          const shouldForceRefresh = buildDateGreaterThan(latestVersionDate, currentVersionDate);

          if (shouldForceRefresh) {
            setIsLatestBuildDate(false);
            refreshCacheAndReload();
          } else {
            setIsLatestBuildDate(true);
          }
        });
      let timer1;
      const timer = setInterval(() => {
        fetch(`/meta.json?nocache=${new Date().getTime()}`)
          .then((response) => response.json())
          .then((meta) => {
            const latestVersionDate = meta.buildDate;
            const currentVersionDate = packageJson.buildDate;

            const shouldForceRefresh = buildDateGreaterThan(latestVersionDate, currentVersionDate);
            if (shouldForceRefresh) {
              //show snackbar with refresh button
              timer1 = setTimeout(() => {
                enqueueSnackbar('A new version was released', {
                  autoHideDuration: 290000,
                  variant: 'success',
                  action: refreshAction
                });
              }, 120000);
            }
          });
      }, 300000);

      return () => {
        clearInterval(timer);
        clearTimeout(timer1);
      };
    }, []);

    const refreshAction = () => {
      //render the snackbar button
      return (
        <>
          <Button
            className="snackbar-button"
            size="small"
            style={{ color: 'white' }}
            onClick={() => window.location.reload()}>
            {'refresh'}
          </Button>
        </>
      );
    };

    const refreshCacheAndReload = () => {
      if (caches) {
        // Service worker cache should be cleared with caches.delete()
        caches.keys().then((names) => {
          for (const name of names) {
            caches.delete(name);
          }
        });
      }
      // delete browser cache and hard reload
      window.location.reload(true);
    };

    return <React.Fragment>{isLatestBuildDate ? <Component {...props} /> : null}</React.Fragment>;
  }

  return ClearCacheComponent;
}

export default withClearCache;
