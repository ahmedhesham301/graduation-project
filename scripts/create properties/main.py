from requests import Session
import os
from faker import Faker
import random
from urllib.parse import urlsplit, urlunsplit
import sys
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

load_dotenv()
api_host = os.getenv("API_HOST")

fake = Faker()

# Load media files once
files = []
for filename in os.listdir("./media"):
    path = f"./media/{filename}"
    size = os.path.getsize(path)

    files.append(
        {
            "fileName": filename,
            "size": size,
            "path": path,
        }
    )
tour = {
    "fileName": "tour.zip",
    "path": "./tour.zip",
    "size": os.path.getsize("./tour.zip"),
}
if not files:
    print("No media files found in ./media")
    sys.exit(1)


# Shared read-only data
base_session = Session()

registerData = {
    "fullName": "ahmed",
    "email": "ahdmed@gmail.com",
    "phone": "+201091599588",
    "password": "123456789",
}

base_session.post(f"{api_host}/auth/register", json=registerData)

resp = base_session.post(
    f"{api_host}/auth/login",
    json={"email": "ahdmed@gmail.com", "password": "123456789"},
)

base_session.post(f"{api_host}/user/become-seller")

# Load cities/districts
cities = base_session.get(f"{api_host}/cities").json()

locations = {}
for city in cities:
    districts = base_session.get(f"{api_host}/cities/{city}/districts").json()
    locations[city] = districts

types = base_session.get(f"{api_host}/properties/types").json()

# Copy auth cookies to all thread sessions
shared_cookies = base_session.cookies.get_dict()

lock = threading.Lock()


def create_property(index: int):
    try:
        session = Session()
        session.cookies.update(shared_cookies)

        media_count = random.randint(1, min(5, len(files)))
        selected_files = random.sample(files, media_count)
        if random.randint(1,3) == 1:
            selected_files.append(tour)

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
                [
                    "not finished",
                    "semi finished",
                    "fully finished",
                    "luxury finished",
                ]
            ),
            "city": city,
            "district": random.choice(locations[city]),
            "description": fake.text(max_nb_chars=100),
            "price": random.randint(1000000, 15000000),
            "media": [
                {
                    "fileName": file["fileName"],
                    "size": file["size"],
                }
                for file in selected_files
            ],
        }

        resp = session.post(f"{api_host}/properties", json=data)

        if resp.status_code not in (200, 201):
            with lock:
                print(f"[{index}] Create property failed:", resp.status_code)
                print(resp.text)
            return

        resp_dict = resp.json()

        if "media" not in resp_dict:
            with lock:
                print(f"[{index}] Create property response has no media:")
                print(resp_dict)
            return

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

            with open(file["path"], "rb") as f:
                resp = session.put(
                    url,
                    data=f,
                    headers={
                        "Host": signed_host,
                        "Content-Length": str(file["size"]),
                    },
                )

            if resp.status_code != 200:
                with lock:
                    print(f"[{index}] Upload failed:")
                    print(resp.text)
                return

            resp = session.put(
                f"{api_host}/properties/{resp_dict['id']}/media/{media_info['mediaId']}"
            )

            if resp.status_code != 201:
                with lock:
                    print(f"[{index}] Media confirm failed:")
                    print(resp.text)
                return

        with lock:
            print(f"[{index}] Created property {resp_dict['id']}")

    except Exception as e:
        with lock:
            print(f"[{index}] ERROR:", str(e))


TOTAL = 10000
THREADS = 8

with ThreadPoolExecutor(max_workers=THREADS) as executor:
    futures = [executor.submit(create_property, i) for i in range(TOTAL)]

    for future in as_completed(futures):
        future.result()

print("Done")
