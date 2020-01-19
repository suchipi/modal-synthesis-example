import makeModes from "./makeModes";
import { makeWhiteNoiseBuffer, makeNodeFromBuffer } from "./whiteNoise";

export default function makeModalSynthesis(
  data: Array<{ frequency: number; amplitude: number; decay: number }>,
  audioContext: AudioContext
) {
  const maxdecay = data.reduce((prev, datum) => Math.max(prev, datum.decay), 0);

  const whiteNoiseBuffer = makeWhiteNoiseBuffer(
    maxdecay * 1.5 * audioContext.sampleRate,
    audioContext
  );

  function makeExcitation(decayMs: number) {
    const whiteNoiseNode = makeNodeFromBuffer(whiteNoiseBuffer, audioContext);
    const gain = audioContext.createGain();
    gain.gain.value = 1;
    whiteNoiseNode.connect(gain);

    return {
      start: () => {
        whiteNoiseNode.start();
        gain.gain.setTargetAtTime(0, audioContext.currentTime, decayMs / 1000);
      },
      outputNode: gain,
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
        outputNode,
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
            setTimeout(() => {
              this.disconnect();
            }, maxdecay * 1100);
          }
        },
        disconnect() {
          for (const node of toDisconnect) {
            node.disconnect();
          }
        },
      };
    },
  };
}
