import axios from "axios";

const API = axios.create({
  baseURL: "https://multi-rice.onrender.com",
  withCredentials: true   // ✅ THIS LINE
});

export default API;