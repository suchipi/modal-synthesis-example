/**
 * Create a buffer of generated white noise, of the specified length.
 * @param length
 * @param audioContext
 */
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

/**
 * Creates an AudioNode that plays the input AudioBuffer.
 * @param buffer The input AudioBuffer
 * @param audioContext the AudioContext used to create the AudioBufferSourceNode
 */
export function makeNodeFromBuffer(
  buffer: AudioBuffer,
  audioContext: AudioContext
) {
  const sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = buffer;
  return sourceNode;
}
