(function () {
    var currentQuestion = 0;
    var answers = {};

    function initLC() {
        if (typeof LC_APP_ID === 'undefined' || LC_APP_ID === 'YOUR_LC_APP_ID') {
            return false;
        }
        AV.init({ appId: LC_APP_ID, appKey: LC_APP_KEY });
        return true;
    }

    function init() {
        document.getElementById("total-questions").textContent = SURVEY_QUESTIONS.length;
        document.getElementById("progress-total").textContent = SURVEY_QUESTIONS.length;
        var estimatedMin = Math.max(2, Math.ceil(SURVEY_QUESTIONS.length * 0.5));
        document.getElementById("estimated-time").textContent = estimatedMin;
    }

    function showPage(pageId) {
        var pages = document.querySelectorAll(".page");
        pages.forEach(function (p) { p.classList.remove("active"); });
        document.getElementById(pageId).classList.add("active");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function renderQuestion(index) {
        var q = SURVEY_QUESTIONS[index];
        var container = document.getElementById("questions-container");
        var html = "";

        if (q.section) {
            html += '<div class="section-header"><span class="section-line"></span><span class="section-text">' + q.section + '</span><span class="section-line"></span></div>';
        }

        html += '<div class="question-card" id="qcard-' + q.id + '">';
        html += '<div class="question-title">';
        html += '<span class="q-num">' + (index + 1) + '.</span>';
        html += '<span>' + q.title + "</span>";
        if (q.required) html += '<span class="required">*</span>';
        html += "</div>";

        if (q.type === "radio") {
            html += '<div class="option-group">';
            q.options.forEach(function (opt) {
                var checked = answers[q.id] === opt ? " selected" : "";
                html += '<div class="option-item' + checked + '" onclick="window._selectRadio(\'' + q.id + '\',this)" data-value="' + escapeAttr(opt) + '">';
                html += '<input type="radio" name="' + q.id + '" value="' + escapeAttr(opt) + '"' + (answers[q.id] === opt ? " checked" : "") + ">";
                html += "<label>" + opt + "</label>";
                html += "</div>";
            });
            if (q.hasOther) {
                var otherVal = answers[q.id + "_other"] || "";
                var otherSelected = answers[q.id] === "__other__" ? " selected" : "";
                html += '<div class="option-item option-other' + otherSelected + '" onclick="window._selectRadioOther(\'' + q.id + '\',this)" data-value="__other__">';
                html += '<input type="radio" name="' + q.id + '" value="__other__"' + (answers[q.id] === "__other__" ? " checked" : "") + ">";
                html += "<label>\u5176\u4ed6</label>";
                html += '<input type="text" class="other-text-input" id="other-' + q.id + '" value="' + escapeAttr(otherVal) + '" placeholder="\u8bf7\u586b\u5199" onclick="event.stopPropagation()" oninput="window._inputOther(\'' + q.id + '\', this.value)">';
                html += "</div>";
            }
            html += "</div>";
        } else if (q.type === "checkbox") {
            html += '<div class="option-group">';
            var currentVals = answers[q.id] || [];
            q.options.forEach(function (opt) {
                var checked = currentVals.indexOf(opt) >= 0 ? " selected" : "";
                html += '<div class="option-item' + checked + '" onclick="window._toggleCheckbox(\'' + q.id + '\',this)" data-value="' + escapeAttr(opt) + '">';
                html += '<input type="checkbox" name="' + q.id + '" value="' + escapeAttr(opt) + '"' + (currentVals.indexOf(opt) >= 0 ? " checked" : "") + ">";
                html += "<label>" + opt + "</label>";
                html += "</div>";
            });
            if (q.hasOther) {
                var otherVals = answers[q.id] || [];
                var otherSelected = otherVals.indexOf("__other__") >= 0 ? " selected" : "";
                var otherTextVal = answers[q.id + "_other"] || "";
                html += '<div class="option-item option-other' + otherSelected + '" onclick="window._toggleCheckboxOther(\'' + q.id + '\',this)" data-value="__other__">';
                html += '<input type="checkbox" name="' + q.id + '" value="__other__"' + (otherSelected ? " checked" : "") + ">";
                html += "<label>\u5176\u4ed6</label>";
                html += '<input type="text" class="other-text-input" id="other-' + q.id + '" value="' + escapeAttr(otherTextVal) + '" placeholder="\u8bf7\u586b\u5199" onclick="event.stopPropagation()" oninput="window._inputOther(\'' + q.id + '\', this.value)">';
                html += "</div>";
            }
            html += "</div>";
        } else if (q.type === "text") {
            html += '<input type="text" class="text-input" id="input-' + q.id + '" value="' + escapeAttr(answers[q.id] || "") + '"';
            if (q.placeholder) html += ' placeholder="' + escapeAttr(q.placeholder) + '"';
            html += ' oninput="window._inputAnswer(\'' + q.id + '\', this.value)">';
        } else if (q.type === "textarea") {
            html += '<textarea class="textarea-input" id="input-' + q.id + '" oninput="window._inputAnswer(\'' + q.id + '\', this.value)"';
            if (q.placeholder) html += ' placeholder="' + escapeAttr(q.placeholder) + '"';
            html += ">" + (answers[q.id] || "") + "</textarea>";
        } else if (q.type === "rating") {
            var maxR = q.maxRating || 5;
            var curRating = answers[q.id] || 0;
            html += '<div class="rating-group">';
            for (var i = 1; i <= maxR; i++) {
                var activeClass = i <= curRating ? " active" : "";
                html += '<span class="rating-star' + activeClass + '" data-value="' + i + '" onclick="window._setRating(\'' + q.id + '\',' + i + ')">\u2605</span>';
            }
            html += "</div>";
        }

        html += '<div class="error-msg">\u6b64\u9879\u4e3a\u5fc5\u586b\u9879\uff0c\u8bf7\u4f5c\u7b54</div>';
        html += "</div>";
        container.innerHTML = html;

        document.getElementById("progress-current").textContent = index + 1;
        var pct = ((index + 1) / SURVEY_QUESTIONS.length) * 100;
        document.getElementById("progress-fill").style.width = pct + "%";

        document.getElementById("btn-prev").style.display = index === 0 ? "none" : "";
        var isLast = index === SURVEY_QUESTIONS.length - 1;
        document.getElementById("btn-next").style.display = isLast ? "none" : "";
        document.getElementById("btn-submit").style.display = isLast ? "" : "none";

        var card = document.getElementById("qcard-" + q.id);
        if (card) card.classList.remove("error");
    }

    function escapeAttr(s) {
        return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    window._selectRadio = function (qid, el) {
        var value = el.getAttribute("data-value");
        answers[qid] = value;
        var card = document.getElementById("qcard-" + qid);
        card.classList.remove("error");
        var items = card.querySelectorAll(".option-item");
        items.forEach(function (item) { item.classList.remove("selected"); item.querySelector("input").checked = false; });
        el.classList.add("selected");
        el.querySelector("input").checked = true;
    };

    window._selectRadioOther = function (qid, el) {
        answers[qid] = "__other__";
        var card = document.getElementById("qcard-" + qid);
        card.classList.remove("error");
        var items = card.querySelectorAll(".option-item");
        items.forEach(function (item) { item.classList.remove("selected"); item.querySelector("input").checked = false; });
        el.classList.add("selected");
        el.querySelector("input").checked = true;
        setTimeout(function () { var input = document.getElementById("other-" + qid); if (input) input.focus(); }, 50);
    };

    window._toggleCheckbox = function (qid, el) {
        var value = el.getAttribute("data-value");
        if (!answers[qid]) answers[qid] = [];
        var idx = answers[qid].indexOf(value);
        if (idx >= 0) { answers[qid].splice(idx, 1); el.classList.remove("selected"); el.querySelector("input").checked = false; }
        else { answers[qid].push(value); el.classList.add("selected"); el.querySelector("input").checked = true; }
        var card = document.getElementById("qcard-" + qid);
        if (answers[qid].length > 0) card.classList.remove("error");
    };

    window._toggleCheckboxOther = function (qid, el) {
        if (!answers[qid]) answers[qid] = [];
        var idx = answers[qid].indexOf("__other__");
        if (idx >= 0) { answers[qid].splice(idx, 1); el.classList.remove("selected"); el.querySelector("input").checked = false; }
        else { answers[qid].push("__other__"); el.classList.add("selected"); el.querySelector("input").checked = true; setTimeout(function () { var input = document.getElementById("other-" + qid); if (input) input.focus(); }, 50); }
        var card = document.getElementById("qcard-" + qid);
        if (answers[qid].length > 0) card.classList.remove("error");
    };

    window._inputOther = function (qid, value) { answers[qid + "_other"] = value; };
    window._inputAnswer = function (qid, value) { answers[qid] = value; var card = document.getElementById("qcard-" + qid); if (value.trim()) card.classList.remove("error"); };

    window._setRating = function (qid, value) {
        answers[qid] = value;
        var card = document.getElementById("qcard-" + qid);
        card.classList.remove("error");
        card.querySelectorAll(".rating-star").forEach(function (star) { var v = parseInt(star.getAttribute("data-value")); if (v <= value) star.classList.add("active"); else star.classList.remove("active"); });
    };

    function validateQuestion(index) {
        var q = SURVEY_QUESTIONS[index];
        if (!q.required) return true;
        var card = document.getElementById("qcard-" + q.id);
        var val = answers[q.id];
        var valid = true;
        if (q.type === "radio" || q.type === "rating") { valid = !!val; }
        else if (q.type === "checkbox") { valid = val && val.length > 0; }
        else if (q.type === "text" || q.type === "textarea") { valid = val && val.trim().length > 0; }
        if (!valid) card.classList.add("error"); else card.classList.remove("error");
        return valid;
    }

    function resolveAnswerForStorage(qid, q) {
        var val = answers[qid];
        if (q.hasOther) {
            var otherText = answers[qid + "_other"] || "";
            if (q.type === "radio") {
                if (val === "__other__") return "\u5176\u4ed6\uff1a" + (otherText || "\uff08\u672a\u586b\u5199\uff09");
                return val;
            } else if (q.type === "checkbox") {
                if (!val) return val;
                return val.map(function (v) { if (v === "__other__") return "\u5176\u4ed6\uff1a" + (otherText || "\uff08\u672a\u586b\u5199\uff09"); return v; });
            }
        }
        return val;
    }

    window.startSurvey = function () { currentQuestion = 0; answers = {}; showPage("page-survey"); renderQuestion(0); };
    window.nextQuestion = function () { if (!validateQuestion(currentQuestion)) return; if (currentQuestion < SURVEY_QUESTIONS.length - 1) { currentQuestion++; renderQuestion(currentQuestion); } };
    window.prevQuestion = function () { if (currentQuestion > 0) { currentQuestion--; renderQuestion(currentQuestion); } };

    window.submitSurvey = async function () {
        for (var i = 0; i < SURVEY_QUESTIONS.length; i++) { if (!validateQuestion(i)) { currentQuestion = i; renderQuestion(i); return; } }

        if (!initLC()) { alert('\u8bf7\u5148\u914d\u7f6e LeanCloud\uff0c\u8be6\u89c1 leancloud-config.js'); return; }

        var storedAnswers = {};
        SURVEY_QUESTIONS.forEach(function (q) { storedAnswers[q.id] = resolveAnswerForStorage(q.id, q); });

        var btn = document.getElementById("btn-submit");
        btn.disabled = true;
        btn.textContent = "\u63d0\u4ea4\u4e2d...";

        try {
            var Response = AV.Object.extend("Response");
            var obj = new Response();
            obj.set("answers", storedAnswers);
            obj.set("submittedAt", new Date());
            await obj.save();
            showPage("page-thanks");
        } catch (err) {
            alert("\u63d0\u4ea4\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u7f51\u7edc\u540e\u91cd\u8bd5\uff1a" + (err.message || err));
        } finally {
            btn.disabled = false;
            btn.textContent = "\u63d0\u4ea4\u95ee\u5377";
        }
    };

    window.fillAgain = function () { startSurvey(); };
    init();
})();
