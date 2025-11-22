Synthetic recommender dataset
Generated on: 2025-11-22T05:34:13.848946

Files:
- users.csv: 1000 rows (user profiles and preferences)
- packages.csv: 500 rows (item/package metadata, includes a 16-d text_embedding as JSON string)
- events.csv: 20000 rows (append-only events: searches, views, clicks, bookings, ratings, messages)
- ranking_examples.csv: 20000 rows (training rows ready for a ranking model: user+package+context features + label)
Notes:
- Labels: booking -> 1.0, click -> 0.2, view -> 0.05, else 0.0
- Timestamps are distributed over the last ~180 days.
- Embeddings are random and illustrative; replace with SBERT/U-E embeddings for real experiments.
- Adjust NUM_USERS, NUM_PACKAGES, NUM_EVENTS parameters above to scale dataset sizes.
