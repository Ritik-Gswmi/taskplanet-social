import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardActions, Typography, IconButton, Avatar, TextField, Button, Box, Badge } from '@mui/material';
import { Favorite as FavoriteIcon, Comment as CommentIcon, Edit as EditIcon, Delete as DeleteIcon, Save as SaveIcon, Close as CloseIcon } from '@mui/icons-material';

const PostCard = ({ post, currentUserId, onLike, onComment, onEdit, onDelete }) => {
  const [commentText, setCommentText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text || '');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleComment = async () => {
    if (commentText.trim()) {
      await onComment(post._id, commentText.trim());
      setCommentText('');
    }
  };

  const owner = post.userId === currentUserId;

  const handleSave = async () => {
    if (!editText.trim()) return;
    await onEdit(post._id, editText.trim());
    setIsEditing(false);
  };

  return (
    <Card sx={{ mb: 2, borderRadius: 3, maxWidth: '100%', overflow: 'hidden' }}>
      <CardHeader
        avatar={<Avatar sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>{post.username.charAt(0).toUpperCase()}</Avatar>}
        title={<Typography sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{post.username}</Typography>}
        subheader={<Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{new Date(post.createdAt).toLocaleString()}</Typography>}
      />
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, pb: { xs: 1, sm: 1.5 } }}>
        {isEditing ? (
          <Box display="flex" flexDirection="column" gap={1}>
            <TextField
              multiline
              minRows={2}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              fullWidth
            />
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button size="small" variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>Save</Button>
              <Button size="small" variant="outlined" startIcon={<CloseIcon />} onClick={() => { setIsEditing(false); setEditText(post.text || ''); }}>Cancel</Button>
            </Box>
          </Box>
        ) : (
          <>
            {post.text && <Typography variant="body1" gutterBottom sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{post.text}</Typography>}
            {post.image && <Box component="img" src={post.image} alt="post" sx={{ display: 'block', width: '100%', maxHeight: 400, objectFit: 'contain', objectPosition: 'center', borderRadius: 2, mt: 1 }} className="post-image" />}
          </>
        )}
        <Typography variant="caption" display="block" mt={1} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>{post.likes.length} likes • {post.comments.length} comments</Typography>
      </CardContent>
      <CardActions disableSpacing sx={{ flexWrap: 'wrap', p: { xs: 1, sm: 1.5 }, pt: 0 }}>
        <IconButton
          onClick={() => onLike(post._id)}
          size="small"
          sx={{ color: post.liked ? 'error.main' : 'text.secondary' }}
        >
          <Badge badgeContent={post.likes.length} color="error">
            <FavoriteIcon fontSize="small" sx={{ color: post.liked ? 'error.main' : 'inherit' }} />
          </Badge>
        </IconButton>
        <IconButton
          disabled
          size="small"
          sx={{
            color: 'primary.main',
            '&.Mui-disabled': { color: 'primary.main', opacity: 1 }
          }}
        >
          <Badge badgeContent={post.comments.length} color="primary">
            <CommentIcon fontSize="small" sx={{ color: 'primary.main' }} />
          </Badge>
        </IconButton>
        {owner && !isEditing && !confirmingDelete && (
          <>
            <IconButton onClick={() => setIsEditing(true)} size="small">
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton onClick={() => setConfirmingDelete(true)} size="small">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </>
        )}

        {owner && confirmingDelete && (
          <Box display="flex" gap={1} width="100%" flexWrap="wrap">
            <Button size="small" color="error" variant="contained" onClick={() => onDelete(post._id)}>
              Confirm Delete
            </Button>
            <Button size="small" variant="outlined" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
          </Box>
        )}
      </CardActions>
      {!isEditing && (
      <CardContent>
        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            size="small"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <Button variant="contained" onClick={handleComment}>Send</Button>
        </Box>

        {post.comments.length > 0 && (
          <Box mt={2}>
            {post.comments.slice(-3).map((comment, idx) => (
              <Typography key={`${idx}-${comment.text}`} variant="body2"><strong>{comment.username}</strong>: {comment.text}</Typography>
            ))}
          </Box>
        )}
      </CardContent>
      )}
    </Card>
  );
};

export default PostCard;
