let total = 0;
let safe = 0;
let dangerous = 0;

async function analyzePrompt() {
    const input = document.getElementById("prompt");
    const prompt = input.value.trim();

    if (prompt === "") {
        alert("Please enter a prompt.");
        return;
    }

    const btn = document.getElementById("analyzeBtn");
    if (btn) {
        btn.disabled = true;
        btn.innerText = "Analyzing...";
    }

    try {
        const response = await fetch("/api/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt: prompt })
        });

        if (!response.ok) {
            throw new Error("API request failed with status " + response.status);
        }

        const data = await response.json();
        const isDangerous = (data.prediction === "Dangerous");
        const confidence = data.confidence;
        const patterns = data.patterns || [];

        total++;
        if (isDangerous) {
            dangerous++;
        } else {
            safe++;
        }

        updateStatistics();
        showResult(isDangerous, confidence, patterns, data.ai_response, data.ai_error);
        addLog(prompt, isDangerous, confidence);

    } catch (error) {
        console.warn("Backend API failed, running offline fallback:", error);
        runFallbackDetection(prompt);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = "Analyze Prompt";
        }
    }
}

function runFallbackDetection(prompt) {
    total++;
    const patterns = [];
    const rules = [
        { text: "ignore previous instructions", name: "Instruction Override" },
        { text: "ignore all previous", name: "Instruction Override" },
        { text: "developer mode", name: "Developer Mode" },
        { text: "system prompt", name: "System Prompt Extraction" },
        { text: "jailbreak", name: "Jailbreak Attempt" },
        { text: "DAN", name: "DAN Persona" },
        { text: "hack", name: "Security Bypass" },
        { text: "bank account", name: "Financial Fraud" },
        { text: "bypass security", name: "Security Bypass" }
    ];

    const lowerPrompt = prompt.toLowerCase();
    rules.forEach(rule => {
        if (lowerPrompt.includes(rule.text.toLowerCase())) {
            patterns.push(rule.name);
        }
    });

    const isDangerous = patterns.length > 0;
    let confidence;
    if (isDangerous) {
        dangerous++;
        confidence = Math.min(98, 75 + patterns.length * 6);
    } else {
        safe++;
        confidence = 92;
    }

    updateStatistics();
    showResult(isDangerous, confidence, patterns, null, null);
    addLog(prompt, isDangerous, confidence);
}

function showResult(isDangerous, confidence, patterns, aiResponse, aiError) {
    const card = document.getElementById("resultCard");
    const title = document.getElementById("resultTitle");
    const icon = document.getElementById("resultIcon");
    const progress = document.getElementById("progressBar");
    const confidenceText = document.getElementById("confidence");
    const patternList = document.getElementById("patternList");
    const warning = document.getElementById("warning");
    const aiBox = document.getElementById("aiResponseContainer");
    const aiText = document.getElementById("aiResponseText");

    card.classList.remove("hidden");
    confidenceText.textContent = confidence + "%";
    progress.style.width = confidence + "%";

    if (isDangerous) {
        showDangerStamp();
        title.textContent = "Dangerous Prompt";
        title.className = "danger";
        icon.textContent = "!";
        icon.className = "result-icon danger";
        warning.classList.remove("hidden");

        if (aiBox) aiBox.classList.add("hidden");

        if (patterns && patterns.length > 0) {
            patternList.innerHTML = patterns.map(p => "&#9888; " + escapeHTML(p)).join("<br>");
        } else {
            patternList.innerHTML = "&#9888; Suspicious semantic pattern identified by ML classifier.";
        }
    } else {
        title.textContent = "Safe Prompt";
        title.className = "safe";
        icon.textContent = "\u2713";
        icon.className = "result-icon safe";
        warning.classList.add("hidden");
        patternList.textContent = "\u2713 No suspicious patterns detected.";

        if (aiBox && aiText) {
            if (aiResponse) {
                aiBox.classList.remove("hidden");
                aiText.textContent = aiResponse;
            } else if (aiError) {
                aiBox.classList.remove("hidden");
                aiText.innerHTML = `<em style="color: var(--muted);">${escapeHTML(aiError)}</em>`;
            } else {
                aiBox.classList.add("hidden");
            }
        }
    }
}

function addLog(prompt, isDangerous, confidence) {
    const table = document.getElementById("logsTable");
    const empty = table.querySelector(".empty");
    if (empty) {
        table.innerHTML = "";
    }

    const row = document.createElement("tr");
    const result = isDangerous
        ? '<span class="danger">DANGEROUS</span>'
        : '<span class="safe">SAFE</span>';
    const time = new Date().toLocaleTimeString();

    row.innerHTML = `
        <td>${escapeHTML(prompt.substring(0, 60))}</td>
        <td>${result}</td>
        <td>${confidence}%</td>
        <td>${time}</td>
    `;
    table.prepend(row);
}

function updateStatistics() {
    document.getElementById("totalCount").textContent = total;
    document.getElementById("safeCount").textContent = safe;
    document.getElementById("dangerCount").textContent = dangerous;
}

function clearPrompt() {
    document.getElementById("prompt").value = "";
    document.getElementById("resultCard").classList.add("hidden");
    const aiBox = document.getElementById("aiResponseContainer");
    if (aiBox) aiBox.classList.add("hidden");
}

function clearLogs() {
    document.getElementById("logsTable").innerHTML = `
        <tr>
            <td colspan="4" class="empty">
                No analysis performed yet.
            </td>
        </tr>
    `;
    total = 0;
    safe = 0;
    dangerous = 0;
    updateStatistics();
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function showDangerStamp() {
    const stamp = document.getElementById("dangerStamp");
    if (!stamp) return;
    stamp.classList.remove("show");
    void stamp.offsetWidth;
    stamp.classList.add("show");
    setTimeout(() => {
        stamp.classList.remove("show");
    }, 1200);
}
