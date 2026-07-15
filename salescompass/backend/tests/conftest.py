import os

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["REDIS_URL"] = ""
os.environ["SECRET_KEY"] = "test-secret-key-for-salescompass-auth-tests"
