import makeModalSynthesis from "./makeModalSynthesis";
import makeTestUI from "./makeTestUI";

const audioContext = new AudioContext();

const data = [
  // These are the modal components of the sound of me hitting a glass
  // on my desk with my apple pencil, as discerned by looking at the
  // recording in audacity
  [5434.442139, 0.851535, 0.286],
  [5141.052246, 0.496733, 0.346],
  [1429.266357, 1.0, 1.112],
  [2678.192139, 0.646166, 0.687],
  [5095.294189, 0.049253, 0.347],
  [5388.684082, 0.099274, 0.287],
  [5184.118652, 0.023394, 0.345],
  [5477.508545, 0.061101, 0.286],
  [5649.77417, 0.026886, 0.286],
  [5227.185059, 0.050205, 0.31],
  [5604.016113, 0.012521, 0.284],
  [5692.840576, 0.011661, 0.286],
  [5342.926025, 0.009492, 0.267],
  [5558.258057, 0.028714, 0.287],
  [7151.715088, 0.009401, 0.233],
  [5049.536133, 0.013756, 0.312],
  [5735.906982, 0.011548, 0.182],
].map((triad) => ({
  frequency: triad[0],
  amplitude: triad[1],
  decay: triad[2],
}));

const modalSynthesis = makeModalSynthesis(data, audioContext);

const testUI = makeTestUI(modalSynthesis, audioContext);

document.body.appendChild(testUI);
