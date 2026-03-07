import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api",
  timeout: 15000,
});

export async function getBorrowReport(params = {}) {
  const response = await apiClient.get("/reports/borrow", { params });
  return response.data;
}

export async function getTopEquipmentReport(params = {}) {
  const response = await apiClient.get("/reports/top-equipment", { params });
  return response.data;
}

export default apiClient;

