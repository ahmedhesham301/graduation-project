from requests import Session
import os
import random
import time
import sys
from dotenv import load_dotenv

load_dotenv()
API_HOST = os.getenv("API_HOST")

CONTACT_METHODS = ["phone", "email", "whatsapp"]

# ── Buyer account — NOT the same user who created properties ──────────────────
BUYER = {
    "fullName": "Test Buyer",
    "email": "buyer_seeder@test.com",
    "phone": "+201099999999",
    "password": "123456789",
}


def setup_buyer(api_host):
    session = Session()

    resp = session.post(f"{api_host}/auth/register", json=BUYER)
    if resp.status_code not in (200, 201, 400):
        print(f"Register failed: {resp.status_code} — {resp.text}")
        sys.exit(1)

    resp = session.post(f"{api_host}/auth/login", json={
        "email": BUYER["email"],
        "password": BUYER["password"],
    })
    if resp.status_code != 200:
        print(f"Login failed: {resp.status_code} — {resp.text}")
        sys.exit(1)

    name = resp.json().get("name", "unknown")
    role = resp.json().get("role", "unknown")
    print(f"Buyer ready: {name} (role={role})")

    # Safety check — buyer must NOT be a seller of any property
    if role == "seller":
        print("WARNING: Buyer account has seller role.")
        print("Contacts will be blocked for properties this account owns.")
        print("Use a different email that has never created properties.")

    return session


def fetch_property_ids(session, api_host, max_pages=5):
    """Fetch real property IDs from search — avoids 404s from random IDs."""
    ids = []
    for page in range(1, max_pages + 1):
        resp = session.get(f"{api_host}/search", params={"page": page, "minPrice": 1})
        if resp.status_code != 200:
            print(f"Search page {page} failed: {resp.status_code}")
            break
        batch = resp.json()
        if not batch:
            break
        ids.extend(p["id"] for p in batch if isinstance(p, dict) and "id" in p)
        print(f"Page {page}: fetched {len(batch)} properties (total so far: {len(ids)})")

    if not ids:
        print("No properties found — run the create-properties script first.")
        sys.exit(1)

    print(f"Working with {len(ids)} real property IDs\n")
    return ids


def seed_traffic(api_host, buyer_session, property_ids):
    iteration = 0
    saved_ids = set()  # track to avoid counting duplicate saves as errors

    try:
        while True:
            iteration += 1
            prop_id = random.choice(property_ids)

            # ── 30 % authenticated buyer, 70 % fresh guest ────────────────────
            if random.random() < 0.3:
                # Authenticated buyer
                resp = buyer_session.get(f"{api_host}/properties/{prop_id}")
                if resp.status_code != 200:
                    print(f"[{iteration}] Buyer view {prop_id} failed: {resp.status_code}")
                    continue

                print(f"[{iteration}] Buyer viewed {prop_id}")

                # 40 % chance to save
                if random.random() < 0.4:
                    save_resp = buyer_session.post(f"{api_host}/favorites/{prop_id}")
                    if save_resp.status_code == 201:
                        saved_ids.add(prop_id)
                        print(f"  ✓ Saved {prop_id}")
                    elif save_resp.status_code == 200:
                        print(f"  · Already saved {prop_id}")
                    else:
                        print(f"  ✗ Save failed: {save_resp.status_code} — {save_resp.text}")

                # 25 % chance to contact
                if random.random() < 0.25:
                    method = random.choice(CONTACT_METHODS)
                    contact_resp = buyer_session.post(
                        f"{api_host}/properties/{prop_id}/contact",
                        json={"contact_method": method},
                    )
                    if contact_resp.status_code == 201:
                        print(f"  ✓ Buyer contacted via {method}")
                    else:
                        print(f"  ✗ Contact failed: {contact_resp.status_code} — {contact_resp.text}")

            else:
                # Fresh guest — new Session() = new session ID = treated as new visitor
                guest = Session()
                resp = guest.get(f"{api_host}/properties/{prop_id}")
                if resp.status_code != 200:
                    print(f"[{iteration}] Guest view {prop_id} failed: {resp.status_code}")
                    continue

                print(f"[{iteration}] Guest viewed {prop_id}")

                # 30 % chance guest contacts
                if random.random() < 0.3:
                    method = random.choice(CONTACT_METHODS)
                    contact_resp = guest.post(
                        f"{api_host}/properties/{prop_id}/contact",
                        json={"contact_method": method},
                    )
                    if contact_resp.status_code == 201:
                        print(f"  ✓ Guest contacted via {method}")
                    else:
                        print(f"  ✗ Guest contact failed: {contact_resp.status_code} — {contact_resp.text}")

            time.sleep(0.05)  # 50 ms — avoids hammering rate limiter

    except KeyboardInterrupt:
        print(f"\nStopped after {iteration} iterations")
        print(f"Unique properties saved: {len(saved_ids)}")


def main():
    if not API_HOST:
        print("ERROR: API_HOST not set in .env")
        sys.exit(1)

    print(f"API: {API_HOST}\n")
    buyer_session = setup_buyer(API_HOST)
    property_ids = fetch_property_ids(buyer_session, API_HOST)
    seed_traffic(API_HOST, buyer_session, property_ids)


if __name__ == "__main__":
    main()