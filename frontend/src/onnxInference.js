// onnxInference.js
import * as ort from 'onnxruntime-web';

// Function to run inference on the provided model and state
export async function runInference(modelSession, state) {
  if (!modelSession) {
    throw new Error('Model session is not provided.');
  }

  // Prepare the input as a tensor
  const inputTensor = new ort.Tensor('float32', state, [1, state.length]);

  // Run the model and get the output
  const feeds = {};
  feeds[modelSession.inputNames[0]] = inputTensor;
  const results = await modelSession.run(feeds);
  const outputName = modelSession.outputNames[0];
  const output = results[outputName].data;

  // Interpret the output to determine the action
  const moveIndex = output.indexOf(Math.max(...output)); // Get the index of the max value
  const action = [0, 0, 0];
  action[moveIndex] = 1; // Set the chosen action

  return action;
}
