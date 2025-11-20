import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link as RouterLink } from "react-router-dom";
import { UpvoteButton, DownvoteButton } from "./VoteButtons";
import { notify } from "../reducers/notificationReducer";
import EditDeleteMenu from "./EditDeleteMenu";
import getEditedThumbail from "../utils/cloudinaryTransform";
import { fixUrl } from "../utils/formatUrl";
import TimeAgo from "timeago-react";
import getErrorMsg from "../utils/getErrorMsg";

import {
  Paper,
  Typography,
  useMediaQuery,
  CardMedia,
  Link,
  Button,
} from "@material-ui/core";
import { useCardStyles } from "../styles/muiStyles";
import { useTheme } from "@material-ui/core/styles";
import MessageIcon from "@material-ui/icons/Message";
import LinkIcon from "@material-ui/icons/Link";

import CommentIcon from "@material-ui/icons/Comment";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

const PostCard = ({ post, toggleUpvote, toggleDownvote }) => {
  const {
    id,
    title,
    postType,
    textSubmission,
    linkSubmission,
    imageSubmission,
    subreddit,
    author,
    upvotedBy,
    downvotedBy,
    pointsCount,
    commentCount,
    createdAt,
    updatedAt,
  } = post;

  const classes = useCardStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("xs"));
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state);

  const isUpvoted = user && upvotedBy.includes(user.id);
  const isDownvoted = user && downvotedBy.includes(user.id);

  const handleUpvoteToggle = async (e) => {
    try {
      if (isUpvoted) {
        const updatedUpvotedBy = upvotedBy.filter((u) => u !== user.id);
        dispatch(toggleUpvote(id, updatedUpvotedBy, downvotedBy));
      } else {
        const updatedUpvotedBy = [...upvotedBy, user.id];
        const updatedDownvotedBy = downvotedBy.filter((d) => d !== user.id);
        dispatch(toggleUpvote(id, updatedUpvotedBy, updatedDownvotedBy));
      }
    } catch (err) {
      dispatch(notify(getErrorMsg(err), "error"));
    }
  };

  const handleDownvoteToggle = async (e) => {
    try {
      if (isDownvoted) {
        const updatedDownvotedBy = downvotedBy.filter((d) => d !== user.id);
        dispatch(toggleDownvote(id, updatedDownvotedBy, upvotedBy));
      } else {
        const updatedDownvotedBy = [...downvotedBy, user.id];
        const updatedUpvotedBy = upvotedBy.filter((u) => u !== user.id);
        dispatch(toggleDownvote(id, updatedDownvotedBy, updatedUpvotedBy));
      }
    } catch (err) {
      dispatch(notify(getErrorMsg(err), "error"));
    }
  };

  const history = useHistory();

  const handleCardClick = (e) => {
    history.push(`/comments/${id}`);
    e.stopPropagation();
  };

  return (
    <div onClick={handleCardClick} style={{ cursor: "pointer" }}>
      <Paper className={classes.root} variant="outlined">
        <div
          className={classes.votesWrapper}
          onClick={(e) => e.stopPropagation()}
        >
          <UpvoteButton
            user={user}
            body={post}
            handleUpvote={handleUpvoteToggle}
            size={isMobile ? "small" : "medium"}
          />
          <Typography
            variant="body1"
            style={{
              color: isUpvoted
                ? theme.palette.primary.main
                : isDownvoted
                ? theme.palette.secondary.main
                : theme.palette.text.primary,
              fontWeight: 600,
            }}
          >
            {pointsCount}
          </Typography>
          <DownvoteButton
            user={user}
            body={post}
            handleDownvote={handleDownvoteToggle}
            size={isMobile ? "small" : "medium"}
          />
        </div>
        <div className={classes.thumbnailWrapper}>
          {postType === "Text" ? (
            <RouterLink
              to={`/comments/${id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Paper elevation={0} square className={classes.thumbnail}>
                <MessageIcon
                  fontSize="inherit"
                  className={classes.thumbnailIcon}
                  style={{ color: "#787878" }}
                />
              </Paper>
            </RouterLink>
          ) : postType === "Link" ? (
            <a href={fixUrl(linkSubmission)} target="_noblank">
              <Paper elevation={0} square className={classes.thumbnail}>
                <LinkIcon
                  fontSize="inherit"
                  className={classes.thumbnailIcon}
                  style={{ color: "#787878" }}
                />
              </Paper>
            </a>
          ) : (
            <Paper elevation={0} square className={classes.thumbnail}>
              <CardMedia
                className={classes.thumbnail}
                image={getEditedThumbail(imageSubmission.imageLink)}
                title={title}
                component="a"
                href={imageSubmission.imageLink}
                target="_noblank"
              />
            </Paper>
          )}
        </div>
        <div className={classes.postInfoWrapper}>
          <Typography variant="h6" className={classes.title}>
            {title}{" "}
            <Typography
              variant="caption"
              color="primary"
              className={classes.url}
            >
              <Link
                href={
                  postType === "Link"
                    ? fixUrl(linkSubmission)
                    : postType === "Image"
                    ? imageSubmission.imageLink
                    : ""
                }
              >
                {postType === "Text" ? null : ""}
              </Link>
            </Typography>
          </Typography>
          <Typography variant="subtitle2">
            {subreddit ? (
              <Link
                onClick={(e) => {
                  e.stopPropagation();
                }}
                component={RouterLink}
                to={`/r/${subreddit.subredditName}`}
              >
                r/{subreddit.subredditName}
              </Link>
            ) : (
              <span>r/unknown</span>
            )}
            <Typography variant="caption" className={classes.userAndDate}>
              Posted by{" "}
              <Link
                component={RouterLink}
                to={`/u/${author.username}`}
                onClick={(e) => e.stopPropagation()}
              >
                u/{author.username}
              </Link>{" "}
              • <TimeAgo datetime={new Date(createdAt)} />
              {createdAt !== updatedAt && "*"}
            </Typography>
          </Typography>
          <div className={classes.bottomBtns}>
            <Button
              startIcon={<CommentIcon />}
              className={classes.commentsBtn}
              component={RouterLink}
              to={`/comments/${id}`}
              onClick={(e) => e.stopPropagation()}
              size={isMobile ? "small" : "medium"}
            >
              {commentCount} comments
            </Button>
            {user && user.id === author.id && (
              <EditDeleteMenu
                id={id}
                isMobile={isMobile}
                title={title}
                postType={postType}
                subreddit={subreddit}
                textSubmission={textSubmission}
                linkSubmission={linkSubmission}
              />
            )}
          </div>
        </div>
      </Paper>
    </div>
  );
};

export default PostCard;
