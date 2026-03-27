import type { ParsedUrlQuery } from 'querystring';

export interface ParsedRequestUrl {
    protocol: string | null;
    hostname: string | null;
    pathname: string | null;
    query: ParsedUrlQuery;
    search: string | null;
    hash: string | null;
}

/** Dummy base used to let the WHATWG URL constructor handle relative paths. */
const DUMMY_BASE = 'http://0.0.0.0';

/**
 * Parse a request URL (typically a relative path like `/foo?a=1`) into its components.
 * Uses the WHATWG URL API internally; returns the same shape that the legacy
 * `url.parse(requestUrl, true)` produced for the fields consumed by HttpServer
 * and http-receiver handlers.
 */
export const parseRequestUrl = (requestUrl: string): ParsedRequestUrl => {
    const parsed = new URL(requestUrl, DUMMY_BASE);

    const isAbsolute = /^[a-z][a-z\d+\-.]*:\/\//i.test(requestUrl);

    const query: ParsedUrlQuery = {};
    for (const key of new Set(parsed.searchParams.keys())) {
        const values = parsed.searchParams.getAll(key);
        query[key] = values.length === 1 ? values[0] : values;
    }

    return {
        protocol: isAbsolute ? parsed.protocol : null,
        hostname: isAbsolute ? parsed.hostname : null,
        pathname: parsed.pathname,
        query,
        search: parsed.search || null,
        hash: parsed.hash || null,
    };
};

/**
 * Format a parsed request URL back into a URL string.
 * Counterpart to `parseRequestUrl`.
 */
export const formatRequestUrl = ({
    protocol,
    hostname,
    pathname,
    query,
}: Pick<ParsedRequestUrl, 'protocol' | 'hostname' | 'pathname' | 'query'>): string => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (Array.isArray(value)) {
            for (const v of value) {
                if (v !== undefined) params.append(key, v);
            }
        } else if (value !== undefined) {
            params.append(key, value);
        }
    }

    const qs = params.toString();
    const base =
        protocol && hostname ? `${protocol}//${hostname}${pathname || '/'}` : pathname || '/';

    return qs ? `${base}?${qs}` : base;
};
