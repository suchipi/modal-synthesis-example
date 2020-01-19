/**
 * Calculates the Q value for a bandpass Biquad filter that achieves the given decay rate.
 * @param frequency The frequency property of the Biquad filter
 * @param decay The desired duration in seconds that it takes for the sound to decrease in volume by 60db
 * @param audioContext The audio context to measure the sample rate from
 */
function qFromdecay(
  frequency: number,
  decay: number,
  audioContext: AudioContext
) {
  const rad = Math.pow(10, -3 / (decay * audioContext.sampleRate));
  const BW = Math.log(rad) / -Math.PI / (1 / audioContext.sampleRate);
  const Q = frequency / BW;
  return Q;
}

/**
 * Create a pair of input/output AudioNodes that filters an input excitation (for example, a short
 * burst of white noise, or residue noise gathered from a recording) into
 * one of the components of a modal sound.
 * @param frequency The center frequency of the mode in Hz
 * @param amplitude A number from 0-1; how loud this particular mode is
 * @param decay How long in seconds it takes for this mode to decrease in volume by 60db
 * @param audioContext The audioContext used to create nodes.
 */
function makeMode(
  frequency: number,
  amplitude: number,
  decay: number,
  audioContext: AudioContext
) {
  const biquadFilter = audioContext.createBiquadFilter();
  biquadFilter.type = "bandpass";
  biquadFilter.frequency.value = frequency;
  biquadFilter.Q.value = qFromdecay(frequency, decay, audioContext);

  const ampMultiplier = audioContext.createGain();
  ampMultiplier.gain.value = amplitude;

  biquadFilter.connect(ampMultiplier);

  return {
    inputNode: biquadFilter,
    outputNode: ampMultiplier,
    disconnect() {
      biquadFilter.disconnect();
      ampMultiplier.disconnect();
    },
  };
}

/**
 * Create a pair of input/output AudioNodes that filters an input excitation (for example, a short
 * burst of white noise, or residue noise gathered from a recording) into
 * the described components of a modal sound.
 * @param data An array of objects with frequency/amplitude/decay properties that describe the modes.
 * - frequency: The center frequency of the mode in Hz
 * - amplitude: A number from 0-1; how loud this particular mode is
 * - decay: How long in seconds it takes for this mode to decrease in volume by 60db
 * @param audioContext The AudioContext used to create nodes.
 */
export default function makeModes(
  data: Array<{ frequency: number; amplitude: number; decay: number }>,
  audioContext: AudioContext
) {
  const modes = data.map((datum) =>
    makeMode(datum.frequency, datum.amplitude, datum.decay, audioContext)
  );

  const input = audioContext.createGain();
  input.gain.value = 1;

  const output = audioContext.createGain();
  input.gain.value = 1;

  for (const mode of modes) {
    input.connect(mode.inputNode);
    mode.outputNode.connect(output);
  }

  return {
    inputNode: input,
    outputNode: output,
    disconnect() {
      input.disconnect();
      output.disconnect();
      for (const mode of modes) {
        mode.disconnect();
      }
    },
  };
}
