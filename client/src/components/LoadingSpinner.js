import React from 'react';
import { Typography, CircularProgress } from '@material-ui/core';
import { usePostListStyles } from '../styles/muiStyles';

const LoadingSpinner = ({ text }) => {
  const classes = usePostListStyles();

  return (
    <div className={classes.loadSpinner}>
      {/* reduced spinner size */}
      <CircularProgress size={48} disableShrink />
      <Typography color="primary" variant="body1">
        {text}
      </Typography>
    </div>
  );
};

export default LoadingSpinner;
