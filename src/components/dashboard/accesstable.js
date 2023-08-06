import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import NoDataDiv from '../common/nodatadiv';

export default function AccessTable({ rows, columns, title, isLoading }) {
  return (
    <Paper sx={{ marginTop: 2, height: '96%', minHeight: '338px' }}>
      <Box>
        <Typography style={{ padding: 20 }}>{title}</Typography>
        <Box className="div-header">
          {columns.map((column, index) => (
            <Box key={index} style={{ width: '45%' }}>
              {column}
            </Box>
          ))}
        </Box>
        {rows && rows?.length > 0 ? (
          <Box
            style={{
              width: '100%',
              minHeight: '230px',
              overflowY: 'auto'
            }}
            className="table-body">
            {rows.map((row, index) => {
              return (
                <Box className="div-row row-marging" key={`${row?.childFirstName}-${index}`}>
                  <Box style={{ width: '45%' }}>
                    {row?.childFirstName + ' ' + row.childLastName}
                  </Box>
                  <Box style={{ width: '45%' }}>
                    {row?.rooms.map((r) => (
                      <Chip key={r} label={r} />
                    ))}
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
    </Paper>
  );
}
AccessTable.propTypes = {
  rows: PropTypes.array,
  columns: PropTypes.array,
  title: PropTypes.string,
  isLoading: PropTypes.bool
};
