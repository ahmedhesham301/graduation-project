from flask import Flask, request
from ai import predict

app = Flask(__name__)


@app.route("/", methods=["get"])
def handle_predict():
    return predict(request.get_json())


app.run("0.0.0.0")
