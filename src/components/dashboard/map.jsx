import { Box } from '@mui/material';
import React from 'react';
import GoogleMapReact from 'google-map-react';
// import RoomIcon from '@mui/icons-material/Room';

const Map = () => {
  const location = {
    address: '1600 Amphitheatre Parkway, Mountain View, california.',
    lat: 37.42216,
    lng: -122.08427
  };
  return (
    <Box height={'600px'}>
      <GoogleMapReact
        bootstrapURLKeys={{ key: 'AIzaSyDn-DZI5-5xknrwgTGIhbFc2abDFXULWro' }}
        defaultCenter={location}
        defaultZoom={17}>
        {/* <div className="pin">
          <RoomIcon />
          <p className="pin-text">{'text'}</p>
        </div> */}
      </GoogleMapReact>
    </Box>
  );
};

export default Map;
