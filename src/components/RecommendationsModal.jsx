import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

const RecommendationsModal = ({ open, onClose, recommendations }) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>Recommendations</DialogTitle>
    <DialogContent>
      {recommendations.length > 0 ? (
        recommendations.map((recommendation, index) => (
          <Typography key={index}>{recommendation}</Typography>
        ))
      ) : (
        <Typography>No recommendations found.</Typography>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

export default RecommendationsModal;
