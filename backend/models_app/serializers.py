from rest_framework import serializers
from .models import ModelEntry, TrainingJob

class ModelEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelEntry
        fields = '__all__'
        read_only_fields = ('score',)

class TrainingJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingJob
        fields = '__all__'
        read_only_fields = ('job_id', 'status', 'created_at', 'trained_model')
