import type { NextConfig } from "next";

export function normalizeBackendRewriteBase(value: string): string {
  return value
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");
}

/**
 * F1 site map: old marketing URLs move permanently (308) to the Turkish pages.
 * Destinations must stay in sync with src/lib/marketing/routes.ts (tested).
 */
export const LEGACY_MARKETING_REDIRECTS = [
  { source: "/modules", destination: "/moduller" },
  { source: "/architecture", destination: "/nasil-calisir" },
  { source: "/manifesto", destination: "/nasil-calisir" },
  { source: "/features", destination: "/" },
  { source: "/pricing", destination: "/erken-erisim" },
] as const;

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // strict mode enabled
    ignoreBuildErrors: false,
  },
  eslint: {
    // Temporarily disabled due to monorepo eslint-config-next resolution issues
    ignoreDuringBuilds: true,
  },

  // Optimize for Docker deployment
  output: "standalone",

  // Transpile Tiptap packages from node_modules
  transpilePackages: [
    "@tiptap/core",
    "@tiptap/react",
    "@tiptap/starter-kit",
    "@tiptap/extension-mention",
    "@tiptap/suggestion",
    "@tiptap/pm",
  ],

  // Webpack configuration to handle Genkit/Handlebars issues and Tiptap sub-path exports
  webpack: (config, { isServer }) => {
    // Handle handlebars require.extensions issue
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };

    // Ignore handlebars require.extensions warnings
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/handlebars/,
        message: /require\.extensions/,
      },
    ];

    // Keep package export resolution intact. Mapping only @tiptap/pm to
    // require.resolve() mixes CommonJS and ESM ProseMirror plugin registries.

    // Force webpack to fully resolve all Tiptap packages
    config.resolve.extensions = [
      ...config.resolve.extensions,
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
    ];

    // External modules for server-side rendering
    if (isServer) {
      config.externals = [...(config.externals || []), "handlebars"];
    }

    return config;
  },
  // Enable compression and optimization
  compress: true, // Enable gzip compression (default in production)
  poweredByHeader: false, // Remove X-Powered-By header for security

  // Optimize production builds
  productionBrowserSourceMaps: false, // Disable source maps in production

  async redirects() {
    return LEGACY_MARKETING_REDIRECTS.map((redirect) => ({
      ...redirect,
      permanent: true,
    }));
  },

  // API rewrites for backend proxy
  // BACKEND_URL env ile override edilebilir (Docker/Coolify uyumluluğu).
  // Öncelik: BACKEND_URL > NEXT_PUBLIC_API_URL > localhost fallback
  async rewrites() {
    const configuredBackendUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") ||
      "http://localhost:9006";
    const backendUrl = normalizeBackendRewriteBase(configuredBackendUrl);
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },

  // HTTP headers for optimization
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: "/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // API responses may contain credentials, private tickets or survey tokens.
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store",
          },
        ],
      },
    ];
  },
  images: {
    // Enable modern image formats
    formats: ["image/avif", "image/webp"],

    // Image optimization settings
    minimumCacheTTL: 60, // Cache images for 60 seconds minimum

    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

    // Image sizes for different use cases
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Allowed remote image patterns
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "aluplan.com.tr",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "aluplan.com.tr",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "**.localhost",
        port: "9006",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9006",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "9006",
        pathname: "/**",
      },
      // Wildcard for any domain (supports dynamic domain from settings)
      {
        protocol: "https",
        hostname: "**",
        pathname: "/api/media/**",
      },
      {
        protocol: "http",
        hostname: "**",
        pathname: "/api/media/**",
      },
    ],
  },
};

// Conditionally apply bundle analyzer only in development/analysis mode
// This prevents requiring @next/bundle-analyzer in production
let exportConfig = nextConfig;

if (process.env.ANALYZE === "true") {
  try {
    const withBundleAnalyzer = require("@next/bundle-analyzer");
    const bundleAnalyzer = withBundleAnalyzer({
      enabled: true,
    });
    exportConfig = bundleAnalyzer(nextConfig);
  } catch (error) {
    console.warn("Bundle analyzer not available, skipping...");
  }
}

export default exportConfig;
