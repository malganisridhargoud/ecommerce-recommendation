# apps/recommendations/train_model.py
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd
from apps.bookings.models import Booking
from apps.equipment.models import Equipment
from django.db.models import F

def build_and_store_model():
    # Build a DataFrame of equipment_id and category and name
    equipments = Equipment.objects.all().values("id", "name", "category")
    df = pd.DataFrame(equipments)
    if df.empty:
        return

    # For a simple content-based recommender, use category + name text
    df["text"] = df["category"] + " " + df["name"]
    vectorizer = TfidfVectorizer()
    X = vectorizer.fit_transform(df["text"].values.astype('U'))
    # store both vectorizer, df and similarity matrix as pickles
    similarity = cosine_similarity(X)
    with open("recommend_model.pkl", "wb") as f:
        pickle.dump({
            "df": df,
            "vectorizer": vectorizer,
            "similarity": similarity
        }, f)