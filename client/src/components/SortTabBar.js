import React from 'react';
import { ReactComponent as Best } from '../svg/best.svg';
import { ReactComponent as Hot } from '../svg/hot.svg';
import { ReactComponent as New } from '../svg/new.svg';
import { ReactComponent as Top } from '../svg/top.svg';
import { ReactComponent as Controversial } from '../svg/controversial.svg';
import { ReactComponent as Old } from '../svg/old.svg';
import { ReactComponent as Subscribed } from '../svg/subscribed.svg';

import { Paper, Tabs, Tab, SvgIcon } from '@material-ui/core';
import { useSortTabStyles } from '../styles/muiStyles';

const SortTabBar = ({ sortBy, handleTabChange, subscribedTab, user, orientation }) => {
  const classes = useSortTabStyles();

  const isVertical = (orientation || 'horizontal') === 'vertical';

  const tabs = [
    { key: 'hot', label: 'Hot', shortLabel: 'Hot', Icon: Hot },
    { key: 'subscribed', label: 'Subscribed', shortLabel: 'Sub', Icon: Subscribed, conditional: subscribedTab && user },
    { key: 'best', label: 'Best', shortLabel: 'Best', Icon: Best },
    { key: 'new', label: 'New', shortLabel: 'New', Icon: New },
    { key: 'top', label: 'Top', shortLabel: 'Top', Icon: Top },
    { key: 'controversial', label: 'Controversial', shortLabel: 'Cont', Icon: Controversial },
    { key: 'old', label: 'Old', shortLabel: 'Old', Icon: Old },
  ];

  return (
    <Paper variant="outlined" className={`${classes.mainPaper} ${isVertical ? classes.verticalTabs : ''}`}>
      <Tabs
        value={sortBy}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        variant="scrollable"
        scrollButtons="auto"
        orientation={isVertical ? 'vertical' : 'horizontal'}
      >
        {tabs.map((t) => {
          if (t.conditional === false) return null;
          const IconComp = t.Icon;
          if (isVertical) {
            const text = t.shortLabel || t.label;
            return (
              <Tab
                key={t.key}
                value={t.key}
                label={<div className={classes.tabLabel}><SvgIcon style={{ fontSize: 16 }}><IconComp /></SvgIcon><span className={classes.tabText}>{text}</span></div>}
              />
            );
          }

          return (
            <Tab
              key={t.key}
              value={t.key}
              icon={<SvgIcon fontSize="small"><IconComp /></SvgIcon>}
              label={t.label}
            />
          );
        })}
      </Tabs>
    </Paper>
  );
};

export default SortTabBar;
