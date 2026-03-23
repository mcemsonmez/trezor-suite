// Compatibility layer providing the same API as tiny-secp256k1
// using @noble/curves/secp256k1 as the underlying implementation.
// This module replaces the `tiny-secp256k1` dependency with a pure-JS,
// independently audited alternative.

import { secp256k1 } from '@noble/curves/secp256k1.js';

const { Point } = secp256k1;

// secp256k1 curve order (n) as defined in SEC 2 v2, section 2.4.1
// https://www.secg.org/sec2-v2.pdf
const ORDER = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');

function bufToHex(buf: Buffer | Uint8Array): string {
    return Buffer.from(buf).toString('hex');
}

function hexToBuf(hex: string): Buffer {
    return Buffer.from(hex, 'hex');
}

function isPoint(p: Buffer | Uint8Array): boolean {
    try {
        Point.fromHex(bufToHex(p));

        return true;
    } catch {
        return false;
    }
}

function isPrivate(d: Buffer | Uint8Array): boolean {
    return secp256k1.utils.isValidSecretKey(d);
}

function pointFromScalar(d: Buffer | Uint8Array, compressed = true): Buffer {
    const pub = secp256k1.getPublicKey(d, compressed);

    return Buffer.from(pub);
}

// Computes P + tweak*G where G is the generator point.
// This matches the tiny-secp256k1 `pointAddScalar` API.
function pointAddScalar(
    p: Buffer | Uint8Array,
    tweak: Buffer | Uint8Array,
    compressed = true,
): Buffer | null {
    const tweakScalar = BigInt('0x' + bufToHex(tweak));
    if (tweakScalar === 0n) return Buffer.from(p);
    if (tweakScalar >= ORDER) return null;
    const point = Point.fromHex(bufToHex(p));
    const tweakPoint = Point.BASE.multiply(tweakScalar);
    const result = point.add(tweakPoint);

    return Buffer.from(result.toBytes(compressed));
}

function privateAdd(d: Buffer | Uint8Array, tweak: Buffer | Uint8Array): Buffer | null {
    const dBig = BigInt('0x' + bufToHex(d));
    const tweakBig = BigInt('0x' + bufToHex(tweak));
    const sum = (dBig + tweakBig) % ORDER;
    if (sum === 0n) return null;
    const hex = sum.toString(16).padStart(64, '0');

    return hexToBuf(hex);
}

function sign(hash: Buffer | Uint8Array, privateKey: Buffer | Uint8Array): Buffer {
    // prehash: false because the caller provides an already-hashed message.
    // Returns 64-byte compact signature (r || s).
    const sig = secp256k1.sign(hash, privateKey, { lowS: true, prehash: false });

    return Buffer.from(sig);
}

function signWithEntropy(
    hash: Buffer | Uint8Array,
    privateKey: Buffer | Uint8Array,
    extraEntropy: Buffer | Uint8Array,
): Buffer {
    const sig = secp256k1.sign(hash, privateKey, { lowS: true, prehash: false, extraEntropy });

    return Buffer.from(sig);
}

function verify(
    hash: Buffer | Uint8Array,
    publicKey: Buffer | Uint8Array,
    signature: Buffer | Uint8Array,
): boolean {
    return secp256k1.verify(signature, hash, publicKey, { prehash: false });
}

export {
    isPoint,
    isPrivate,
    pointFromScalar,
    pointAddScalar,
    privateAdd,
    sign,
    signWithEntropy,
    verify,
};
