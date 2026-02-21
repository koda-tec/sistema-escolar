import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: false,
});

const nextConfig: NextConfig = {
  // Esto silencia el error y confirma que usaremos Webpack para los plugins
  // @ts-ignore
  turbopack: {}, 
};

export default withPWA(nextConfig);