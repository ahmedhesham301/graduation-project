from requests import Session
import os
from faker import Faker
import random
from urllib.parse import urlsplit, urlunsplit
import sys
import os
from dotenv import load_dotenv

load_dotenv()
api_host = os.getenv("API_HOST")

fake = Faker()
files = []
for filename in os.listdir("./media"):
    f = open(f"./media/{filename}", "rb")
    files.append(
        {"fileName": filename, "size": os.fstat(f.fileno()).st_size, "data": f},
    )

if not files:
    print("No media files found in ./media")
    sys.exit(1)


session = Session()

registerData = {
    "fullName": "ahmed",
    "email": "ahdmed@gmail.com",
    "phone": "+201091599588",
    "password": "123456789",
}
resp = session.post(f"{api_host}/auth/register", json=registerData)

resp = session.post(
    f"{api_host}/auth/login",
    json={"email": "ahdmed@gmail.com", "password": "123456789"},
)

session.post(f"{api_host}/user/become-seller")
# get the cities and distrcts and put them in a variable
cities = session.get(f"{api_host}/cities").json()
locations = {}
for city in cities:
    districts = session.get(f"{api_host}/cities/{city}/districts").json()
    locations[city] = districts


types = session.get(f"{api_host}/properties/types").json()


for i in range(10000):
    media_count = random.randint(1, min(3, len(files)))
    selected_files = random.sample(files, media_count)
    city = random.choice(cities)

    data = {
        "type": random.choice(types),
        "lat": random.uniform(22, 31.7),
        "lon": random.uniform(25, 36),
        "area": random.randint(80, 300),
        "floors": random.randint(1, 3),
        "rooms": random.randint(1, 3),
        "bathrooms": random.randint(1, 3),
        "condition": random.choice(
            ["not finished", "semi finished", "fully finished", "luxury finished"]
        ),
        "city": city,
        "district": random.choice(locations[city]),
        "description": "Spacious apartment near metro",
        "price": random.randint(1000000, 15000000),
        "media": [
            {"fileName": file["fileName"], "size": file["size"]}
            for file in selected_files
        ],
    }
    resp = session.post(f"{api_host}/properties", json=data)

    if resp.status_code not in (200, 201):
        print("Create property failed:", resp.status_code)
        print(resp.text)
        sys.exit(1)

    resp_dict = resp.json()

    if "media" not in resp_dict:
        print("Create property response has no media:")
        print(resp_dict)
        sys.exit(1)

    for file in selected_files:
        media_info = resp_dict["media"][file["fileName"]]
        signed_url = media_info["uploadUrl"]
        signed_host = urlsplit(signed_url).netloc

        parts = urlsplit(signed_url)
        url = urlunsplit(
            (
                parts.scheme,
                parts.netloc.replace("rustfs", "127.0.0.1", 1),
                parts.path,
                parts.query,
                parts.fragment,
            )
        )

        file["data"].seek(0)
        resp = session.put(
            url,
            data=file["data"],
            headers={
                "Host": signed_host,
                "Content-Length": str(file["size"]),
            },
        )
        if resp.status_code != 200:
            print(resp.text)
            sys.exit(1)

        resp = session.put(
            f"{api_host}/properties/{resp_dict['id']}/media/{media_info['mediaId']}"
        )
        if resp.status_code != 201:
            print(resp.text)
            sys.exit(1)

        if resp.text:
            print(resp.json())
