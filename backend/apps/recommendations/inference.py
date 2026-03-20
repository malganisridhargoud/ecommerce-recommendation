# apps/recommendations/inference.py
import pickle
from pathlib import Path

MODEL_PATH = Path("recommend_model.pkl")

def load_model():
    if not MODEL_PATH.exists():
        return None
    with open(MODEL_PATH, "rb") as f:
        return pickle.load(f)

def recommend_for_equipment(equipment_id, top_n=5):
    model = load_model()
    if not model:
        return []
    df = model["df"]
    sim = model["similarity"]
    if equipment_id not in df["id"].values:
        return []
    idx = int(df[df["id"] == equipment_id].index[0])
    scores = list(enumerate(sim[idx]))
    scores = sorted(scores, key=lambda x: x[1], reverse=True)
    # skip self
    top = [df.iloc[i]["id"] for i, _ in scores if df.iloc[i]["id"] != equipment_id][:top_n]
    return top