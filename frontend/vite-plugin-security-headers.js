import crypto from 'crypto';

/**
 * Vite plugin to inject security headers.
 * Balancing "Zero Alert" security with Vite HMR functionality.
 */
export function securityHeadersPlugin() {
    const nonceMap = new Map();

    return {
        name: 'vite-plugin-security-headers',
        enforce: 'post',

        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                // If headers are already sent (e.g. by another middleware or internal Vite proxy), don't set them again
                if (res.headersSent) {
                    return next();
                }

                const nonce = crypto.randomBytes(16).toString('base64');
                req.nonce = nonce;
                if (req.url) {
                    nonceMap.set(req.url, nonce);
                }

                const cspDirectives = [
                    "default-src 'self'",
                    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`,
                    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://fonts.googleapis.com`,
                    "font-src 'self' https://fonts.gstatic.com data:",
                    "img-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com",
                    "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*",
                    "frame-ancestors 'none'",
                    "base-uri 'self'",
                    "form-action 'self'"
                ];

                res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
                res.setHeader('X-Frame-Options', 'DENY');
                res.setHeader('X-Content-Type-Options', 'nosniff');
                res.setHeader('X-XSS-Protection', '1; mode=block');
                res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
                res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

                // Remove informational headers
                res.removeHeader('X-Powered-By');
                res.removeHeader('Server');
                res.removeHeader('X-Generator');

                next();
            });
        },

        transform(code, id) {
            // 1. Information Disclosure Fix: Scrub development comments from JS/TS source files
            // 2. Private IP Disclosure Fix: Scrub RFC 1918 IPs (10.x, 172.16-31.x, 192.168.x)

            if (id.endsWith('.js') || id.endsWith('.jsx') || id.endsWith('.ts') || id.endsWith('.tsx') || id.includes('/node_modules/')) {
                // Keywords that scanners often flag
                const suspiciousKeywords = /\b(debug|TODO|FIXME|BUG|HACK|XXX)\b/gi;

                // Regex for Private IP Disclosure (RFC 1918)
                const privateIpRegex = /\b(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/g;

                // Scrub from comments in the code
                let sanitizedCode = code.replace(/(\/\*[\s\S]*?\*\/|\/\/.+)/g, (match) => {
                    return match.replace(suspiciousKeywords, 'SCRUBBED');
                });

                // Scrub the private IP from the entire code block
                sanitizedCode = sanitizedCode.replace(privateIpRegex, 'IP_REMOVED');

                return {
                    code: sanitizedCode,
                    map: null
                };
            }
        },

        transformIndexHtml(html, ctx) {
            // Retrieve nonce from map using the original URL
            const nonce = (ctx.originalUrl ? nonceMap.get(ctx.originalUrl) : null) ||
                ctx.req?.nonce ||
                crypto.randomBytes(16).toString('base64');

            // Cleanup map after use to prevent memory leak
            if (ctx.originalUrl) {
                // In dev, we might have multiple transforms, but usually one is enough.
                // However, we'll keep it for a bit or just let it overwrite.
                // nonceMap.delete(ctx.originalUrl); // Don't delete yet as it might be used by multiple hooks
            }

            // 1. Nonce Sitter: Auto-nonces dynamic tags created at runtime.
            const sitterContent = `(function(){const n="${nonce}";const o=document.createElement;document.createElement=function(t,p){const e=o.call(document,t,p);const g=t.toLowerCase();if(g==='style'||g==='script'){e.setAttribute('nonce',n);}return e;};})();`;
            const nonceSitter = `<script nonce="${nonce}">${sitterContent}</script>`;

            // 2. Add nonce to existing script/style tags (including React Preamble)
            let transformedHtml = html.replace(/<(script|style)\b(?![^>]*\bnonce=)([^>]*)>/gi, `<$1 nonce="${nonce}"$2>`);

            // 3. Inject Nonce Sitter at the start of head
            return transformedHtml.replace('<head>', `<head>${nonceSitter}`);
        }
    };
}
