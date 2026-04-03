// Node.js 22 ships a built-in `globalThis.WebSocket` backed by undici, which bypasses all
// `https.request` / `net.connect` monkey-patching and therefore ignores the SOCKS proxy used for
// Tor.
// This interceptor replaces `globalThis.WebSocket` with a factory that, when Tor is active,
// constructs a `ws` npm WebSocket with a SocksProxyAgent so the connection is tunnelled through
// Tor.
import WebSocketNode from 'ws';

import { type Interceptor } from './interceptorTypes';

export const interceptWebSocket: Interceptor = ({ context, validateRequest }) => {
    const OriginalWebSocket = globalThis.WebSocket;

    // Must be a regular function (not an arrow function): when a constructor explicitly returns an
    // object, `new` uses that returned object instead of `this`.
    globalThis.WebSocket = function (url: string | URL, protocols?: string | string[]) {
        const urlString = url.toString();
        const { hostname } = new URL(urlString);

        validateRequest({ hostname });

        if (context.getTorSettings().running) {
            const agent = context.torIdentities.getIdentity(
                `WebSocket/${hostname}`,
                undefined,
                'https',
            );

            return new WebSocketNode(urlString, protocols, { agent });
        }

        return new OriginalWebSocket(url, protocols as string);
    } as unknown as typeof globalThis.WebSocket;
};
