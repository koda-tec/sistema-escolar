import type { NextConfig } from "next";
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  swSrc: "src/worker/index.ts", // Tu lógica de Push está acá
});

const nextConfig: NextConfig = {
  // Tus otras configuraciones de Next aquí
};

export default withPWA(nextConfig);
