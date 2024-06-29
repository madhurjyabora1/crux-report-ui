import axios from "axios";

async function fetchCruxReport(url) {
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_URL}/api/crux-report`,
      {
        url,
      }
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}

export { fetchCruxReport };
