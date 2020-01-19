export function makeWhiteNoiseBuffer(
  length: number,
  audioContext: AudioContext
) {
  const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);

  const output = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  return buffer;
}

export function makeNodeFromBuffer(
  buffer: AudioBuffer,
  audioContext: AudioContext
) {
  const sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = buffer;
  return sourceNode;
}
