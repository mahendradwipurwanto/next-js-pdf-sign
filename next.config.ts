import type { NextConfig } from 'next';
import { NextConfigComplete } from 'next/dist/server/config-shared';

const nextConfig: NextConfig & Partial<NextConfigComplete> = {
    output: 'standalone', // Use 'standalone' instead of 'serverless' in Next.js 13+
    webpack: (config, { isServer }) => {
        if (isServer) {
            // Exclude 'canvas' and 'encoding' from the server bundle
            config.resolve.alias = {
                ...config.resolve.alias,
                canvas: false,
                encoding: false,
            };
        }
        return config;
    },
};

export default nextConfig;
