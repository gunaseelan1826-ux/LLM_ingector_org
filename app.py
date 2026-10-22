"""
app.py
Flask web application for the LLM Prompt-Injection / Jailbreak Detector.

Run: python app.py
Then open: http://127.0.0.1:5000
"""

from flask import Flask, render_template, request, redirect, url_for, jsonify
import os
import database
from predict import predict_prompt
from llm_client import query_llm

app = Flask(__name__)
database.init_db()

# ---------------------------------------------------------
# Routes
# ---------------------------------------------------------
@app.route("/", methods=["GET", "POST"])
def index():
    result = None
    prompt_text = ""
    ai_response = None

    if request.method == "POST":
        prompt_text = request.form.get("prompt", "")
        if prompt_text.strip():
            result = predict_prompt(prompt_text)
            database.save_log(prompt_text, result["prediction"], result["confidence"], result["patterns"])
            if result["prediction"] == "Safe":
                ai_response, _ = query_llm(prompt_text)

    return render_template("index.html", result=result, prompt_text=prompt_text, ai_response=ai_response)


@app.route("/api/analyze", methods=["POST"])
def api_analyze():
    data = request.get_json(silent=True) or request.form
    prompt_text = data.get("prompt", "").strip() if data else ""

    if not prompt_text:
        return jsonify({
            "error": "Empty prompt",
            "prediction": "Safe",
            "confidence": 0.0,
            "patterns": [],
            "blocked": False,
            "ai_response": None
        }), 400

    result = predict_prompt(prompt_text)
    database.save_log(prompt_text, result["prediction"], result["confidence"], result["patterns"])

    blocked = (result["prediction"] == "Dangerous")
    ai_response = None
    ai_error = None

    if not blocked:
        # Prompt is Safe: forward to LLM
        ai_response, ai_error = query_llm(prompt_text)

    return jsonify({
        "prediction": result["prediction"],
        "confidence": result["confidence"],
        "patterns": result["patterns"],
        "blocked": blocked,
        "ai_response": ai_response,
        "ai_error": ai_error
    })


@app.route("/api/stats", methods=["GET"])
def api_stats():
    stats = database.get_stats()
    return jsonify(stats)


@app.route("/logs")
def logs():
    rows = database.get_logs()
    return render_template("logs.html", rows=rows)


@app.route("/clear-logs", methods=["POST"])
def clear_logs():
    database.clear_logs()
    return redirect(url_for("logs"))


if __name__ == "__main__":
    database.init_db()
    app.run(debug=False, host="0.0.0.0", port=5000)
