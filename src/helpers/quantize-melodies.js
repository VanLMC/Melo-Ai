export function getChunks(quantizedMelodies, MELODY_BARS) {
  let chunks = [];
  quantizedMelodies.forEach((m) => {
    const melChunks = mm.sequences.split(
      mm.sequences.clone(m),
      16 * MELODY_BARS
    );
    chunks = chunks.concat(melChunks);
  });
  return chunks;
}
