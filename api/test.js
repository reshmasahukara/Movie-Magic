/**
 * API Health Check / Test Endpoint
 * This helps verify that the Vercel Serverless environment is responding.
 */
export default function handler(req, res) {
  try {
    res.status(200).json({
      status: "success",
      message: "API working correctly",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
