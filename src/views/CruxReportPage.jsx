import React, { useState } from "react";
import UrlInput from "../components/UrlInput";
import DataDisplay from "../components/DataDisplay";
import { fetchCruxReport } from "../utils/api";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";

const CruxReportPage = () => {
  const [cruxReportData, setCruxReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [urls, setUrls] = useState([]);

  const handleSearch = async (searchUrls) => {
    setLoading(true);
    setError(false);
    try {
      const promises = searchUrls.map(async (url) => {
        return fetchCruxReport(url)
          .then((data) => ({ url, data }))
          .catch((error) => ({ url, error }));
      });
      const results = await Promise.all(promises);

      const successfulResults = results.filter((result) => !result.error);
      const failedResults = results.filter((result) => result.error);

      const cruxReportData = successfulResults.reduce((acc, { url, data }) => {
        acc[url] = data;
        return acc;
      }, {});

      if (failedResults.length > 0) {
        const failedUrls = failedResults.map((result) => result.url);
        setErrorMessage(
          `Error fetching data for the following URL(s): ${failedUrls.join(
            ", "
          )}. Please try again.`
        );
        setError(true);

        const successfulUrls = successfulResults.map((result) => result.url);
        setUrls(successfulUrls);
      }
      setCruxReportData(cruxReportData);
    } catch (error) {
      setErrorMessage("Unexpected error. Please try again.");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setError(false);
  };

  const updateUrls = (newUrls) => {
    setUrls(newUrls);
  };

  return (
    <div>
      <UrlInput onSearch={handleSearch} urls={urls} updateUrls={updateUrls} />
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "20px",
          }}
        >
          <CircularProgress />
        </div>
      ) : (
        cruxReportData && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={12}>
              <DataDisplay data={cruxReportData} />
            </Grid>
          </Grid>
        )
      )}
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="error"
          sx={{ width: "100%" }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CruxReportPage;
