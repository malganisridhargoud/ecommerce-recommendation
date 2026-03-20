import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MultiLabelBinarizer
from apps.equipment.models import Equipment
from apps.bookings.models import Booking


def get_content_based_recommendations(equipment_id: int, top_n: int = 5) -> list:
    """
    Content-based filtering using category and price similarity.
    Returns list of Equipment IDs similar to the given one.
    """
    equipment_qs = Equipment.objects.filter(is_active=True).values(
        "id", "category", "price_per_day"
    )
    if not equipment_qs:
        return []

    df = pd.DataFrame(list(equipment_qs))

    # One-hot encode categories
    mlb = MultiLabelBinarizer()
    category_encoded = mlb.fit_transform(df["category"].apply(lambda x: [x]))
    category_df = pd.DataFrame(category_encoded, columns=mlb.classes_, index=df["id"])

    # Normalise price (min-max)
    price = df.set_index("id")["price_per_day"].astype(float)
    price_range = price.max() - price.min()
    if price_range == 0:
        price_norm = price * 0
    else:
        price_norm = (price - price.min()) / price_range

    feature_df = category_df.copy()
    feature_df["price"] = price_norm

    if equipment_id not in feature_df.index:
        return []

    sim_matrix = cosine_similarity(feature_df)
    sim_df = pd.DataFrame(sim_matrix, index=feature_df.index, columns=feature_df.index)

    similar = (
        sim_df[equipment_id]
        .drop(equipment_id)
        .sort_values(ascending=False)
        .head(top_n)
    )
    return similar.index.tolist()


def get_collaborative_recommendations(user_id: str, top_n: int = 5) -> list:
    """
    Collaborative filtering: find users with similar booking history,
    then recommend equipment they booked that the current user hasn't.
    """
    bookings = list(
        Booking.objects.exclude(status="cancelled")
        .values("user_id", "equipment_id")
        .distinct()
    )
    if not bookings:
        return []

    df = pd.DataFrame(bookings)
    user_item = pd.crosstab(df["user_id"], df["equipment_id"])

    if user_id not in user_item.index:
        # Cold start: return most-booked equipment
        popular = df["equipment_id"].value_counts().head(top_n).index.tolist()
        return popular

    user_sim = cosine_similarity(user_item)
    user_sim_df = pd.DataFrame(user_sim, index=user_item.index, columns=user_item.index)

    similar_users = (
        user_sim_df[user_id].drop(user_id).sort_values(ascending=False).head(10).index.tolist()
    )

    current_bookings = set(df[df["user_id"] == user_id]["equipment_id"].tolist())
    candidate_scores = {}

    for sim_user in similar_users:
        sim_score = user_sim_df.loc[user_id, sim_user]
        sim_user_items = set(df[df["user_id"] == sim_user]["equipment_id"].tolist())
        new_items = sim_user_items - current_bookings
        for item in new_items:
            candidate_scores[item] = candidate_scores.get(item, 0) + sim_score

    ranked = sorted(candidate_scores.items(), key=lambda x: x[1], reverse=True)
    return [item_id for item_id, _ in ranked[:top_n]]