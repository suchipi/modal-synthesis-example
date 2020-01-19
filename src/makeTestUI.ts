import throttle from "lodash.throttle";
import makeModalSynthesis from "./makeModalSynthesis";

export default function makeTestUI(
  modalSynthesis: ReturnType<typeof makeModalSynthesis>,
  audioContext: AudioContext
) {
  const rootDiv = document.createElement("div");

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
    const inputEl = document.createElement("input");
    inputEl.id = `slider_${labelId++}`;
    inputEl.type = "range";
    inputEl.min = String(min);
    inputEl.max = String(max);
    inputEl.step = String(step);
    inputEl.value = String(value);

    const outerEl = document.createElement("div");
    Object.assign(outerEl.style, {
      display: "flex",
      width: "400px",
      maxWidth: "100vw",
      alignItems: "center",
      justifyContent: "space-between",
    });

    const labelEl = document.createElement("label");
    labelEl.htmlFor = inputEl.id;
    labelEl.textContent = label;

    const valueEl = document.createElement("code");
    valueEl.textContent = inputEl.value;
    valueEl.style.minWidth = "48px";

    inputEl.addEventListener("input", () => {
      valueEl.textContent = inputEl.value;
    });

    outerEl.appendChild(inputEl);
    outerEl.appendChild(labelEl);
    outerEl.appendChild(valueEl);

    return {
      outerEl,
      inputEl,
      setValue(value: number) {
        inputEl.value = String(value);
        valueEl.textContent = String(value);
      },
    };
  }

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

  const hitButton = document.createElement("button");
  hitButton.textContent = "Hit the glass";
  hitButton.onclick = () => {
    synth.excite();
  };

  rootDiv.appendChild(hitButton);

  const stopButton = document.createElement("button");
  stopButton.textContent = "Stop all sounds";
  stopButton.onclick = () => {
    initSynth();
  };

  rootDiv.appendChild(stopButton);

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

  rootDiv.appendChild(resetButton);

  rootDiv.appendChild(ampSlider.outerEl);
  rootDiv.appendChild(ampVarianceSlider.outerEl);

  rootDiv.appendChild(freqSlider.outerEl);
  rootDiv.appendChild(freqVarianceSlider.outerEl);

  rootDiv.appendChild(decaySlider.outerEl);
  rootDiv.appendChild(decayVarianceSlider.outerEl);

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

  return rootDiv;
}
