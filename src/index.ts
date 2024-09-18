import makeModalSynthesis from "./makeModalSynthesis";
import makeTestUI from "./makeTestUI";

const startButton = document.createElement("button");
startButton.textContent = "Start!";
startButton.onclick = () => {
  document.body.removeChild(startButton);

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

    // Or, here's a more metallic sound from dropping a fork on my coffee table
    // [6852.941895, 1.0, 0.335],
    // [2344.42749, 0.662834, 0.737],
    // [2395.568848, 0.475336, 0.737],
    // [2096.795654, 0.579933, 0.427],
    // [1919.146729, 0.460997, 0.427],
    // [1972.979736, 0.480673, 0.427],
    // [1701.123047, 0.469506, 0.419],
    // [2215.228271, 0.417529, 0.419],
    // [2691.650391, 0.515139, 0.397],
    // [2051.037598, 0.381156, 0.421],
    // [1873.388672, 0.40972, 0.421],
    // [1655.36499, 0.373954, 0.501],
    // [2287.902832, 0.432171, 1.212],
    // [2139.862061, 0.306323, 1.212],
    // [2470.935059, 0.305192, 1.212],
    // [2799.316406, 0.352841, 0.391],
    // [2527.459717, 0.339127, 0.786],
    // [3604.119873, 0.29781, 0.552],
    // [3289.196777, 0.252666, 0.384],
    // [8677.880859, 0.162664, 0.293],
  ].map((triad) => ({
    frequency: triad[0],
    amplitude: triad[1],
    decay: triad[2],
  }));

  const modalSynthesis = makeModalSynthesis(data, audioContext);

  const testUI = makeTestUI(modalSynthesis, audioContext);

  document.body.appendChild(testUI);
};
document.body.appendChild(startButton);
