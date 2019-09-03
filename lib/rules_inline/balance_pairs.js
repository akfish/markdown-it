// For each opening emphasis-like marker find a matching closing one
//
'use strict';


function processDelimiters(state, delimiters) {
  var i, j, lastDelim, currDelim, minJ, newMinJ, lastJump,
      openersBottom = {},
      max = delimiters.length;

  for (i = 0; i < max; i++) {
    lastDelim = delimiters[i];

    // length is only used for emphasis-specific "rule of 3",
    // if it's not defined, we can default it to 0 to disable those checks
    lastDelim.length = lastDelim.length || 0;

    if (!lastDelim.close) { continue; }

    if (!openersBottom.hasOwnProperty(lastDelim.marker)) {
      openersBottom[lastDelim.marker] = [ -1, -1, -1 ];
    }

    minJ = openersBottom[lastDelim.marker][lastDelim.length % 3];
    newMinJ = -1;

    j = i - lastDelim.jump - 1;

    for (; j > minJ; j -= currDelim.jump + 1) {
      currDelim = delimiters[j];

      if (currDelim.marker !== lastDelim.marker) continue;

      if (newMinJ === -1) newMinJ = j;

      if (currDelim.open &&
          currDelim.end < 0 &&
          currDelim.level === lastDelim.level) {

        var odd_match = false;

        if (currDelim.close || lastDelim.open) {
          // from spec:
          // sum of the lengths [...] must not be a multiple of 3
          // unless both lengths are multiples of 3
          if ((currDelim.length + lastDelim.length) % 3 === 0) {
            if (currDelim.length % 3 !== 0 || lastDelim.length % 3 !== 0) {
              odd_match = true;
            }
          }
        }

        if (!odd_match) {
          // if previous delimiter cannot be an opener, we can safely skip the entire sequence
          lastJump = j > 0 && !delimiters[j - 1].open ? delimiters[j - 1].jump + 1 : 0;

          lastDelim.jump = i - j + lastJump;
          lastDelim.open = false;
          currDelim.end  = i;
          currDelim.jump = lastJump;
          newMinJ = -1;
          break;
        }
      }
    }

    if (newMinJ !== -1) {
      openersBottom[lastDelim.marker][(lastDelim.length || 0) % 3] = newMinJ;
    }
  }
}


module.exports = function link_pairs(state) {
  var curr,
      tokens_meta = state.tokens_meta,
      max = state.tokens_meta.length;

  processDelimiters(state, state.delimiters);

  for (curr = 0; curr < max; curr++) {
    if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
      processDelimiters(state, tokens_meta[curr].delimiters);
    }
  }
};
