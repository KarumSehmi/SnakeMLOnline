import requests

url = "http://127.0.0.1:8000/api/models/"
files = {'model_file': open('models_app/model.onnx', 'rb')}
data = {
    'username': 'test_user',
    'model_name': 'test_model',
    'score': 100,
}

response = requests.post(url, files=files, data=data)
print(response.json())
