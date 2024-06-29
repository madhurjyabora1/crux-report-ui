import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

const InsightsModal = ({ open, onClose, insights, formatValue }) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>Insights</DialogTitle>
    <DialogContent>
      {insights.length > 0 ? (
        insights.map((insight, index) => (
          <div key={index}>
            <Typography variant="h6">
              {insight.metric.replace(/_/g, " ")}
            </Typography>
            <Typography>
              Average: {formatValue(insight.average, insight.metric)}
            </Typography>
            <Typography>
              Best: {formatValue(insight.best, insight.metric)} (
              {insight.bestSite})
            </Typography>
            <Typography>
              Worst: {formatValue(insight.worst, insight.metric)} (
              {insight.worstSite})
            </Typography>
          </div>
        ))
      ) : (
        <Typography>No insights found.</Typography>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

export default InsightsModal;
