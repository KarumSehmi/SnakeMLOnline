import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { runInference } from './onnxInference.js';

const BLOCK_SIZE = 20;
const WIDTH = 640;
const HEIGHT = 480;

const DIRECTIONS = ['RIGHT', 'DOWN', 'LEFT', 'UP'];

const GameCanvas = forwardRef(({ speed, logToConsole, currentModel }, ref) => {
  const canvasRef = useRef(null);
  const gameIntervalRef = useRef(null);
  const gameDataRef = useRef({
    snake: [],
    direction: 'RIGHT',
    food: null,
    score: 0,
    frameIteration: 0,
  });

  useImperativeHandle(ref, () => ({
    startGame,
    stopGame,
    resetGame,
    updateGameState, // Expose the new method
  }));
  const updateGameState = (newGameState) => {
    gameDataRef.current = {
      snake: newGameState.snake,
      direction: newGameState.direction,
      food: newGameState.food,
      score: newGameState.score,
      frameIteration: newGameState.frame_iteration,
    };
    drawGame();
  };
  

  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    const initialFood = generateRandomFood(initialSnake);
    gameDataRef.current = {
      snake: initialSnake,
      direction: 'RIGHT',
      food: initialFood,
      score: 0,
      frameIteration: 0,
    };
    drawGame();
  };

  const generateRandomFood = (snake) => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * (WIDTH / BLOCK_SIZE)),
        y: Math.floor(Math.random() * (HEIGHT / BLOCK_SIZE)),
      };
    } while (snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, WIDTH, HEIGHT);

    // Background
    context.fillStyle = '#282c34';
    context.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw snake
    const snakeGradient = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
    snakeGradient.addColorStop(0, '#6ef542');
    snakeGradient.addColorStop(1, '#43a047');
    context.fillStyle = snakeGradient;
    context.strokeStyle = '#2e7d32';

    gameDataRef.current.snake.forEach((segment) => {
      drawRoundedRectangle(context, segment.x * BLOCK_SIZE, segment.y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 5);
    });

    // Draw food
    const foodGradient = context.createRadialGradient(
      gameDataRef.current.food.x * BLOCK_SIZE + BLOCK_SIZE / 2,
      gameDataRef.current.food.y * BLOCK_SIZE + BLOCK_SIZE / 2,
      5,
      gameDataRef.current.food.x * BLOCK_SIZE + BLOCK_SIZE / 2,
      gameDataRef.current.food.y * BLOCK_SIZE + BLOCK_SIZE / 2,
      BLOCK_SIZE / 2
    );
    foodGradient.addColorStop(0, '#ff6f61');
    foodGradient.addColorStop(1, '#ff1744');
    context.fillStyle = foodGradient;
    context.beginPath();
    context.arc(
      gameDataRef.current.food.x * BLOCK_SIZE + BLOCK_SIZE / 2,
      gameDataRef.current.food.y * BLOCK_SIZE + BLOCK_SIZE / 2,
      BLOCK_SIZE / 2,
      0,
      2 * Math.PI
    );
    context.fill();

    // Draw score
    context.fillStyle = 'white';
    context.font = '20px Arial';
    context.fillText(`Score: ${gameDataRef.current.score}`, 10, 20);
  };

  const drawRoundedRectangle = (ctx, x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  const moveSnake = async () => {
    const { snake } = gameDataRef.current;
    const state = getStateForModel();

    if (!currentModel) {
      logToConsole('No model is loaded. Cannot run inference.');
      stopGame();
      return;
    }

    const action = await runInference(currentModel, state);
    applyAction(action);

    const head = { ...snake[0] };

    switch (gameDataRef.current.direction) {
      case 'RIGHT':
        head.x += 1;
        break;
      case 'LEFT':
        head.x -= 1;
        break;
      case 'UP':
        head.y -= 1;
        break;
      case 'DOWN':
        head.y += 1;
        break;
      default:
        break;
    }

    if (
      head.x < 0 ||
      head.x >= WIDTH / BLOCK_SIZE ||
      head.y < 0 ||
      head.y >= HEIGHT / BLOCK_SIZE ||
      snake.some((segment) => segment.x === head.x && segment.y === head.y)
    ) {
      stopGame();
      logToConsole('Game Over!');
      return;
    }

    if (head.x === gameDataRef.current.food.x && head.y === gameDataRef.current.food.y) {
      snake.unshift(head);
      gameDataRef.current.food = generateRandomFood(snake);
      gameDataRef.current.score += 1;
      gameDataRef.current.frameIteration = 0;
      logToConsole(`Food eaten! Score: ${gameDataRef.current.score}`);
    } else {
      snake.pop();
      snake.unshift(head);
    }

    gameDataRef.current.snake = snake;
    drawGame();
  };

  const getStateForModel = () => {
    const head = gameDataRef.current.snake[0];
    const food = gameDataRef.current.food;
    const snake = gameDataRef.current.snake;

    const dirLeft = gameDataRef.current.direction === 'LEFT';
    const dirRight = gameDataRef.current.direction === 'RIGHT';
    const dirUp = gameDataRef.current.direction === 'UP';
    const dirDown = gameDataRef.current.direction === 'DOWN';

    const isCollision = (point) => {
      return (
        point.x < 0 ||
        point.x >= WIDTH / BLOCK_SIZE ||
        point.y < 0 ||
        point.y >= HEIGHT / BLOCK_SIZE ||
        snake.some((segment) => segment.x === point.x && segment.y === point.y)
      );
    };

    const dangerStraight =
      (dirRight && isCollision({ x: head.x + 1, y: head.y })) ||
      (dirLeft && isCollision({ x: head.x - 1, y: head.y })) ||
      (dirUp && isCollision({ x: head.x, y: head.y - 1 })) ||
      (dirDown && isCollision({ x: head.x, y: head.y + 1 }));

    const dangerRight =
      (dirUp && isCollision({ x: head.x + 1, y: head.y })) ||
      (dirDown && isCollision({ x: head.x - 1, y: head.y })) ||
      (dirLeft && isCollision({ x: head.x, y: head.y - 1 })) ||
      (dirRight && isCollision({ x: head.x, y: head.y + 1 }));

    const dangerLeft =
      (dirDown && isCollision({ x: head.x + 1, y: head.y })) ||
      (dirUp && isCollision({ x: head.x - 1, y: head.y })) ||
      (dirRight && isCollision({ x: head.x, y: head.y - 1 })) ||
      (dirLeft && isCollision({ x: head.x, y: head.y + 1 }));

    return [
      dangerStraight ? 1 : 0,
      dangerRight ? 1 : 0,
      dangerLeft ? 1 : 0,
      dirLeft ? 1 : 0,
      dirRight ? 1 : 0,
      dirUp ? 1 : 0,
      dirDown ? 1 : 0,
      food.x < head.x ? 1 : 0,
      food.x > head.x ? 1 : 0,
      food.y < head.y ? 1 : 0,
      food.y > head.y ? 1 : 0,
    ];
  };

  const applyAction = (action) => {
    const idx = DIRECTIONS.indexOf(gameDataRef.current.direction);

    if (action[0] === 1) {
      // No change
    } else if (action[1] === 1) {
      const nextIdx = (idx + 1) % 4;
      gameDataRef.current.direction = DIRECTIONS[nextIdx];
    } else if (action[2] === 1) {
      const nextIdx = (idx - 1 + 4) % 4;
      gameDataRef.current.direction = DIRECTIONS[nextIdx];
    }
  };

  const startGame = () => {
    if (gameIntervalRef.current) return;
    gameIntervalRef.current = setInterval(moveSnake, 1000 / speed);
    logToConsole('Game started!');
  };

  const stopGame = () => {
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current);
      gameIntervalRef.current = null;
      logToConsole('Game stopped!');
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      style={{ border: '1px solid black', borderRadius: '10px', backgroundColor: '#1b1b1b' }}
    ></canvas>
  );
});

export default GameCanvas;
