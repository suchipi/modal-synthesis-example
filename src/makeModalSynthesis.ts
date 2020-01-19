import makeModes from "./makeModes";
import { makeWhiteNoiseBuffer, makeNodeFromBuffer } from "./whiteNoise";

/**
 * Creates a synthetic model of a modal sound.
 * @param data An array of objects with frequency/amplitude/decay properties
 * that describe the modal components of the sound.
 * - frequency: The center frequency of the mode in Hz
 * - amplitude: A number from 0-1; how loud this particular mode is
 * - decay: How long in seconds it takes for this mode to decrease in volume by 60db
 * @param audioContext The current AudioContext.
 */
export default function makeModalSynthesis(
  data: Array<{ frequency: number; amplitude: number; decay: number }>,
  audioContext: AudioContext
) {
  const maxDecay = data.reduce((prev, datum) => Math.max(prev, datum.decay), 0);

  const whiteNoiseBuffer = makeWhiteNoiseBuffer(
    // Even though the input white noise duration is usually pretty short,
    // we need this buffer to be at least as long as the sound we're making,
    // so that it doesn't run out of values before the filter finishes resonating,
    // because if it runs out of values, then the filter stops playing.
    //
    // I add just a tiny bit more samples at the end there to be 100% sure
    // we aren't cutting the resonator off while it's still playing, because
    // if we did, that could make an ugly pop sound, like the static-y pop
    // sound you hear when you plug in or unplug your headphones.
    maxDecay * audioContext.sampleRate + 5,
    audioContext
  );

  /**
   * Create an AudioNode that generates white noise, using the buffer,
   * but the noise gets quieter over time and eventually hits zero after
   * the specified number of milliseconds.
   *
   * Note that the node can only be run once; you need to make a new one
   * every time you want to "strike" the resonator.
   * @param decayMs
   */
  function makeExcitation(decayMs: number) {
    const whiteNoiseNode = makeNodeFromBuffer(whiteNoiseBuffer, audioContext);
    const gain = audioContext.createGain();
    gain.gain.value = 1;
    whiteNoiseNode.connect(gain);

    return {
      /**
       * Start playing the white noise.
       */
      start: () => {
        whiteNoiseNode.start();
        gain.gain.setTargetAtTime(0, audioContext.currentTime, decayMs / 1000);
      },
      /**
       * The output node that you can connect into the rest of your patch.
       */
      outputNode: gain,
      /**
       * Disconnects the nodes the excitation is made out of, so that they
       * can be garbage collected. This also immediately stops the sound.
       */
      disconnect() {
        whiteNoiseNode.disconnect();
        gain.disconnect();
      },
    };
  }

  return {
    makeModel({
      amplitudeMultiplier,
      frequencyMultiplier,
      decayMultiplier,
      autoDisconnect = false,
    }: {
      amplitudeMultiplier?:
        | undefined
        | number
        | ((modeIndex: number) => number);
      frequencyMultiplier?:
        | undefined
        | number
        | ((modeIndex: number) => number);
      decayMultiplier?: undefined | number | ((modeIndex: number) => number);
      autoDisconnect?: undefined | boolean;
    }) {
      const outputNode = audioContext.createGain();
      outputNode.gain.value = 1;

      const toDisconnect: Array<{ disconnect(): void }> = [outputNode];

      return {
        /** The AudioNode that outputs the sound data. You'll probably want to connect it to audioContext.destination. */
        outputNode,

        /**
         * Feed a short burst of input data into the resonator so that it makes
         * sound. This short burst of data is equivalent to the "hit" in
         * the example of hitting a glass.
         *
         * In this program, white noise is used as the short burst.
         * @param whiteNoiseDuration
         * The duration of white noise to feed into the resonator, in
         * milliseconds. Note that it doesn't take much white noise to get
         * a long sound out of the resonator, because the input noise
         * *resonating* is where most of the sound comes from. The white
         * noise corresponds to just the amount of time that the resonator
         * is being "struck", so it should be pretty short.
         *
         * If unspecified, defaults to 10ms.
         */
        excite(whiteNoiseDuration: number = 10) {
          const modes = makeModes(
            data.map((datum, index) => ({
              ...datum,
              frequency:
                typeof frequencyMultiplier === "number"
                  ? datum.frequency * frequencyMultiplier
                  : typeof frequencyMultiplier === "function"
                  ? datum.frequency * frequencyMultiplier(index)
                  : datum.frequency,
              amplitude:
                typeof amplitudeMultiplier === "number"
                  ? datum.amplitude * amplitudeMultiplier
                  : typeof amplitudeMultiplier === "function"
                  ? datum.amplitude * amplitudeMultiplier(index)
                  : datum.amplitude,
              decay:
                typeof decayMultiplier === "number"
                  ? datum.decay * decayMultiplier
                  : typeof decayMultiplier === "function"
                  ? datum.decay * decayMultiplier(index)
                  : datum.decay,
            })),
            audioContext
          );
          toDisconnect.push(modes);

          const excitation = makeExcitation(whiteNoiseDuration);
          toDisconnect.push(excitation);

          excitation.outputNode.connect(modes.inputNode);
          modes.outputNode.connect(outputNode);

          excitation.start();

          if (autoDisconnect) {
            // setTimeout is pretty inaccurate timing-wise, but the
            // autoDisconnect feature is really only present for garbage
            // collection purposes, and is only intended to be used after
            // the sound has already played to completion, so super
            // accurate timing isn't important in that case.
            setTimeout(() => {
              this.disconnect();

              // maxDecay is in seconds. I'm adding an extra couple ms here
              // just to be extra safe we don't disconnect anything while sound
              // is still playing, since that could make an ugly pop sound,
              // like the static-y pop sound you hear when you plug in or
              // unplug your headphones.
            }, maxDecay * 1000 + 1);
          }
        },

        /**
         * Disconnect all the AudioNodes this synth is made out of,
         * so that they can be garbage collected. This also immediately
         * stops any playing sound.
         */
        disconnect() {
          for (const node of toDisconnect) {
            node.disconnect();
          }
        },
      };
    },
  };
}
