from flask import Flask, request
from flask_cors import CORS
from ai import predict

app = Flask(__name__)

CORS(app)

@app.route("/", methods=["get"])
def handle_predict():
    print(request.get_json())
    return predict(request.get_json())


app.run("0.0.0.0")
