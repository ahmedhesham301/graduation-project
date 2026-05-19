from requests import Session
import os
import random
import sys
from dotenv import load_dotenv

load_dotenv()
api_host = os.getenv("API_HOST")


# Shared read-only data
base_session = Session()

registerData = {
    "fullName": "ahmed",
    "email": "ahdmed@gmail.com",
    "phone": "+201091599588",
    "password": "123456789",
}

base_session.post(f"{api_host}/auth/register", json=registerData)

base_session.post(
    f"{api_host}/auth/login",
    json={"email": "ahdmed@gmail.com", "password": "123456789"},
)

base_session.post(f"{api_host}/user/become-seller")

while True:
    for i in range(250):
        id = random.randint(1,250)
        base_session.get(f"{api_host}/properties/{id}")
        print(f"viewd property")
        if id % 3 == 0:
            base_session.post(f"{api_host}/favorites/{id}")
            print(f"saved property to fav")
