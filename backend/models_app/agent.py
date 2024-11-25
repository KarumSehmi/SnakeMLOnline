# agent.py
import torch
import random
import numpy as np
from collections import deque
from .simulation import SnakeGame, Direction, Point
from .model import Linear_QNet, QTrainer
from django.core.cache import cache  # Import cache
import time  # Import the time module

MAX_MEMORY = 100_000
BATCH_SIZE = 1000

class Agent:
    def __init__(self, learning_rate, n_games=0, record=0, trainable=True):
        self.n_games = n_games
        self.record = record
        self.epsilon = max(150 - self.n_games, 20)  # Adjust epsilon based on n_games
        self.learning_rate = learning_rate
        self.gamma = 0.9  # Discount rate
        self.memory = deque(maxlen=MAX_MEMORY)  # popleft() when max memory is reached
        self.model = Linear_QNet(11, 256, 3)
        self.trainer = QTrainer(self.model, lr=learning_rate, gamma=self.gamma)
        self.trainable = trainable

    def get_epsilon(self):
        return self.epsilon

    def save_agent(self, file_name='agent.pth'):
        data = {
            'model_state': self.model.state_dict(),
            'n_games': self.n_games,
            'record': self.record,
            'learning_rate': self.trainer.lr
        }
        torch.save(data, file_name)

    @classmethod
    def load_agent(cls, file_name):
        data = torch.load(file_name)
        learning_rate = data.get('learning_rate', 0.001)

        agent = cls(learning_rate=learning_rate, n_games=data.get('n_games', 0), record=data.get('record', 0), trainable=False)
        agent.model.load_state_dict(data['model_state'])
        agent.model.eval()
        return agent

    def get_state(self, game):
        head = game.snake[0]
        point_l = Point(head.x - 20, head.y)
        point_r = Point(head.x + 20, head.y)
        point_u = Point(head.x, head.y - 20)
        point_d = Point(head.x, head.y + 20)

        dir_l = game.direction == Direction.LEFT
        dir_r = game.direction == Direction.RIGHT
        dir_u = game.direction == Direction.UP
        dir_d = game.direction == Direction.DOWN

        state = [
            # Danger straight
            (dir_r and game.is_collision(point_r)) or
            (dir_l and game.is_collision(point_l)) or
            (dir_u and game.is_collision(point_u)) or
            (dir_d and game.is_collision(point_d)),

            # Danger right
            (dir_u and game.is_collision(point_r)) or
            (dir_d and game.is_collision(point_l)) or
            (dir_l and game.is_collision(point_u)) or
            (dir_r and game.is_collision(point_d)),

            # Danger left
            (dir_d and game.is_collision(point_r)) or
            (dir_u and game.is_collision(point_l)) or
            (dir_r and game.is_collision(point_u)) or
            (dir_l and game.is_collision(point_d)),

            # Move direction
            dir_l,
            dir_r,
            dir_u,
            dir_d,

            # Food location
            game.food.x < game.head.x,  # Food left
            game.food.x > game.head.x,  # Food right
            game.food.y < game.head.y,  # Food up
            game.food.y > game.head.y   # Food down
        ]

        return np.array(state, dtype=int)

    def remember(self, state, action, reward, next_state, done):
        # Store the experience in memory
        self.memory.append((state, action, reward, next_state, done))  # Automatically removes the oldest if MAX_MEMORY is reached

    def train_long_memory(self):
        if len(self.memory) > BATCH_SIZE:
            mini_sample = random.sample(self.memory, BATCH_SIZE)  # List of tuples
        else:
            mini_sample = self.memory

        states, actions, rewards, next_states, dones = zip(*mini_sample)
        self.trainer.train_step(states, actions, rewards, next_states, dones)

    def train_short_memory(self, state, action, reward, next_state, done):
        # Train on a single step
        self.trainer.train_step(state, action, reward, next_state, done)

    def get_action(self, state):
        # Random moves: tradeoff between exploration and exploitation
        self.epsilon = max(150 - self.n_games, 0)

        final_move = [0, 0, 0]
        if random.randint(0, 200) < self.epsilon and self.trainable:
            move = random.randint(0, 2)
            final_move[move] = 1
        else:
            state0 = torch.tensor(state, dtype=torch.float)
            prediction = self.model(state0)
            move = torch.argmax(prediction).item()
            final_move[move] = 1
        return final_move

    def train(self, num_games=1000, job_id=None):
        total_score = 0
        record = self.record
        BLOCK_SIZE = 20  # Ensure this matches the frontend

        game = SnakeGame()
        while self.n_games < num_games:
            # get old state
            state_old = self.get_state(game)

            # get move
            final_move = self.get_action(state_old)

            # perform move and get new state
            reward, done, score = game.play_step(final_move)

            state_new = self.get_state(game)

            # train short memory
            self.train_short_memory(state_old, final_move, reward, state_new, done)

            # remember
            self.remember(state_old, final_move, reward, state_new, done)

            # Update the game state in cache
            if job_id:
                cache_key = f'training_job_{job_id}_game_state'
                cache.set(cache_key, {
                    'snake': [{'x': int(point.x / BLOCK_SIZE), 'y': int(point.y / BLOCK_SIZE)} for point in game.snake],
                    'direction': game.direction.name,
                    'food': {'x': int(game.food.x / BLOCK_SIZE), 'y': int(game.food.y / BLOCK_SIZE)},
                    'score': game.score,
                    'frame_iteration': game.frame_iteration,
                }, timeout=None)

            # Add a delay to slow down the game
            time.sleep(0.01)  # Delay by 500ms (adjust as needed)

            if done:
                # train long memory
                game.reset()
                self.n_games += 1
                if self.trainable:
                    self.train_long_memory()

                if score > record:
                    record = score
                    self.save_agent()

                print('Game', self.n_games, 'Score', score, 'Record:', record)

                total_score += score
                mean_score = total_score / self.n_games

        return record