"""
train.py
Trains a TF-IDF + Logistic Regression classifier to detect
LLM prompt injection / jailbreak attempts.

Run: python train.py
Produces: model.pkl, vectorizer.pkl
"""

import pandas as pd
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

# ---------------------------------------------------------
# 1. Load dataset
# ---------------------------------------------------------
df = pd.read_csv("dataset.csv")
df = df.dropna()
print(f"Loaded {len(df)} rows | Dangerous: {sum(df.label==1)} | Safe: {sum(df.label==0)}")

X = df["text"]
y = df["label"]

# ---------------------------------------------------------
# 2. Train/test split
# ---------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ---------------------------------------------------------
# 3. TF-IDF Vectorization
# ---------------------------------------------------------
vectorizer = TfidfVectorizer(
    ngram_range=(1, 2),
    max_features=3000,
    stop_words="english",
    lowercase=True,
)
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# ---------------------------------------------------------
# 4. Train classifier
# ---------------------------------------------------------
model = LogisticRegression(max_iter=1000, class_weight="balanced")
model.fit(X_train_vec, y_train)

# ---------------------------------------------------------
# 5. Evaluate
# ---------------------------------------------------------
y_pred = model.predict(X_test_vec)
acc = accuracy_score(y_test, y_pred)
print(f"\nTest Accuracy: {acc*100:.2f}%\n")
print("Classification Report:")
print(classification_report(y_test, y_pred, target_names=["Safe", "Dangerous"]))
print("Confusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# ---------------------------------------------------------
# 6. Save model + vectorizer
# ---------------------------------------------------------
with open("model.pkl", "wb") as f:
    pickle.dump(model, f)

with open("vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)

print("\nSaved model.pkl and vectorizer.pkl")
