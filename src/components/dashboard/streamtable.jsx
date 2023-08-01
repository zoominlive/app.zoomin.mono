import React from 'react';
import { Typography, Stack, Chip, Box } from '@mui/material';
import PropTypes from 'prop-types';
import NoData from '../../assets/no-data.svg';
import moment from 'moment';
import { Video } from 'react-feather';
import { Link } from 'react-router-dom';

export default function StreamTable({ rows, columns, title, isLoading }) {
  return (
    <>
      {/* <Paper sx={{ marginTop: 2 }}> */}

      <Stack
        direction="row"
        spacing={2}
        justifyContent={'space-between'}
        style={{ padding: 10 }}
        className="table-title">
        <Typography>{title}</Typography>
        <Link href="#" sx={{ fontFamily: 'small', color: '#5A53DD' }}>
          View More
        </Link>
      </Stack>

      {/* <TableContainer
        component={Paper}
        sx={{
          minHeight: 160,
          maxHeight: 160,
          marginTop: 0,
          width: '100%'
        }}
        className={rows && rows?.length > 0 ? '' : 'empty-data'}> */}
      <Box>
        {/* <TableHead>
            <TableRow>
              {columns.map((column, index) => (
                <TableCell key={index}>{column}</TableCell>
              ))}
            </TableRow>
          </TableHead> */}
        <Box className="div-header">
          {columns.map((column, index) => (
            <Box key={index} style={{ width: column == 'Rooms' ? '45%' : '35%' }}>
              {column}
            </Box>
          ))}
          <Box key={'action'} style={{ width: '5%' }}></Box>
        </Box>
        {rows && rows?.length > 0 ? (
          <Box style={{ width: '100%', height: '100px', overflowY: 'auto' }} className="table-body">
            {rows
              //.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => {
                return (
                  <>
                    <Box className="div-row" key={`${row?.room?.room_name}-${index}`}>
                      <Box style={{ width: '35%' }}>{row?.stream_name}</Box>
                      <Box style={{ width: '35%' }}>
                        {moment(row?.stream_start_time).format('hh:mm A')}
                      </Box>
                      <Box style={{ width: '45%' }}>
                        <Chip label={row?.room?.room_name} />{' '}
                      </Box>
                      <Box style={{ width: '5%' }}>
                        <Link
                          to="/watch-stream"
                          state={{
                            roomName: row?.room?.room_name,
                            // eslint-disable-next-line react/prop-types
                            roomId: row?.room?.room_id,
                            location: row?.room?.location,
                            camName: row?.room?.cam_name,
                            camId: row?.room?.cam_id,
                            streamUrl: row?.room?.stream_uri
                          }}>
                          <Video />
                        </Link>
                      </Box>
                    </Box>
                  </>

                  // <TableRow key={index}>
                  //   <TableCell>{row?.stream_name}</TableCell>
                  //   <TableCell>{moment(row?.stream_start_time).format('hh:mm A')}</TableCell>
                  //   <TableCell>
                  //     <Chip label={row?.room?.room_name} />{' '}
                  //   </TableCell>
                  //   <TableCell>
                  //     <Link
                  //       to="/watch-stream"
                  //       state={{
                  //         roomName: row?.room?.room_name,
                  //         // eslint-disable-next-line react/prop-types
                  //         roomId: row?.room?.room_id,
                  //         location: row?.room?.location,
                  //         camName: row?.room?.cam_name,
                  //         camId: row?.room?.cam_id,
                  //         streamUrl: row?.room?.stream_uri
                  //       }}>
                  //       <Video />
                  //     </Link>
                  //   </TableCell>
                  // </TableRow>
                );
              })}
          </Box>
        ) : !isLoading ? (
          <Stack
            spacing={1}
            alignItems="center"
            justifyContent="center"
            sx={{
              fontWeight: 'bold'
            }}>
            <img src={NoData} />
            <div>No Entries Found</div>
          </Stack>
        ) : null}
      </Box>
      {/* </TableContainer> */}
      {/* </Paper> */}
    </>
  );
}
StreamTable.propTypes = {
  rows: PropTypes.array,
  columns: PropTypes.array,
  title: PropTypes.string,
  isLoading: PropTypes.bool
};
