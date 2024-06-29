import axios from "axios";

async function fetchCruxReport(url) {
  try {
    const response = await axios.post("http://localhost:3001/api/crux-report", {
      url,
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}

export { fetchCruxReport };
