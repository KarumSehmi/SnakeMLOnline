from django.db import models
from django.core.exceptions import ValidationError
import onnx
import uuid

def validate_onnx_model(file):
    try:
        model = onnx.load_model(file)
        onnx.checker.check_model(model)
    except Exception as e:
        raise ValidationError("Uploaded file is not a valid ONNX model.")

class ModelEntry(models.Model):
    username = models.CharField(max_length=100)
    model_name = models.CharField(max_length=100)
    score = models.FloatField(default=0)  # Average score
    model_file = models.FileField(upload_to='models/', validators=[validate_onnx_model])
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username} - {self.model_name}"

class TrainingJob(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('RUNNING', 'Running'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]

    job_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=100)
    learning_rate = models.FloatField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    trained_model = models.FileField(upload_to='trained_models/', null=True, blank=True)

    def __str__(self):
        return f"TrainingJob {self.job_id} - {self.status}"



from django.contrib import admin
from .models import ModelEntry

# Register the model
@admin.register(ModelEntry)
class ModelEntryAdmin(admin.ModelAdmin):
    list_display = ('username', 'model_name', 'score', 'created_at')  # Fields to display in the admin
    search_fields = ('username', 'model_name')  # Add search functionality
    list_filter = ('created_at',)  # Add filters in the sidebar
