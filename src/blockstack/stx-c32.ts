// https://en.wikipedia.org/wiki/Base32#Crockford's_Base32

const C32_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function c32encode(data: Buffer): string {
  const length = data.byteLength;
  const view = new Uint8Array(data.buffer);

  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < length; i++) {
    value = (value << 8) | view[i]!;
    bits += 8;

    while (bits >= 5) {
      output += C32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += C32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function readChar(alphabet: string, char: string): number {
  const idx = alphabet.indexOf(char);

  if (idx === -1) {
    throw new Error('Invalid character found: ' + char);
  }

  return idx;
}

function c32normalize(c32input: string): string {
  // must be upper-case
  // replace all O's with 0's
  // replace all I's and L's with 1's
  return c32input.toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1');
}

export function c32decode(data: string): Buffer {
  const stxAddr = c32normalize(data);

  // must result in a c32 string
  if (!stxAddr.match(`^[${C32_ALPHABET}]*$`)) {
    throw new Error('Not a c32-encoded string');
  }

  if (stxAddr.length <= 5) {
    throw new Error('Invalid c32 address: invalid length');
  }

  if (stxAddr[0] != 'S') {
    throw new Error('Invalid c32 address: must start with "S"');
  }

  let bits = 0;
  let value = 0;

  let index = 0;
  const output = new Uint8Array(((stxAddr.length * 5) / 8) | 0);

  for (let i = 0; i < stxAddr.length; i++) {
    value = (value << 5) | readChar(C32_ALPHABET, stxAddr[i]!);
    bits += 5;

    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }

  return Buffer.from(output.buffer);
}
