from django.shortcuts import render
from rest_framework import viewsets
# Create your views here.
from rest_framework import serializers
from .models import ModelEntry
from rest_framework.decorators import action
from django.core.cache import cache  # Import cache

class ModelEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelEntry
        fields = '__all__'

# views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import ModelEntry
from .serializers import ModelEntrySerializer
from .simulation import SnakeGame
import onnxruntime as ort

class ModelEntryViewSet(viewsets.ModelViewSet):
    queryset = ModelEntry.objects.all()
    serializer_class = ModelEntrySerializer

    def create(self, request, *args, **kwargs):
        # Use the serializer to validate input data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        model_entry = serializer.save()

        # Run simulations to calculate average score
        try:
            # Load the model file
            model_path = model_entry.model_file.path
            model_session = ort.InferenceSession(model_path)

            total_score = 0
            num_games = 3
            for _ in range(num_games):
                game = SnakeGame(model_session)
                score = game.run_game()
                total_score += score

            average_score = total_score / num_games
            model_entry.score = average_score
            model_entry.save()

            return Response(self.get_serializer(model_entry).data, status=status.HTTP_201_CREATED)

        except Exception as e:
            # Delete the model entry if simulation fails
            model_entry.delete()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.core.files.base import ContentFile
from django.http import FileResponse
from .models import ModelEntry, TrainingJob
from .serializers import ModelEntrySerializer, TrainingJobSerializer
from .agent import Agent
import threading
import torch
import os

class TrainingJobViewSet(viewsets.ViewSet):
    queryset = TrainingJob.objects.all()

    def create(self, request):
        serializer = TrainingJobSerializer(data=request.data)
        if serializer.is_valid():
            training_job = serializer.save(status='PENDING')
            # Start training in a separate thread
            threading.Thread(target=self.run_training_job, args=(training_job.job_id,)).start()
            return Response({'job_id': training_job.job_id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        training_job = get_object_or_404(TrainingJob, pk=pk)
        serializer = TrainingJobSerializer(training_job)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def download_model(self, request, pk=None):
        training_job = get_object_or_404(TrainingJob, pk=pk)
        if training_job.status != 'COMPLETED' or not training_job.trained_model:
            return Response({'error': 'Model not available.'}, status=status.HTTP_400_BAD_REQUEST)
        return FileResponse(training_job.trained_model, as_attachment=True, filename='trained_model.onnx')

    def run_training_job(self, job_id):
        training_job = TrainingJob.objects.get(job_id=job_id)
        training_job.status = 'RUNNING'
        training_job.save()
        try:
            # Run the training process
            trained_model_path = self.train_model(training_job.learning_rate, job_id)
            # Save the trained model file to the TrainingJob instance
            with open(trained_model_path, 'rb') as f:
                content = ContentFile(f.read())
                training_job.trained_model.save('trained_model.onnx', content)
            training_job.status = 'COMPLETED'
        except Exception as e:
            training_job.status = 'FAILED'
            print(f"Training job {job_id} failed: {e}")
        training_job.save()

    def train_model(self, learning_rate, job_id):
        # Create an Agent and train it
        agent = Agent(learning_rate=learning_rate)
        agent.train(num_games=1000, job_id=job_id)  # Pass job_id to agent.train

        # Save the trained model in ONNX format
        model_path = './trained_models/trained_model.onnx'
        dummy_input = torch.randn(1, 11)
        torch.onnx.export(agent.model, dummy_input, model_path, input_names=['input'], output_names=['output'])
        return model_path

    @action(detail=True, methods=['get'])
    def game_state(self, request, pk=None):
        training_job = get_object_or_404(TrainingJob, pk=pk)
        if training_job.status != 'RUNNING':
            return Response({'error': 'Training not running.'}, status=status.HTTP_400_BAD_REQUEST)
        cache_key = f'training_job_{training_job.job_id}_game_state'
        game_state = cache.get(cache_key)
        if not game_state:
            return Response({'error': 'Game state not available.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(game_state)