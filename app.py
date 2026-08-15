"""
app.py
Flask web application for the LLM Prompt-Injection / Jailbreak Detector.

Run: python app.py
Then open: http://127.0.0.1:5000
"""

from flask import Flask, render_template, request, redirect, url_for
import sqlite3
import os
from datetime import datetime

from predict import predict_prompt

app = Flask(__name__)
DB_PATH = os.path.join(os.path.dirname(__file__), "logs.db")


# ---------------------------------------------------------
# Database setup
# ---------------------------------------------------------
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prompt TEXT NOT NULL,
            prediction TEXT NOT NULL,
            confidence REAL NOT NULL,
            patterns TEXT,
            timestamp TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def save_log(prompt, prediction, confidence, patterns):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO logs (prompt, prediction, confidence, patterns, timestamp) VALUES (?, ?, ?, ?, ?)",
        (prompt, prediction, confidence, ", ".join(patterns), datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
    )
    conn.commit()
    conn.close()


def get_logs(limit=25):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT prompt, prediction, confidence, patterns, timestamp FROM logs ORDER BY id DESC LIMIT ?", (limit,))
    rows = cur.fetchall()
    conn.close()
    return rows


# ---------------------------------------------------------
# Routes
# ---------------------------------------------------------
@app.route("/", methods=["GET", "POST"])
def index():
    result = None
    prompt_text = ""

    if request.method == "POST":
        prompt_text = request.form.get("prompt", "")
        result = predict_prompt(prompt_text)
        save_log(prompt_text, result["prediction"], result["confidence"], result["patterns"])

    return render_template("index.html", result=result, prompt_text=prompt_text)


@app.route("/logs")
def logs():
    rows = get_logs()
    return render_template("logs.html", rows=rows)


@app.route("/clear-logs", methods=["POST"])
def clear_logs():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("DELETE FROM logs")
    conn.commit()
    conn.close()
    return redirect(url_for("logs"))


if __name__ == "__main__":
    init_db()
    app.run(debug=True, host="0.0.0.0", port=5000)
