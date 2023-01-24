import React, { useState } from 'react';
import {
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Paper,
  Stack
} from '@mui/material';
import PropTypes from 'prop-types';
import NoData from '../../assets/no-data.svg';

export default function StickyHeadTable({ rows, columns, title, topViewers, pagination }) {
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
    <>
      <Paper sx={{ marginTop: 2 }}>
        <Typography>{title}</Typography>
        <TableContainer
          component={Paper}
          sx={{
            minHeight: pagination && rows.length > 0 ? 240 : 290,
            maxHeight: pagination && rows.length > 0 ? 240 : 290,
            marginTop: 0
          }}
          className={rows && rows?.length > 0 ? '' : 'empty-data'}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((column, index) => (
                  <TableCell key={index}>{column}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            {rows && rows?.length > 0 ? (
              <TableBody>
                {pagination
                  ? rows
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row, index) => {
                        return row.family ? (
                          <TableRow key={index}>
                            <TableCell>
                              {row?.family?.first_name + ' ' + row.family.last_name}
                            </TableCell>
                            <TableCell>
                              {row.family?.children?.length > 0
                                ? row?.family?.children?.map(
                                    (child, index) =>
                                      child?.first_name +
                                      (index == row?.family?.children?.length - 1 ? '' : `,`)
                                  )
                                : ''}
                            </TableCell>
                            <TableCell>
                              {row?.family?.children[0]?.roomsInChild &&
                              row?.family?.children[0]?.roomsInChild.length > 0
                                ? row?.family?.children[0]?.roomsInChild?.map(
                                    (room, index) =>
                                      room?.room.room_name +
                                      (index == row?.family?.children[0]?.roomsInChild?.length - 1
                                        ? ''
                                        : `,`)
                                  )
                                : ''}
                            </TableCell>
                          </TableRow>
                        ) : null;
                      })
                  : rows?.map((row, index) => (
                      <>
                        <TableRow key={index}>
                          {topViewers ? (
                            <>
                              <TableCell>{row?.count}</TableCell>
                              <TableCell>
                                {(row?.family?.first_name || row?.user?.first_name) +
                                  ' ' +
                                  (row?.family?.last_name || row?.user?.last_name)}
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell>{row?.childFirstName + ' ' + row.childLastName}</TableCell>
                              <TableCell>{row?.rooms.toString()}</TableCell>
                            </>
                          )}
                        </TableRow>
                      </>
                    ))}
              </TableBody>
            ) : (
              <Stack
                spacing={1}
                alignItems="center"
                justifyContent="center"
                sx={{
                  fontSize: 15,
                  fontWeight: 'bold',
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '37%'
                }}>
                <img src={NoData} />
                <div>No Entries Found</div>
              </Stack>
            )}
          </Table>
        </TableContainer>
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
    </>
  );
}
StickyHeadTable.propTypes = {
  rows: PropTypes.array,
  columns: PropTypes.array,
  title: PropTypes.string,
  topViewers: PropTypes.bool,
  pagination: PropTypes.bool
};
