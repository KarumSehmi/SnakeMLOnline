// randomInference.js
export default function runInference(state) {
    // Randomly generates a move in the format [1, 0, 0], [0, 1, 0], or [0, 0, 1]
    // where [1, 0, 0] = go straight, [0, 1, 0] = turn right, [0, 0, 1] = turn left
    const moves = [
        [1, 0, 0], // Straight
        [0, 1, 0], // Right
        [0, 0, 1]  // Left
    ];
    const randomIndex = Math.floor(Math.random() * moves.length);
    return Promise.resolve(moves[randomIndex]);
}
