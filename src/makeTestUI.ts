import throttle from "lodash.throttle";
import makeModalSynthesis from "./makeModalSynthesis";

export default function makeTestUI(
  modalSynthesis: ReturnType<typeof makeModalSynthesis>,
  audioContext: AudioContext
) {
  const random = (min: number, max: number) =>
    Math.random() * (max - min) + min;

  let labelId = 0;
  function makeSlider(
    label: string,
    min: number,
    max: number,
    step: number,
    value: number
  ) {
    // We're going to make a UI laid out like this:
    // -------O-   Slider Label   0.5

    const outerEl = document.createElement("div");
    Object.assign(outerEl.style, {
      display: "flex",
      width: "400px",
      maxWidth: "100vw",
      alignItems: "center",
      justifyContent: "space-between",
    });

    // The slider control
    const inputEl = document.createElement("input");
    inputEl.id = `slider_${labelId++}`;
    inputEl.type = "range";
    inputEl.min = String(min);
    inputEl.max = String(max);
    inputEl.step = String(step);
    inputEl.value = String(value);

    // The label in the middle
    const labelEl = document.createElement("label");
    labelEl.htmlFor = inputEl.id;
    labelEl.textContent = label;

    // A label showing the current value of the slider
    const valueEl = document.createElement("code");
    valueEl.textContent = inputEl.value;
    valueEl.style.minWidth = "48px";

    // Update the value label whenever the value changes
    inputEl.addEventListener("input", () => {
      valueEl.textContent = inputEl.value;
    });

    outerEl.appendChild(inputEl);
    outerEl.appendChild(labelEl);
    outerEl.appendChild(valueEl);

    return {
      /** The wrapping div that you can append to document.body or whatever. */
      outerEl,

      /**
       * The range input (slider) element that's somewhere inside the
       * `outerEl` div. You shouldn't append it to anything, since it's already
       * a child of `outerEl`, but it's here if you want to add event listeners
       * to it or check its value.
       */
      inputEl,

      /**
       * Set the value of `inputEl` and also update the value label to reflect
       * that.
       */
      setValue(value: number) {
        inputEl.value = String(value);
        valueEl.textContent = String(value);
      },
    };
  }

  /**
   * We're going to make a UI laid out like this:
   *
   * [Button] [Button] . . .
   * -----------O------   Slider Label   0.5
   * -----------O------   Slider Label   0.5
   *                   .
   *                   .
   *                   .
   */

  // First, the sliders:
  const ampSlider = makeSlider("Amplitude Multiplier", 0, 5, 0.01, 1);
  const ampVarianceSlider = makeSlider("Amplitude Variance", 0, 1, 0.01, 1);

  const freqSlider = makeSlider("Frequency Multiplier", 0.01, 2.5, 0.001, 1);
  const freqVarianceSlider = makeSlider("Frequency Variance", 0, 1, 0.01, 0);

  const decaySlider = makeSlider("Decay Multiplier", 0.05, 10, 0.05, 1);
  const decayVarianceSlider = makeSlider("Decay Variance", 0, 1, 0.01, 0.3);

  let synth: ReturnType<typeof modalSynthesis["makeModel"]>;
  function initSynth() {
    if (synth) {
      synth.disconnect();
    }

    synth = modalSynthesis.makeModel({
      amplitudeMultiplier: () =>
        random(
          (1 - Number(ampVarianceSlider.inputEl.value) / 2) *
            Number(ampSlider.inputEl.value),
          (1 + Number(ampVarianceSlider.inputEl.value) / 2) *
            Number(ampSlider.inputEl.value)
        ),
      frequencyMultiplier: () =>
        Number(freqSlider.inputEl.value) *
        random(
          1 - Number(freqVarianceSlider.inputEl.value) / 2,
          1 + Number(freqVarianceSlider.inputEl.value) / 2
        ),
      decayMultiplier: () =>
        Number(decaySlider.inputEl.value) *
        random(
          1 - Number(decayVarianceSlider.inputEl.value) / 2,
          1 + Number(decayVarianceSlider.inputEl.value) / 2
        ),
    });
    synth.outputNode.connect(audioContext.destination);
  }
  initSynth();

  // Then, the buttons:
  const hitButton = document.createElement("button");
  hitButton.textContent = "Hit the glass";
  hitButton.onclick = () => {
    synth.excite();
  };

  [
    ampSlider,
    ampVarianceSlider,
    freqSlider,
    freqVarianceSlider,
    decaySlider,
    decayVarianceSlider,
  ].forEach((slider) => {
    slider.inputEl.addEventListener(
      "input",
      throttle(() => {
        hitButton.click();
      }, 50)
    );
  });

  const stopButton = document.createElement("button");
  stopButton.textContent = "Stop all sounds";
  stopButton.onclick = () => {
    initSynth();
  };

  const resetButton = document.createElement("button");
  resetButton.textContent = "Reset slider positions";
  resetButton.onclick = () => {
    initSynth();
    ampSlider.inputEl.value = String(1);
    ampVarianceSlider.inputEl.value = String(1);

    freqSlider.inputEl.value = String(1);
    freqVarianceSlider.inputEl.value = String(0);

    decaySlider.inputEl.value = String(1);
    decayVarianceSlider.inputEl.value = String(0.01);
  };

  // Then we put the whole layout together:
  const rootDiv = document.createElement("div");

  rootDiv.appendChild(hitButton);
  rootDiv.appendChild(stopButton);
  rootDiv.appendChild(resetButton);

  rootDiv.appendChild(ampSlider.outerEl);
  rootDiv.appendChild(ampVarianceSlider.outerEl);

  rootDiv.appendChild(freqSlider.outerEl);
  rootDiv.appendChild(freqVarianceSlider.outerEl);

  rootDiv.appendChild(decaySlider.outerEl);
  rootDiv.appendChild(decayVarianceSlider.outerEl);

  return rootDiv;
}
