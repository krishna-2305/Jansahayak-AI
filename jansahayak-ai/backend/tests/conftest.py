import os

TEST_DATABASE_PATH = "/tmp/jansahayak-test.db"

if os.path.exists(TEST_DATABASE_PATH):
    os.remove(TEST_DATABASE_PATH)

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DATABASE_PATH}"
