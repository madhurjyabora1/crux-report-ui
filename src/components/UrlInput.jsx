import React, { useState, useEffect } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import "./UrlInput.css";

const UrlInput = ({ onSearch, urls: propUrls, updateUrls }) => {
  const [urls, setUrls] = useState(propUrls || []);
  const [newUrl, setNewUrl] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [isBulkMode, setIsBulkMode] = useState(false);

  useEffect(() => {
    setUrls(propUrls || []);
  }, [propUrls]);

  useEffect(() => {
    if (isBulkMode) {
      setBulkUrls(newUrl);
    } else {
      if (bulkUrls) {
        const urlList = bulkUrls
          .split(/[,\n]/)
          .map((url) => url.trim())
          .filter((url) => url !== "");
        const newUrls = urlList.filter((url) => !urls.includes(url));
        setUrls([...urls, ...newUrls.slice(0, -1)]);
        setNewUrl(urlList[urlList.length - 1] || "");
        setBulkUrls("");
      }
    }
  }, [isBulkMode]);

  const handleAddUrl = () => {
    if (isBulkMode) {
      const urlList = bulkUrls
        .split(/[,\n]/)
        .map((url) => url.trim())
        .filter((url) => url !== "");
      const newUrls = urlList.filter((url) => !urls.includes(url));
      const updatedUrls = [...urls, ...newUrls];
      setUrls(updatedUrls);
      updateUrls(updatedUrls);
      setBulkUrls("");
    } else {
      if (newUrl.trim() !== "" && !urls.includes(newUrl.trim())) {
        const updatedUrls = [...urls, newUrl.trim()];
        setUrls(updatedUrls);
        updateUrls(updatedUrls);
        setNewUrl("");
      }
    }
  };

  const handleRemoveUrl = (index) => {
    const newUrls = [...urls];
    newUrls.splice(index, 1);
    setUrls(newUrls);
    updateUrls(newUrls);
  };

  const handleSearch = () => {
    onSearch(urls);
  };

  const handleToggleMode = () => {
    setIsBulkMode(!isBulkMode);
  };

  return (
    <div>
      <FormControlLabel
        control={<Switch checked={isBulkMode} onChange={handleToggleMode} />}
        label={isBulkMode ? "Bulk URL Input" : "Single URL Input"}
      />
      <div className="input-fields">
        {isBulkMode ? (
          <TextField
            label="Enter URLs (separated by commas or new lines)"
            variant="outlined"
            multiline
            rows={4}
            value={bulkUrls}
            onChange={(e) => setBulkUrls(e.target.value)}
            fullWidth
          />
        ) : (
          <TextField
            label="Enter a URL"
            variant="outlined"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            fullWidth
          />
        )}
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddUrl}
          className="add-btn"
        >
          Add URL{isBulkMode ? "s" : ""}
        </Button>
      </div>
      <div className="chips-container">
        {urls.map((url, index) => (
          <Chip
            key={index}
            label={url}
            onDelete={() => handleRemoveUrl(index)}
            style={{ margin: "4px" }}
          />
        ))}
      </div>
      <Button
        variant="contained"
        color="primary"
        onClick={handleSearch}
        className="search-button"
      >
        Search
      </Button>
    </div>
  );
};

export default UrlInput;
