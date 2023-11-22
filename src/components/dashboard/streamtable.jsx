import React from 'react';
import { Typography, Stack, Chip, Box } from '@mui/material';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Video } from 'react-feather';
import { Link } from 'react-router-dom';
import NoDataDiv from '../common/nodatadiv';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export default function StreamTable({ rows, columns, title, isLoading }) {
  return (
    <>
      <Stack
        direction="row"
        spacing={2}
        justifyContent={'space-between'}
        style={{ padding: 10 }}
        className="table-title">
        <Typography>{title}</Typography>
        <Link to="/recordings" sx={{ fontFamily: 'small', color: '#5A53DD' }}>
          View More
        </Link>
      </Stack>
      <Box className="stream-table-wrap">
        <Box className="div-header">
          {columns.map((column, index) => (
            <Box key={index} style={{ width: column == 'Rooms' ? '45%' : '35%' }}>
              {column}
            </Box>
          ))}
          <Box key={'action'} style={{ width: '5%' }}></Box>
        </Box>
        {rows && rows?.length > 0 ? (
          <Box style={{ width: '100%', height: '174px', overflowY: 'auto' }} className="table-body">
            {rows
              //.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => {
                return (
                  <Box key={`${row?.room?.room_name}-${index}`}>
                    <Link
                      to="/watch-stream"
                      state={{
                        roomName: row?.room?.room_name,
                        // eslint-disable-next-line react/prop-types
                        roomId: row?.room?.room_id,
                        location: row?.room?.location,
                        camName: row?.room?.live_stream_cameras[0]?.cam_name,
                        camId: row?.room?.live_stream_cameras[0]?.cam_id,
                        streamUrl:
                          row?.presigned_url || row?.room?.live_stream_cameras[0]?.stream_uri,
                        livStream: true
                      }}>
                      <>
                        <Box className="div-row">
                          <Box style={{ width: '35%' }}>{row?.stream_name}</Box>
                          <Box style={{ width: '35%' }}>
                            <Stack
                              direction={'row'}
                              alignItems="center"
                              justifyContent={'flex-start'}
                              gap={0.5}>
                              <AccessTimeIcon /> {moment(row?.stream_start_time).format('h:mm A')}
                            </Stack>{' '}
                          </Box>
                          <Box style={{ width: '35%' }}>
                            <Chip label={row?.room?.room_name} />{' '}
                          </Box>
                          <Box style={{ width: '5%' }}>
                            {/* <Link
                          to="/watch-stream"
                          state={{
                            roomName: row?.room?.room_name,
                            // eslint-disable-next-line react/prop-types
                            roomId: row?.room?.room_id,
                            location: row?.room?.location,
                            camName: row?.room?.live_stream_cameras[0]?.cam_name,
                            camId: row?.room?.live_stream_cameras[0]?.cam_id,
                            streamUrl:
                              row?.presigned_url || row?.room?.live_stream_cameras[0]?.stream_uri,
                            livStream: true
                          }}> */}
                            <Video />
                            {/* </Link> */}
                          </Box>
                        </Box>
                      </>
                    </Link>
                  </Box>
                );
              })}
          </Box>
        ) : !isLoading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ paddingTop: 2 }}>
            <NoDataDiv />
          </Stack>
        ) : null}
      </Box>
    </>
  );
}
StreamTable.propTypes = {
  rows: PropTypes.array,
  columns: PropTypes.array,
  title: PropTypes.string,
  isLoading: PropTypes.bool
};
