import { Avatar, Box, Chip, Paper, Stack, TablePagination, Typography } from '@mui/material';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import PropTypes from 'prop-types';
import { useState } from 'react';
import NoDataDiv from '../common/nodatadiv';
import { Link } from 'react-router-dom';
// import { Link } from 'react-router-dom';
import AuthContext from '../../context/authcontext';
import { useContext } from 'react';

export default function ViewersTable({ rows, columns, title, pagination, isLoading }) {
  const authCtx = useContext(AuthContext);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };
  return (
    <Paper sx={{ marginTop: 2, height: '96%', minHeight: !pagination ? '338px' : '' }}>
      <Box>
        <Typography style={{ padding: 20 }}>{title}</Typography>
        <Box className="div-header">
          {columns.map((column, index) => (
            <Box key={index} style={{ width: column.width }}>
              {column.label}
            </Box>
          ))}
          <Box key={'action'} style={{ width: '5%' }}></Box>
        </Box>
        {rows && rows?.length > 0 ? (
          <Box
            style={{
              width: '100%',
              minHeight: pagination && rows?.length > 0 ? '196px' : '230px',
              overflowY: 'auto'
            }}
            className="table-body">
            {pagination
              ? rows
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => {
                    return (
                      <Box className="div-row row-marging" key={`${row?.room?.room_name}-${index}`}>
                        <Box style={{ width: '30%' }}>
                          <Box className="viewer-profile">
                            <Box className="profile-img">
                              {row.family?.profile_image || row.user?.profile_image ? (
                                <Avatar
                                  src={row.family?.profile_image || row.user?.profile_image}
                                  // src={
                                  //   'https://zoomin-dev-images.s3.us-west-2.amazonaws.com/1671351478371'
                                  // }
                                />
                              ) : (
                                <Avatar>
                                  {row.family
                                    ? `${row.family?.first_name[0].toUpperCase()}${row.family?.last_name[0].toUpperCase()}`
                                    : `${row.user?.first_name[0].toUpperCase()}${row.user?.last_name[0].toUpperCase()}`}
                                </Avatar>
                              )}

                              {/* <img
                                src="https://zoomin-dev-images.s3.us-west-2.amazonaws.com/1671351478371"
                                alt=""
                              /> */}
                            </Box>
                            {(row?.family?.first_name || row?.user?.first_name) +
                              ' ' +
                              (row?.family?.last_name || row?.user?.last_name)}
                          </Box>
                        </Box>

                        <Box style={{ width: '20%' }}>
                          {row.family?.children?.length > 0
                            ? row?.family?.children?.map(
                                (child, index) =>
                                  child?.first_name +
                                  (index == row?.family?.children?.length - 1 ? '' : `,`)
                              )
                            : '--'}
                        </Box>
                        <Box style={{ width: '40%' }}>
                          {row?.family?.children[0]?.roomsInChild &&
                          row?.family?.children[0]?.roomsInChild.length > 0
                            ? row?.family?.children[0]?.roomsInChild?.map((room, index) => (
                                <Chip
                                  key={room?.room.room_name + '-' + index}
                                  label={room?.room.room_name}
                                />
                              ))
                            : '--'}
                        </Box>
                        <Box style={{ width: '5%' }}>
                          {/* <Link
                            to="/logs"
                            state={{
                              type: 'Access Log',
                              action: 'Get',
                              function: ['Watch_Stream'],
                              users: row?.recent_user_id,
                              location: authCtx?.location
                            }}> */}
                          <KeyboardArrowRightIcon />
                          {/* </Link> */}
                        </Box>
                      </Box>
                    );
                  })
              : rows.map((row, index) => {
                  return (
                    <Box className="div-row row-marging" key={`${row?.room?.room_name}-${index}`}>
                      <Box style={{ width: '50%' }}>
                        <Box className="viewer-profile">
                          <Box className="profile-img">
                            {row.family?.profile_image || row.user?.profile_image ? (
                              <Avatar
                                src={row.family?.profile_image || row.user?.profile_image}
                                // src={
                                //   'https://zoomin-dev-images.s3.us-west-2.amazonaws.com/1671351478371'
                                // }
                              />
                            ) : (
                              <Avatar>
                                {row.family
                                  ? `${row.family?.first_name[0].toUpperCase()}${row.family?.last_name[0].toUpperCase()}`
                                  : `${row.user?.first_name[0].toUpperCase()}${row.user?.last_name[0].toUpperCase()}`}
                              </Avatar>
                            )}

                            {/* <img
                              src="https://zoomin-dev-images.s3.us-west-2.amazonaws.com/1671351478371"
                              alt=""
                            /> */}
                          </Box>
                          {(row?.family?.first_name || row?.user?.first_name) +
                            ' ' +
                            (row?.family?.last_name || row?.user?.last_name)}
                        </Box>
                      </Box>
                      <Box style={{ width: '45%' }}>{row?.count}</Box>
                      <Box style={{ width: '5%' }}>
                        {/* <KeyboardArrowRightIcon />
                        <Link
                          to="/logs"
                          state={{
                            type: 'Access Log',
                            action: 'Get',
                            function: ['Watch_Stream'],
                            users: row?.recent_user_id,
                            location: authCtx?.location
                          }}>
                          Go
                        </Link> */}
                        <Link
                          to="/logs"
                          state={{
                            type: 'Access Log',
                            action: 'Get',
                            function: [{ id: 'Watch_Stream', name: 'Request Stream' }],
                            user: row?.user
                              ? [
                                  {
                                    user_id: row?.user?.user_id,
                                    first_name: row?.user?.first_name,
                                    last_name: row?.user?.last_name
                                  }
                                ]
                              : [],
                            family: row?.family
                              ? [
                                  {
                                    family_member_id: row?.family?.family_member_id,
                                    first_name: row?.family?.first_name,
                                    last_name: row?.family?.last_name
                                  }
                                ]
                              : [],
                            location: authCtx?.location
                          }}>
                          <KeyboardArrowRightIcon />
                        </Link>
                      </Box>
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
      {pagination && rows && rows?.length > 0 ? (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 100]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      ) : null}
    </Paper>
  );
}
ViewersTable.propTypes = {
  rows: PropTypes.array,
  columns: PropTypes.array,
  title: PropTypes.string,
  pagination: PropTypes.bool,
  isLoading: PropTypes.bool
};
