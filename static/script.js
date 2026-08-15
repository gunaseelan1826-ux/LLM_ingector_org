let total = 0;
let safe = 0;
let dangerous = 0;

function analyzePrompt() {

    const input = document.getElementById("prompt");
    const prompt = input.value.trim();

    if (prompt === "") {
        alert("Please enter a prompt.");
        return;
    }

    total++;

    /*
       Demo rule detection.

       Your backend will eventually return:
       - prediction
       - confidence
       - matched_patterns
    */

    const patterns = [];

    const rules = [
        {
            text: "ignore previous instructions",
            name: "Instruction Override"
        },
        {
            text: "ignore all previous",
            name: "Instruction Override"
        },
        {
            text: "developer mode",
            name: "Developer Mode"
        },
        {
            text: "system prompt",
            name: "System Prompt Extraction"
        },
        {
            text: "jailbreak",
            name: "Jailbreak Attempt"
        },
        {
            text: "DAN",
            name: "DAN Persona"
        }
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
        confidence = Math.min(
            98,
            75 + patterns.length * 6
        );
    } else {
        safe++;
        confidence = 95;
    }


    updateStatistics();

    showResult(
        isDangerous,
        confidence,
        patterns
    );

    addLog(
        prompt,
        isDangerous,
        confidence
    );
}


function showResult(isDangerous, confidence, patterns) {

    const card =
        document.getElementById("resultCard");

    const title =
        document.getElementById("resultTitle");

    const icon =
        document.getElementById("resultIcon");

    const progress =
        document.getElementById("progressBar");

    const confidenceText =
        document.getElementById("confidence");

    const patternList =
        document.getElementById("patternList");

    const warning =
        document.getElementById("warning");


    card.classList.remove("hidden");

    confidenceText.textContent =
        confidence + "%";

    progress.style.width =
        confidence + "%";


    if (isDangerous) {
        showDangerStamp();
        title.textContent = "Dangerous Prompt";

        title.className = "danger";

        icon.textContent = "⚠";

        icon.style.background = "#fff0f0";
        icon.style.color = "#d64545";

        warning.classList.remove("hidden");

        patternList.innerHTML =
            patterns
                .map(p => "⚠ " + p)
                .join("<br>");

    } else {

        title.textContent = "Safe Prompt";

        title.className = "safe";

        icon.textContent = "✓";

        icon.style.background = "#dff8ed";
        icon.style.color = "#159570";

        warning.classList.add("hidden");

        patternList.textContent =
            "✓ No suspicious patterns detected.";

    }
}


function addLog(prompt, isDangerous, confidence) {

    const table =
        document.getElementById("logsTable");

    const empty =
        table.querySelector(".empty");

    if (empty) {
        table.innerHTML = "";
    }


    const row =
        document.createElement("tr");

    const result =
        isDangerous
            ? '<span class="danger">DANGEROUS</span>'
            : '<span class="safe">SAFE</span>';

    const time =
        new Date().toLocaleTimeString();


    row.innerHTML = `
        <td>
            ${escapeHTML(
                prompt.substring(0, 60)
            )}
        </td>

        <td>${result}</td>

        <td>${confidence}%</td>

        <td>${time}</td>
    `;

    table.prepend(row);
}


function updateStatistics() {

    document.getElementById("totalCount")
        .textContent = total;

    document.getElementById("safeCount")
        .textContent = safe;

    document.getElementById("dangerCount")
        .textContent = dangerous;
}


function clearPrompt() {

    document.getElementById("prompt")
        .value = "";

    document.getElementById("resultCard")
        .classList.add("hidden");
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

    const stamp =
        document.getElementById("dangerStamp");

    // Restart animation
    stamp.classList.remove("show");

    void stamp.offsetWidth;

    stamp.classList.add("show");

    // Remove after animation
    setTimeout(() => {
        stamp.classList.remove("show");
    }, 1200);
}