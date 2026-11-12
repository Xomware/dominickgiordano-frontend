// 5x7 LED font: seven rows per glyph, two hex digits per row, low five bits read left to right.
const FONT: Record<string, string> = {
  A: '0e11111f111111', B: '1e11111e11111e', C: '0e11101010110e', D: '1c12111111121c', E: '1f10101e10101f',
  F: '1f10101e101010', G: '0e11101711110f', H: '1111111f111111', I: '0e04040404040e', J: '0702020202120c',
  K: '11121418141211', L: '1010101010101f', M: '111b1515111111', N: '11111915131111', O: '0e11111111110e',
  P: '1e11111e101010', Q: '0e11111115120d', R: '1e11111e141211', S: '0f10100e01011e', T: '1f040404040404',
  U: '1111111111110e', V: '11111111110a04', W: '1111111515150a', X: '11110a040a1111', Y: '11110a04040404',
  Z: '1f01020408101f', '0': '0e11131519110e', '1': '040c040404040e', '2': '0e11010204081f', '3': '1f02040201110e',
  '4': '02060a121f0202', '5': '1f101e0101110e', '6': '0608101e11110e', '7': '1f010204080808', '8': '0e11110e11110e',
  '9': '0e11110f01020c', ' ': '00000000000000', '.': '00000000000c0c', '·': '0000000c0c0000', '+': '0004041f040400',
  '-': '0000001f000000', "'": '0c040800000000',
};

/** Column bitmasks for `text`: one number per dot column, bit r set when row r is lit, one blank column per glyph. */
export function bitmap(text: string): number[] {
  const cols: number[] = [];
  for (const ch of text.toUpperCase()) {
    const g = FONT[ch] ?? FONT[' '];
    for (let c = 0; c < 5; c++) {
      let m = 0;
      for (let r = 0; r < 7; r++) if ((parseInt(g.slice(r * 2, r * 2 + 2), 16) >> (4 - c)) & 1) m |= 1 << r;
      cols.push(m);
    }
    cols.push(0);
  }
  return cols;
}
