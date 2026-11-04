const axios = require("axios");

// Talks to the Face ID server. The API key stays on this server and never reaches the browser.
const faceClient = () => {
  const { FACE_API_URL, FACE_API_KEY } = process.env;

  if (!FACE_API_URL || !FACE_API_KEY) {
    const error = new Error("Face ID is not configured");
    error.statusCode = 503;
    throw error;
  }

  return axios.create({
    baseURL: FACE_API_URL,
    headers: { "X-API-Key": FACE_API_KEY },
    timeout: 8000,
  });
};

const unavailable = () => {
  const error = new Error("Face ID service is unavailable");
  error.statusCode = 502;
  return error;
};

// People are identified to the Face ID server by Yappa's user ID (never email).
const getFaceStatus = async ({ userId }) => {
  const client = faceClient();

  try {
    const res = await client.get("/api/integration/users/status", {
      params: { user_id: userId },
    });
    return { hasFace: res.data.has_face };
  } catch {
    throw unavailable();
  }
};

// One-time link to the Face ID scan page for this user (valid ~10 minutes).
const createFaceSetupLink = async ({ userId, name }) => {
  const client = faceClient();

  try {
    const res = await client.post("/api/integration/enroll-tokens", {
      user_id: userId,
      name,
    });
    return { url: res.data.url };
  } catch {
    throw unavailable();
  }
};

// Trades the one-time code the browser brought back from a face scan for the person's user ID.
const exchangeFaceLoginCode = async ({ code }) => {
  const client = faceClient();

  try {
    const res = await client.post("/api/integration/login-codes/exchange", {
      code,
    });
    return { userId: res.data.user_id };
  } catch (err) {
    const error = new Error("Face login failed or expired. Please try again.");
    error.statusCode = err.response?.status >= 500 || !err.response ? 502 : 401;
    throw error;
  }
};

module.exports = { getFaceStatus, createFaceSetupLink, exchangeFaceLoginCode };
