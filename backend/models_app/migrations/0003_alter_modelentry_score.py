# Generated by Django 5.0.6 on 2024-11-23 16:43

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('models_app', '0002_alter_modelentry_model_file'),
    ]

    operations = [
        migrations.AlterField(
            model_name='modelentry',
            name='score',
            field=models.FloatField(default=0),
        ),
    ]