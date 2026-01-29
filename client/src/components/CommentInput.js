import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useDispatch } from "react-redux";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { addComment } from "../reducers/postCommentsReducer";
import { notify } from "../reducers/notificationReducer";
import getErrorMsg from "../utils/getErrorMsg";

import { Link, Typography, Button, Box, Paper } from "@material-ui/core";
import { useCommentInputStyles } from "../styles/muiStyles";
import SendIcon from "@material-ui/icons/Send";

const CommentInput = ({ user, postId, isMobile }) => {
  const classes = useCommentInputStyles();
  const dispatch = useDispatch();
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike", "code"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      ["blockquote", "code-block"],
      ["link"],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "code",
    "list",
    "bullet",
    "indent",
    "blockquote",
    "code-block",
    "link",
  ];
  const handlePostComment = async (e) => {
    e.preventDefault();
    try {
      // Strip HTML tags to check if comment is empty
      const plainText = comment.replace(/<[^>]*>/g, "").trim();
      if (!plainText) {
        dispatch(notify("Comment cannot be empty", "error"));
        return;
      }
      setSubmitting(true);
      await dispatch(addComment(postId, comment));
      setSubmitting(false);
      setComment("");
      dispatch(notify(`Comment submitted!`, "success"));
    } catch (err) {
      setSubmitting(false);
      dispatch(notify(getErrorMsg(err), "error"));
    }
  };

  return (
    <div className={classes.wrapper}>
      {user ?
        <Typography variant="body2">
          Comment as{" "}
          <Link component={RouterLink} to={`/u/${user.username}`}>
            {user.username}
          </Link>
        </Typography>
      : <Typography variant="body1">
          Log in or sign up to leave a comment
        </Typography>
      }
      <form className={classes.form} onSubmit={handlePostComment}>
        <Paper
          variant="outlined"
          style={{ marginTop: "12px", marginBottom: "12px" }}
        >
          <ReactQuill
            theme="snow"
            value={comment}
            onChange={setComment}
            modules={modules}
            formats={formats}
            placeholder="What are your thoughts? (Supports formatting, links, and code blocks)"
            readOnly={!user || submitting}
            style={{
              minHeight: isMobile ? "150px" : "200px",
              backgroundColor: !user || submitting ? "#f5f5f5" : "black",
            }}
          />
        </Paper>
        <Button
          type="submit"
          color="primary"
          variant="contained"
          className={classes.commentBtn}
          startIcon={<SendIcon />}
          size={isMobile ? "small" : "medium"}
          disabled={!user || submitting}
        >
          {!user ?
            "Login to comment"
          : submitting ?
            "Commenting"
          : "Comment"}
        </Button>
      </form>
    </div>
  );
};

export default CommentInput;
