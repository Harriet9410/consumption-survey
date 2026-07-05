(function () {
    var STORAGE_KEY = "survey_responses";
    var currentQuestion = 0;
    var answers = {};

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
            q.options.forEach(function (opt, i) {
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
                html += "<label>其他</label>";
                html += '<input type="text" class="other-text-input" id="other-' + q.id + '" value="' + escapeAttr(otherVal) + '" placeholder="请填写" onclick="event.stopPropagation()" oninput="window._inputOther(\'' + q.id + '\', this.value)">';
                html += "</div>";
            }
            html += "</div>";
        } else if (q.type === "checkbox") {
            html += '<div class="option-group">';
            var currentVals = answers[q.id] || [];
            q.options.forEach(function (opt, i) {
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
                html += "<label>其他</label>";
                html += '<input type="text" class="other-text-input" id="other-' + q.id + '" value="' + escapeAttr(otherTextVal) + '" placeholder="请填写" onclick="event.stopPropagation()" oninput="window._inputOther(\'' + q.id + '\', this.value)">';
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
                html += '<span class="rating-star' + activeClass + '" data-value="' + i + '" onclick="window._setRating(\'' + q.id + '\',' + i + ')">★</span>';
            }
            html += "</div>";
        }

        html += '<div class="error-msg">此项为必填项，请作答</div>';
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
        setTimeout(function () {
            var input = document.getElementById("other-" + qid);
            if (input) input.focus();
        }, 50);
    };

    window._toggleCheckbox = function (qid, el) {
        var value = el.getAttribute("data-value");
        if (!answers[qid]) answers[qid] = [];
        var idx = answers[qid].indexOf(value);
        if (idx >= 0) {
            answers[qid].splice(idx, 1);
            el.classList.remove("selected");
            el.querySelector("input").checked = false;
        } else {
            answers[qid].push(value);
            el.classList.add("selected");
            el.querySelector("input").checked = true;
        }
        var card = document.getElementById("qcard-" + qid);
        if (answers[qid].length > 0) card.classList.remove("error");
    };

    window._toggleCheckboxOther = function (qid, el) {
        if (!answers[qid]) answers[qid] = [];
        var idx = answers[qid].indexOf("__other__");
        if (idx >= 0) {
            answers[qid].splice(idx, 1);
            el.classList.remove("selected");
            el.querySelector("input").checked = false;
        } else {
            answers[qid].push("__other__");
            el.classList.add("selected");
            el.querySelector("input").checked = true;
            setTimeout(function () {
                var input = document.getElementById("other-" + qid);
                if (input) input.focus();
            }, 50);
        }
        var card = document.getElementById("qcard-" + qid);
        if (answers[qid].length > 0) card.classList.remove("error");
    };

    window._inputOther = function (qid, value) {
        answers[qid + "_other"] = value;
    };

    window._inputAnswer = function (qid, value) {
        answers[qid] = value;
        var card = document.getElementById("qcard-" + qid);
        if (value.trim()) card.classList.remove("error");
    };

    window._setRating = function (qid, value) {
        answers[qid] = value;
        var card = document.getElementById("qcard-" + qid);
        card.classList.remove("error");
        var stars = card.querySelectorAll(".rating-star");
        stars.forEach(function (star) {
            var v = parseInt(star.getAttribute("data-value"));
            if (v <= value) star.classList.add("active");
            else star.classList.remove("active");
        });
    };

    function validateQuestion(index) {
        var q = SURVEY_QUESTIONS[index];
        if (!q.required) return true;
        var card = document.getElementById("qcard-" + q.id);
        var val = answers[q.id];
        var valid = true;

        if (q.type === "radio" || q.type === "rating") {
            valid = !!val;
        } else if (q.type === "checkbox") {
            valid = val && val.length > 0;
        } else if (q.type === "text" || q.type === "textarea") {
            valid = val && val.trim().length > 0;
        }

        if (!valid) {
            card.classList.add("error");
        } else {
            card.classList.remove("error");
        }
        return valid;
    }

    function resolveAnswerForStorage(qid, q) {
        var val = answers[qid];
        if (q.hasOther) {
            var otherText = answers[qid + "_other"] || "";
            if (q.type === "radio") {
                if (val === "__other__") return "其他：" + (otherText || "（未填写）");
                return val;
            } else if (q.type === "checkbox") {
                if (!val) return val;
                return val.map(function (v) {
                    if (v === "__other__") return "其他：" + (otherText || "（未填写）");
                    return v;
                });
            }
        }
        return val;
    }

    window.startSurvey = function () {
        currentQuestion = 0;
        answers = {};
        showPage("page-survey");
        renderQuestion(0);
    };

    window.nextQuestion = function () {
        if (!validateQuestion(currentQuestion)) return;
        if (currentQuestion < SURVEY_QUESTIONS.length - 1) {
            currentQuestion++;
            renderQuestion(currentQuestion);
        }
    };

    window.prevQuestion = function () {
        if (currentQuestion > 0) {
            currentQuestion--;
            renderQuestion(currentQuestion);
        }
    };

    window.submitSurvey = function () {
        for (var i = 0; i < SURVEY_QUESTIONS.length; i++) {
            if (!validateQuestion(i)) {
                currentQuestion = i;
                renderQuestion(i);
                return;
            }
        }

        var storedAnswers = {};
        SURVEY_QUESTIONS.forEach(function (q) {
            storedAnswers[q.id] = resolveAnswerForStorage(q.id, q);
        });

        var response = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            timestamp: new Date().toISOString(),
            answers: storedAnswers
        };

        var responses = [];
        try { responses = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch (e) {}
        responses.push(response);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));

        showPage("page-thanks");
    };

    window.fillAgain = function () {
        startSurvey();
    };

    window.viewResults = function () {
        showPage("page-results");
        renderResults();
    };

    window.backToHome = function () {
        showPage("page-welcome");
    };

    function getAllOptionKeys(q) {
        var keys = q.options.slice();
        if (q.hasOther) keys.push("其他");
        return keys;
    }

    function matchAnswer(answerVal, optKey, hasOther) {
        if (answerVal === optKey) return true;
        if (hasOther && optKey === "其他" && typeof answerVal === "string" && answerVal.indexOf("其他：") === 0) return true;
        return false;
    }

    function matchAnswerArray(answerArr, optKey, hasOther) {
        if (!answerArr) return false;
        for (var i = 0; i < answerArr.length; i++) {
            if (answerArr[i] === optKey) return true;
            if (hasOther && optKey === "其他" && typeof answerArr[i] === "string" && answerArr[i].indexOf("其他：") === 0) return true;
        }
        return false;
    }

    function renderResults() {
        var responses = [];
        try { responses = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch (e) {}

        document.getElementById("result-count").textContent = responses.length;

        var container = document.getElementById("results-container");
        var html = "";

        SURVEY_QUESTIONS.forEach(function (q) {
            html += '<div class="result-card">';
            html += "<h3>" + q.title + "</h3>";

            var allOpts = getAllOptionKeys(q);

            if (q.type === "radio") {
                var counts = {};
                allOpts.forEach(function (o) { counts[o] = 0; });
                responses.forEach(function (r) {
                    var a = r.answers[q.id];
                    if (a) {
                        var matched = false;
                        allOpts.forEach(function (opt) {
                            if (matchAnswer(a, opt, q.hasOther)) { counts[opt]++; matched = true; }
                        });
                    }
                });
                var maxCount = Math.max.apply(null, Object.values(counts).concat([1]));
                html += '<div class="result-bar-group">';
                allOpts.forEach(function (opt) {
                    var c = counts[opt];
                    var pct = maxCount > 0 ? (c / maxCount) * 100 : 0;
                    var pctOfTotal = responses.length > 0 ? ((c / responses.length) * 100).toFixed(1) : "0.0";
                    html += '<div class="result-bar-item">';
                    html += '<span class="result-bar-label">' + opt + "</span>";
                    html += '<div class="result-bar-track"><div class="result-bar-fill" style="width:' + pct + '%"></div></div>';
                    html += '<span class="result-bar-count">' + c + " (" + pctOfTotal + "%)</span>";
                    html += "</div>";
                });
                html += "</div>";
            } else if (q.type === "checkbox") {
                var counts = {};
                allOpts.forEach(function (o) { counts[o] = 0; });
                responses.forEach(function (r) {
                    var a = r.answers[q.id] || [];
                    allOpts.forEach(function (opt) {
                        if (matchAnswerArray(a, opt, q.hasOther)) counts[opt]++;
                    });
                });
                var maxCount = Math.max.apply(null, Object.values(counts).concat([1]));
                html += '<div class="result-bar-group">';
                allOpts.forEach(function (opt) {
                    var c = counts[opt];
                    var pct = maxCount > 0 ? (c / maxCount) * 100 : 0;
                    var pctOfTotal = responses.length > 0 ? ((c / responses.length) * 100).toFixed(1) : "0.0";
                    html += '<div class="result-bar-item">';
                    html += '<span class="result-bar-label">' + opt + "</span>";
                    html += '<div class="result-bar-track"><div class="result-bar-fill" style="width:' + pct + '%"></div></div>';
                    html += '<span class="result-bar-count">' + c + " (" + pctOfTotal + "%)</span>";
                    html += "</div>";
                });
                html += "</div>";
            } else if (q.type === "rating") {
                var total = 0;
                var count = 0;
                var dist = {};
                for (var i = 1; i <= (q.maxRating || 5); i++) dist[i] = 0;
                responses.forEach(function (r) {
                    var a = r.answers[q.id];
                    if (a) { total += a; count++; dist[a]++; }
                });
                var avg = count > 0 ? (total / count).toFixed(1) : "-";
                html += '<div class="result-avg">' + avg + " / " + (q.maxRating || 5) + "</div>";
                html += '<div class="result-bar-group">';
                for (var i = (q.maxRating || 5); i >= 1; i--) {
                    var c = dist[i];
                    var maxDist = Math.max.apply(null, Object.values(dist).concat([1]));
                    var pct = maxDist > 0 ? (c / maxDist) * 100 : 0;
                    html += '<div class="result-bar-item">';
                    html += '<span class="result-bar-label">' + i + "星</span>";
                    html += '<div class="result-bar-track"><div class="result-bar-fill" style="width:' + pct + '%"></div></div>';
                    html += '<span class="result-bar-count">' + c + "</span>";
                    html += "</div>";
                }
                html += "</div>";
            } else if (q.type === "text" || q.type === "textarea") {
                html += '<ul class="result-text-list">';
                var hasContent = false;
                responses.forEach(function (r) {
                    var a = r.answers[q.id];
                    if (a && a.trim()) {
                        html += "<li>" + escapeHtml(a) + "</li>";
                        hasContent = true;
                    }
                });
                if (!hasContent) html += '<li style="color:#94a3b8">暂无回答</li>';
                html += "</ul>";
            }

            html += "</div>";
        });

        container.innerHTML = html;
    }

    function escapeHtml(s) {
        return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    window.exportCSV = function () {
        var responses = [];
        try { responses = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch (e) {}

        if (responses.length === 0) { alert("暂无数据可导出"); return; }

        var headers = ["序号", "提交时间"];
        SURVEY_QUESTIONS.forEach(function (q) { headers.push(q.title); });

        var rows = [headers.join(",")];
        responses.forEach(function (r, idx) {
            var row = [idx + 1, new Date(r.timestamp).toLocaleString("zh-CN")];
            SURVEY_QUESTIONS.forEach(function (q) {
                var a = r.answers[q.id];
                if (Array.isArray(a)) a = a.join(";");
                else if (a === undefined || a === null) a = "";
                row.push('"' + String(a).replace(/"/g, '""') + '"');
            });
            rows.push(row.join(","));
        });

        var csvContent = "\uFEFF" + rows.join("\n");
        var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "survey_results_" + new Date().toISOString().slice(0, 10) + ".csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    init();
})();
