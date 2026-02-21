import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Añadimos esto para resolver el conflicto con Turbopack
  // ya que el plugin de PWA necesita Webpack para funcionar.
   turbopack: {}, 
};

export default withPWA(nextConfig);