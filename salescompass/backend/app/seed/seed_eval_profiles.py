from app.services.demo_market_data import list_demo_profiles


def main() -> None:
    for profile in list_demo_profiles():
        print(f"{profile['key']}: {profile['label']}")


if __name__ == "__main__":
    main()

