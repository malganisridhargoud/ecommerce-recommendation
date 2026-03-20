from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from django.db.models import Count
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from apps.bookings.models import Booking, BookingStatus
from apps.equipment.models import Equipment


ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "recommendation_model.joblib"


def _equipment_frame():
    rows = list(
        Equipment.objects.filter(is_active=True).values(
            "id",
            "name",
            "description",
            "category",
            "tags",
            "specifications",
            "location",
            "price_per_day",
            "booking_count",
            "views_count",
        )
    )
    return pd.DataFrame(rows)


def _booking_frame():
    rows = list(
        Booking.objects.exclude(status=BookingStatus.CANCELLED)
        .values("user_id", "equipment_id")
        .distinct()
    )
    return pd.DataFrame(rows)


def train_recommendation_model():
    equipment_df = _equipment_frame()
    if equipment_df.empty:
        raise ValueError("No active equipment available to train recommendations.")

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    equipment_df["description"] = equipment_df["description"].fillna("")
    equipment_df["tags"] = equipment_df["tags"].fillna("")
    equipment_df["location"] = equipment_df["location"].fillna("")
    equipment_df["specifications"] = equipment_df["specifications"].fillna({})
    equipment_df["spec_text"] = equipment_df["specifications"].apply(
        lambda d: " ".join([f"{k} {v}" for k, v in d.items()]) if isinstance(d, dict) else ""
    )
    equipment_df["text"] = (
        equipment_df["name"].astype(str)
        + " "
        + equipment_df["category"].astype(str)
        + " "
        + equipment_df["description"].astype(str)
        + " "
        + equipment_df["tags"].astype(str)
        + " "
        + equipment_df["spec_text"].astype(str)
        + " "
        + equipment_df["location"].astype(str)
    )

    vectorizer = TfidfVectorizer(stop_words="english")
    content_matrix = vectorizer.fit_transform(equipment_df["text"])
    content_similarity = cosine_similarity(content_matrix)

    bookings_df = _booking_frame()
    collaborative_similarity = None
    item_ids_for_collab = []
    user_item_dict = {}
    if not bookings_df.empty:
        user_item = pd.crosstab(bookings_df["user_id"], bookings_df["equipment_id"])
        item_user = user_item.T
        collaborative_similarity = cosine_similarity(item_user)
        item_ids_for_collab = list(user_item.columns)
        user_item_dict = user_item.to_dict()

    artifact = {
        "equipment_ids": equipment_df["id"].tolist(),
        "content_similarity": content_similarity,
        "collaborative_similarity": collaborative_similarity,
        "item_ids_for_collab": item_ids_for_collab,
        "user_item": user_item_dict,
    }
    joblib.dump(artifact, MODEL_PATH)
    return {
        "trained": True,
        "equipment_count": len(equipment_df),
        "booking_signals": 0 if bookings_df.empty else len(bookings_df),
        "model_path": str(MODEL_PATH),
    }


def load_model():
    if not MODEL_PATH.exists():
        return None
    return joblib.load(MODEL_PATH)


def _popular_equipment(top_n=5, exclude_ids=None):
    exclude_ids = set(exclude_ids or [])
    rows = (
        Booking.objects.exclude(status=BookingStatus.CANCELLED)
        .values("equipment_id")
        .annotate(count=Count("id"))
        .order_by("-count")
    )
    ids = [row["equipment_id"] for row in rows if row["equipment_id"] not in exclude_ids]
    if len(ids) < top_n:
        popularity = list(
            Equipment.objects.filter(is_active=True)
            .exclude(id__in=exclude_ids)
            .order_by("-booking_count", "-views_count")
            .values_list("id", flat=True)
        )
        ids.extend([eid for eid in popularity if eid not in ids])
    if len(ids) < top_n:
        fallback = list(
            Equipment.objects.filter(is_active=True).exclude(id__in=exclude_ids).values_list("id", flat=True)
        )
        ids.extend([eid for eid in fallback if eid not in ids])
    return ids[:top_n]


def get_similar_equipment(equipment_id, top_n=5):
    model = load_model()
    if model is None:
        train_recommendation_model()
        model = load_model()

    equipment_ids = model["equipment_ids"]
    if equipment_id not in equipment_ids:
        return _popular_equipment(top_n=top_n)

    idx = equipment_ids.index(equipment_id)
    content_scores = model["content_similarity"][idx]
    final_scores = np.array(content_scores, dtype=float)

    collab_sim = model.get("collaborative_similarity")
    collab_item_ids = model.get("item_ids_for_collab", [])
    if collab_sim is not None and equipment_id in collab_item_ids:
        collab_idx = collab_item_ids.index(equipment_id)
        for target_idx, target_equipment_id in enumerate(equipment_ids):
            if target_equipment_id in collab_item_ids:
                item_idx = collab_item_ids.index(target_equipment_id)
                final_scores[target_idx] = 0.7 * content_scores[target_idx] + 0.3 * collab_sim[collab_idx][item_idx]

    ranked = np.argsort(final_scores)[::-1]
    result = []
    for rank_idx in ranked:
        candidate_id = equipment_ids[rank_idx]
        if candidate_id != equipment_id:
            result.append(candidate_id)
        if len(result) >= top_n:
            break
    return result


def get_user_recommendations(user_id, top_n=5):
    model = load_model()
    if model is None:
        try:
            train_recommendation_model()
            model = load_model()
        except ValueError:
            return []

    equipment_ids = model["equipment_ids"]
    booked_ids = list(
        Booking.objects.filter(user_id=user_id)
        .exclude(status=BookingStatus.CANCELLED)
        .values_list("equipment_id", flat=True)
        .distinct()
    )

    if not booked_ids:
        return _popular_equipment(top_n=top_n)

    score = np.zeros(len(equipment_ids), dtype=float)
    for equipment_id in booked_ids:
        if equipment_id in equipment_ids:
            idx = equipment_ids.index(equipment_id)
            score += model["content_similarity"][idx]

    for booked in booked_ids:
        if booked in equipment_ids:
            score[equipment_ids.index(booked)] = -1

    ranked = np.argsort(score)[::-1]
    recs = [equipment_ids[i] for i in ranked if score[i] >= 0][:top_n]
    if len(recs) < top_n:
        supplement = _popular_equipment(top_n=top_n, exclude_ids=set(booked_ids) | set(recs))
        recs.extend([eid for eid in supplement if eid not in recs])
    return recs[:top_n]
