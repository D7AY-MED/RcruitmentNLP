import type { NextConfig } from "next";
import { config } from "dotenv";
import path from "path";

// Load shared root .env so frontend and backend use the same variables.
config({ path: path.resolve(__dirname, "..", ".env") });

const nextConfig: NextConfig = {};

export default nextConfig;
