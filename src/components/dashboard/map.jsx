import { Box, Tooltip } from '@mui/material';
import React, { useRef } from 'react';
import GoogleMapReact from 'google-map-react';
import PropTypes from 'prop-types';
import { useState } from 'react';
import useSupercluster from 'use-supercluster';

const Marker = ({ children }) => children;

const Map = (props) => {
  const mapRef = useRef(null);
  const [bounds, setBounds] = useState(null);
  const [zoom, setZoom] = useState(10);
  const { clusters, supercluster } = useSupercluster({
    points: props.data,
    bounds,
    zoom,
    options: { radius: 75, maxZoom: 10 }
  });

  return (
    <Box height={'600px'} className="map-wrapper">
      <GoogleMapReact
        bootstrapURLKeys={{ key: process.env.REACT_APP_GOOGLE_API_KEY }}
        defaultCenter={{ lat: 41.850033, lng: -87.6500523 }}
        defaultZoom={1}
        options={{
          fullscreenControl: false
        }}
        onChange={({ zoom, bounds }) => {
          setZoom(zoom);
          setBounds([bounds.nw.lng, bounds.se.lat, bounds.se.lng, bounds.nw.lat]);
        }}
        yesIWantToUseGoogleMapApiInternals
        onGoogleApiLoaded={({ map }) => {
          mapRef.current = map;
        }}>
        {clusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count: pointCount } = cluster.properties;
          if (isCluster) {
            return (
              <Marker key={`cluster-${cluster.id}`} lat={latitude} lng={longitude}>
                <div
                  className="cluster-marker"
                  onClick={() => {
                    const expansionZoom = Math.min(
                      supercluster.getClusterExpansionZoom(cluster.id),
                      20
                    );
                    mapRef.current.setZoom(expansionZoom);
                    mapRef.current.panTo({ lat: latitude, lng: longitude });
                  }}>
                  {pointCount}
                </div>
              </Marker>
            );
          }
          return (
            <Marker key={`crime-${cluster.properties.rv_id}`} lat={latitude} lng={longitude}>
              <Tooltip title="Location 1" placement="top" arrow>
                <div
                  className="cluster-marker"
                  style={{
                    width: `${10 + (pointCount / props.data.length) * 20}px`,
                    height: `${10 + (pointCount / props.data.length) * 20}px`
                  }}></div>
              </Tooltip>
            </Marker>
          );
        })}
      </GoogleMapReact>
    </Box>
  );
};

export default Map;

Map.propTypes = {
  data: PropTypes.array
};
