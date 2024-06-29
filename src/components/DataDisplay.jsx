import React, { useState, useEffect, useMemo } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Button from "@mui/material/Button";
import InsightsModal from "./InsightsModal";
import RecommendationsModal from "./RecommendationsModal";
import jsPDF from "jspdf";
import "jspdf-autotable";

import "./DataDisplay.css";

const DataDisplay = ({ data }) => {
  const [filterValue, setFilterValue] = useState("");
  const [orderBy, setOrderBy] = useState("");
  const [order, setOrder] = useState("asc");
  const [selectedColumns, setSelectedColumns] = useState(() => {
    const initialWebsites = {};
    Object.keys(data).forEach((_, index) => {
      initialWebsites[`website_${index}`] = true;
    });
    return {
      metric: true,
      websites: initialWebsites,
      average: true,
      sum: true,
    };
  });
  const [openInsights, setOpenInsights] = useState(false);
  const [insights, setInsights] = useState([]);
  const [openRecommendations, setOpenRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  const getMetrics = (websiteData) => {
    const metrics = [];
    Object.entries(websiteData).forEach(([metricName, metricData]) => {
      if (metricData.percentiles && metricData.percentiles.p75 !== undefined) {
        metrics.push({
          metric: metricName,
          value: metricData.percentiles.p75,
        });
      }
    });
    return metrics;
  };

  const websitesData = useMemo(() => {
    return Object.entries(data).map(([url, websiteData]) => ({
      url,
      metrics: getMetrics(websiteData),
    }));
  }, [data]);

  const allMetrics = useMemo(() => {
    return websitesData.flatMap((site) => site.metrics.map((m) => m.metric));
  }, [websitesData]);

  const uniqueMetrics = useMemo(() => {
    return [...new Set(allMetrics)];
  }, [allMetrics]);

  useEffect(() => {
    const initialWebsites = {};
    websitesData.forEach((site, index) => {
      initialWebsites[`website_${index}`] = true;
    });
    setSelectedColumns((prev) => ({ ...prev, websites: initialWebsites }));
  }, [websitesData]);

  const calculateSummary = () => {
    const summary = {};
    uniqueMetrics.forEach((metric) => {
      const values = websitesData
        .map((site) => site.metrics.find((m) => m.metric === metric)?.value)
        .filter(
          (value) =>
            value !== undefined && value !== null && !isNaN(parseFloat(value))
        );

      if (values.length > 0) {
        const sum = values.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
        const average = sum / values.length;
        summary[metric] = { sum, average };
      }
    });
    return summary;
  };

  const summary = useMemo(calculateSummary, [uniqueMetrics, websitesData]);

  const formatValue = (value, metric) => {
    if (value === undefined || value === null) return "N/A";
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return "N/A";

    if (metric === "cumulative_layout_shift") {
      return numValue.toFixed(4);
    } else {
      return numValue.toFixed(2);
    }
  };

  const filterData = (metric, filterValue) => {
    if (!filterValue) return true;
    const lowerFilter = filterValue.toLowerCase();

    if (metric.toLowerCase().includes(lowerFilter)) return true;

    const websiteMatch = websitesData.some((site) => {
      return site.url.toLowerCase().includes(lowerFilter);
    });
    if (websiteMatch) return true;

    const websiteDataMatch = websitesData.some((site) => {
      const metricData = site.metrics.find((m) => m.metric === metric);
      return (
        metricData &&
        formatValue(metricData.value, metric).includes(lowerFilter)
      );
    });
    if (websiteDataMatch) return true;

    const summaryData = summary[metric];
    if (summaryData) {
      if (formatValue(summaryData.average, metric).includes(lowerFilter))
        return true;
      if (formatValue(summaryData.sum, metric).includes(lowerFilter))
        return true;
    }

    return false;
  };

  const filteredMetrics = uniqueMetrics.filter((metric) =>
    filterData(metric, filterValue)
  );

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedMetrics = filteredMetrics.sort((a, b) => {
    if (orderBy === "metric") {
      return order === "asc" ? a.localeCompare(b) : b.localeCompare(a);
    }
    if (orderBy === "average" || orderBy === "sum") {
      const aValue = summary[a]?.[orderBy] || 0;
      const bValue = summary[b]?.[orderBy] || 0;
      return order === "asc" ? aValue - bValue : bValue - aValue;
    }
    if (orderBy.startsWith("website_")) {
      const websiteIndex = parseInt(orderBy.split("_")[1]);
      const aValue =
        websitesData[websiteIndex].metrics.find((m) => m.metric === a)?.value ||
        0;
      const bValue =
        websitesData[websiteIndex].metrics.find((m) => m.metric === b)?.value ||
        0;
      return order === "asc" ? aValue - bValue : bValue - aValue;
    }
    return 0;
  });

  const handleColumnChange = (column) => {
    setSelectedColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const handleWebsiteColumnChange = (websiteIndex) => {
    setSelectedColumns((prev) => ({
      ...prev,
      websites: {
        ...prev.websites,
        [`website_${websiteIndex}`]: !prev.websites[`website_${websiteIndex}`],
      },
    }));
  };

  const generateInsights = () => {
    const newInsights = [];
    uniqueMetrics.forEach((metric) => {
      const values = websitesData
        .map((site) => {
          const metricData = site.metrics.find((m) => m.metric === metric);
          return metricData ? parseFloat(metricData.value) : null;
        })
        .filter((value) => value !== null);

      if (values.length > 0) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const best = Math.min(...values);
        const worst = Math.max(...values);
        const bestSite = websitesData.find((site) =>
          site.metrics.find(
            (m) => m.metric === metric && parseFloat(m.value) === best
          )
        )?.url;
        const worstSite = websitesData.find((site) =>
          site.metrics.find(
            (m) => m.metric === metric && parseFloat(m.value) === worst
          )
        )?.url;

        newInsights.push({
          metric,
          average: avg,
          best,
          worst,
          bestSite,
          worstSite,
        });
      }
    });

    setInsights(newInsights);
    setOpenInsights(true);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.text("Data Report", 14, 15);

    const tableData = sortedMetrics.map((metric) => {
      const row = [metric];
      websitesData.forEach((site, index) => {
        if (selectedColumns.websites[`website_${index}`]) {
          row.push(
            formatValue(
              site.metrics.find((m) => m.metric === metric)?.value,
              metric
            )
          );
        }
      });
      if (selectedColumns.average) {
        row.push(formatValue(summary[metric]?.average, metric));
      }
      if (selectedColumns.sum) {
        row.push(formatValue(summary[metric]?.sum, metric));
      }
      return row;
    });

    const headers = ["Metric"];
    websitesData.forEach((site, index) => {
      if (selectedColumns.websites[`website_${index}`]) {
        headers.push(site.url);
      }
    });
    if (selectedColumns.average) headers.push("Average");
    if (selectedColumns.sum) headers.push("Sum");

    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8, cellPadding: 1 },
      columnStyles: { 0: { cellWidth: 40 } },
    });

    doc.save("data_report.pdf");
  };

  const generateRecommendations = () => {
    const newRecommendations = [];
    uniqueMetrics.forEach((metric) => {
      const values = websitesData
        .map((site) => {
          const metricData = site.metrics.find((m) => m.metric === metric);
          return metricData ? parseFloat(metricData.value) : null;
        })
        .filter((value) => value !== null);

      if (values.length > 0) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        websitesData.forEach((site) => {
          const metricValue = parseFloat(
            site.metrics.find((m) => m.metric === metric)?.value
          );
          if (metricValue > avg * 1.2) {
            newRecommendations.push(
              `${site.url} should improve its ${metric.replace(
                /_/g,
                " "
              )}. Current value: ${formatValue(
                metricValue,
                metric
              )}, Average: ${formatValue(avg, metric)}`
            );
          }
        });
      }
    });

    setRecommendations(newRecommendations);
    setOpenRecommendations(true);
  };

  const handleCloseInsights = () => {
    setOpenInsights(false);
  };

  const handleCloseRecommendations = () => {
    setOpenRecommendations(false);
  };

  return (
    <div className="data-display-container">
      <TextField
        label="Filter"
        variant="outlined"
        value={filterValue}
        onChange={(e) => setFilterValue(e.target.value)}
        className="filter-input"
      />
      <FormGroup row>
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedColumns.metric}
              onChange={() => handleColumnChange("metric")}
            />
          }
          label="Metric"
        />
        {websitesData.map((site, index) => (
          <FormControlLabel
            key={index}
            control={
              <Checkbox
                checked={selectedColumns.websites[`website_${index}`]}
                onChange={() => handleWebsiteColumnChange(index)}
              />
            }
            label={site.url}
          />
        ))}
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedColumns.average}
              onChange={() => handleColumnChange("average")}
            />
          }
          label="Average"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedColumns.sum}
              onChange={() => handleColumnChange("sum")}
            />
          }
          label="Sum"
        />
      </FormGroup>
      <TableContainer component={Paper} className="table-container">
        <Table className="data-table">
          <TableHead>
            <TableRow>
              {selectedColumns.metric && (
                <TableCell className="header-cell">
                  <TableSortLabel
                    active={orderBy === "metric"}
                    direction={orderBy === "metric" ? order : "asc"}
                    onClick={() => handleSort("metric")}
                  >
                    Metric
                  </TableSortLabel>
                </TableCell>
              )}
              {websitesData.map(
                (site, index) =>
                  selectedColumns.websites[`website_${index}`] && (
                    <TableCell key={index} className="header-cell">
                      <TableSortLabel
                        active={orderBy === `website_${index}`}
                        direction={
                          orderBy === `website_${index}` ? order : "asc"
                        }
                        onClick={() => handleSort(`website_${index}`)}
                      >
                        {site.url}
                      </TableSortLabel>
                    </TableCell>
                  )
              )}
              {selectedColumns.average && (
                <TableCell className="header-cell">
                  <TableSortLabel
                    active={orderBy === "average"}
                    direction={orderBy === "average" ? order : "asc"}
                    onClick={() => handleSort("average")}
                  >
                    Average
                  </TableSortLabel>
                </TableCell>
              )}
              {selectedColumns.sum && (
                <TableCell className="header-cell">
                  <TableSortLabel
                    active={orderBy === "sum"}
                    direction={orderBy === "sum" ? order : "asc"}
                    onClick={() => handleSort("sum")}
                  >
                    Sum
                  </TableSortLabel>
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedMetrics.map((metric, index) => (
              <TableRow
                key={index}
                className={index % 2 === 0 ? "even-row" : "odd-row"}
              >
                {selectedColumns.metric && (
                  <TableCell className="metric-cell">{metric}</TableCell>
                )}
                {websitesData.map(
                  (site, siteIndex) =>
                    selectedColumns.websites[`website_${siteIndex}`] && (
                      <TableCell key={siteIndex} className="value-cell">
                        {formatValue(
                          site.metrics.find((m) => m.metric === metric)?.value,
                          metric
                        )}
                      </TableCell>
                    )
                )}
                {selectedColumns.average && (
                  <TableCell className="summary-cell">
                    {formatValue(summary[metric]?.average, metric)}
                  </TableCell>
                )}
                {selectedColumns.sum && (
                  <TableCell className="summary-cell">
                    {formatValue(summary[metric]?.sum, metric)}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <div className="button-container">
        <Button
          variant="contained"
          color="primary"
          onClick={generateInsights}
          className="insight-button"
        >
          Generate Insights
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={generateRecommendations}
          className="recommendation-button"
        >
          Generate Recommendations
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={exportToPDF}
          className="export-button"
        >
          Export to PDF
        </Button>
      </div>

      <InsightsModal
        open={openInsights}
        onClose={handleCloseInsights}
        insights={insights}
        formatValue={formatValue}
      />
      <RecommendationsModal
        open={openRecommendations}
        onClose={handleCloseRecommendations}
        recommendations={recommendations}
      />
    </div>
  );
};

export default DataDisplay;
