import { Box, IconButton, Tooltip } from '@mui/material';
import React, { useRef } from 'react';
import GoogleMapReact from 'google-map-react';
import PropTypes from 'prop-types';
import { useState } from 'react';
import useSupercluster from 'use-supercluster';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';

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
    <Box className="main-map-wraper">
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
            const isCluster = cluster.properties?.cluster;
            const pointCount = cluster.properties?.point_count ?? 1;
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
                {(() => {
                  const title =
                    cluster.properties?.label ||
                    cluster.properties?.title ||
                    cluster.properties?.name ||
                    `${latitude?.toFixed?.(5)}, ${longitude?.toFixed?.(5)}`;
                  const size = `${10 + (pointCount / props.data.length) * 20}px`;
                  const markerNode = (
                    <div className="cluster-marker" style={{ width: size, height: size }}></div>
                  );
                  return (
                    <Tooltip title={title} placement="top" arrow>
                      {markerNode}
                    </Tooltip>
                  );
                })()}
              </Marker>
            );
          })}
        </GoogleMapReact>
      </Box>
      {props.isMapIcon ? (
        <IconButton className="map-icon" onClick={() => props.onOpen()}>
          <MapOutlinedIcon />
        </IconButton>
      ) : null}
    </Box>
  );
};

export default Map;

Map.propTypes = {
  data: PropTypes.array,
  height: PropTypes.number,
  isMapIcon: PropTypes.bool,
  onOpen: PropTypes.func
};
