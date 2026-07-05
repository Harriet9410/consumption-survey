(function () {
    var STORAGE_KEY = "survey_responses";
    var PWD_KEY = "survey_admin_pwd";
    var DEFAULT_PWD = "admin123";
    var isLoggedIn = false;
    var allResponses = [];

    function getPwd() {
        return localStorage.getItem(PWD_KEY) || DEFAULT_PWD;
    }

    function showPage(id) {
        document.querySelectorAll(".page").forEach(function (p) { p.classList.remove("active"); });
        document.getElementById(id).classList.add("active");
    }

    function loadResponses() {
        try { allResponses = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch (e) { allResponses = []; }
    }

    window.handleLogin = function (e) {
        e.preventDefault();
        var pwd = document.getElementById("admin-password").value;
        if (pwd === getPwd()) {
            isLoggedIn = true;
            document.getElementById("login-error").style.display = "none";
            loadResponses();
            showPage("page-dashboard");
            renderDashboard();
        } else {
            document.getElementById("login-error").style.display = "block";
        }
        return false;
    };

    window.logout = function () {
        isLoggedIn = false;
        document.getElementById("admin-password").value = "";
        showPage("page-login");
    };

    window.switchTab = function (name) {
        document.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.remove("active"); });
        document.querySelectorAll(".tab-panel").forEach(function (p) { p.classList.remove("active"); });
        event.target.classList.add("active");
        document.getElementById("tab-" + name).classList.add("active");
    };

    window.changePassword = function (e) {
        e.preventDefault();
        var oldPwd = document.getElementById("old-pwd").value;
        var newPwd = document.getElementById("new-pwd").value;
        var newPwd2 = document.getElementById("new-pwd2").value;
        var msg = document.getElementById("pwd-success");

        if (oldPwd !== getPwd()) { alert("当前密码错误"); return false; }
        if (newPwd !== newPwd2) { alert("两次输入的新密码不一致"); return false; }
        if (newPwd.length < 4) { alert("密码长度不能少于4位"); return false; }

        localStorage.setItem(PWD_KEY, newPwd);
        msg.style.display = "block";
        setTimeout(function () { msg.style.display = "none"; }, 2000);
        document.getElementById("old-pwd").value = "";
        document.getElementById("new-pwd").value = "";
        document.getElementById("new-pwd2").value = "";
        return false;
    };

    function renderDashboard() {
        renderOverview();
        renderDetailSelect();
        renderDetailQuestion();
    }

    function renderOverview() {
        var total = allResponses.length;
        document.getElementById("stat-total").textContent = total;

        var today = new Date().toISOString().slice(0, 10);
        var todayCount = allResponses.filter(function (r) { return r.timestamp.slice(0, 10) === today; }).length;
        document.getElementById("stat-today").textContent = todayCount;

        var requiredQs = SURVEY_QUESTIONS.filter(function (q) { return q.required; });
        var totalCompletion = 0;
        allResponses.forEach(function (r) {
            var filled = 0;
            requiredQs.forEach(function (q) {
                var a = r.answers[q.id];
                if (a !== undefined && a !== null && a !== "" && !(Array.isArray(a) && a.length === 0)) filled++;
            });
            totalCompletion += (filled / requiredQs.length) * 100;
        });
        document.getElementById("stat-complete").textContent = total > 0 ? Math.round(totalCompletion / total) + "%" : "0%";

        document.getElementById("stat-avgtime").textContent = total > 0 ? "~3min" : "-";

        renderTrendChart();
        renderOverviewBasic();
        renderOverviewKey();
    }

    function renderTrendChart() {
        var dateCounts = {};
        allResponses.forEach(function (r) {
            var d = r.timestamp.slice(0, 10);
            dateCounts[d] = (dateCounts[d] || 0) + 1;
        });

        var dates = Object.keys(dateCounts).sort();
        var maxCount = Math.max.apply(null, Object.values(dateCounts).concat([1]));

        var container = document.getElementById("trend-chart");
        if (dates.length === 0) {
            container.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:40px">暂无提交数据</div>';
            return;
        }

        var html = '<div class="trend-bars">';
        dates.forEach(function (d) {
            var c = dateCounts[d];
            var pct = (c / maxCount) * 100;
            html += '<div class="trend-bar-col">';
            html += '<div class="trend-bar-count">' + c + '</div>';
            html += '<div class="trend-bar-track"><div class="trend-bar-fill" style="height:' + pct + '%"></div></div>';
            html += '<div class="trend-bar-date">' + d.slice(5) + '</div>';
            html += '</div>';
        });
        html += '</div>';
        container.innerHTML = html;
    }

    function getOptionCounts(qId, options, hasOther, type) {
        var counts = {};
        options.forEach(function (o) { counts[o] = 0; });
        if (hasOther) counts["\u5176\u4ed6"] = 0;

        allResponses.forEach(function (r) {
            var a = r.answers[qId];
            if (!a) return;
            if (type === "checkbox" && Array.isArray(a)) {
                a.forEach(function (v) {
                    if (counts.hasOwnProperty(v)) counts[v]++;
                    else if (hasOther && v.indexOf("\u5176\u4ed6\uff1a") === 0) counts["\u5176\u4ed6"]++;
                });
            } else {
                if (counts.hasOwnProperty(a)) counts[a]++;
                else if (hasOther && typeof a === "string" && a.indexOf("\u5176\u4ed6\uff1a") === 0) counts["\u5176\u4ed6"]++;
            }
        });
        return counts;
    }

    function renderBarChart(counts, total) {
        var maxCount = Math.max.apply(null, Object.values(counts).concat([1]));
        var html = '<div class="admin-bar-group">';
        Object.keys(counts).forEach(function (key) {
            var c = counts[key];
            var pct = maxCount > 0 ? (c / maxCount) * 100 : 0;
            var pctOfTotal = total > 0 ? ((c / total) * 100).toFixed(1) : "0.0";
            html += '<div class="admin-bar-item">';
            html += '<span class="admin-bar-label">' + key + '</span>';
            html += '<div class="admin-bar-track"><div class="admin-bar-fill" style="width:' + pct + '%"></div></div>';
            html += '<span class="admin-bar-count">' + c + ' (' + pctOfTotal + '%)</span>';
            html += '</div>';
        });
        html += '</div>';
        return html;
    }

    function renderOverviewBasic() {
        var container = document.getElementById("overview-basic");
        var basicQs = SURVEY_QUESTIONS.slice(0, 4);
        var html = "";
        basicQs.forEach(function (q) {
            var options = q.options.slice();
            var counts = getOptionCounts(q.id, options, q.hasOther, q.type);
            var total = allResponses.length;
            html += '<div class="overview-card">';
            html += '<h4>' + q.title + '</h4>';
            html += renderBarChart(counts, total);
            html += '</div>';
        });
        container.innerHTML = html;
    }

    function renderOverviewKey() {
        var container = document.getElementById("overview-key");
        var keyQIds = ["q11", "q17", "q18", "q24"];
        var html = "";
        keyQIds.forEach(function (qid) {
            var q = SURVEY_QUESTIONS.find(function (x) { return x.id === qid; });
            if (!q) return;
            var options = q.options.slice();
            var counts = getOptionCounts(q.id, options, q.hasOther, q.type);
            var total = allResponses.length;
            html += '<div class="overview-card">';
            html += '<h4>' + q.title + '</h4>';
            html += renderBarChart(counts, total);
            html += '</div>';
        });
        container.innerHTML = html;
    }

    function renderDetailSelect() {
        var select = document.getElementById("detail-question-select");
        var html = "";
        SURVEY_QUESTIONS.forEach(function (q, i) {
            html += '<option value="' + i + '">' + (i + 1) + '. ' + q.title + '</option>';
        });
        select.innerHTML = html;
    }

    window.renderDetailQuestion = function () {
        var idx = parseInt(document.getElementById("detail-question-select").value);
        var q = SURVEY_QUESTIONS[idx];
        var container = document.getElementById("detail-content");
        var total = allResponses.length;

        var html = '<div class="detail-card">';

        if (q.type === "radio") {
            var options = q.options.slice();
            if (q.hasOther) options.push("\u5176\u4ed6");
            var counts = getOptionCounts(q.id, q.options.slice(), q.hasOther, q.type);

            html += '<div class="detail-header"><h3>' + q.title + '</h3><span class="detail-badge">' + total + ' 人作答</span></div>';
            html += renderBarChart(counts, total);

            html += '<div class="detail-cross">';
            html += '<h4>\u4ea4\u53c9\u5206\u6790\uff1a\u6309\u6027\u522b</h4>';
            html += renderCrossTab(q, "q1");
            html += '</div>';

            html += '<div class="detail-cross">';
            html += '<h4>\u4ea4\u53c9\u5206\u6790\uff1a\u6309\u5e74\u7ea7</h4>';
            html += renderCrossTab(q, "q2");
            html += '</div>';

        } else if (q.type === "checkbox") {
            var options = q.options.slice();
            if (q.hasOther) options.push("\u5176\u4ed6");
            var counts = getOptionCounts(q.id, q.options.slice(), q.hasOther, q.type);

            html += '<div class="detail-header"><h3>' + q.title + '</h3><span class="detail-badge">' + total + ' 人作答</span></div>';
            html += '<p class="detail-note">\u591a\u9009\u9898\uff0c\u767e\u5206\u6bd4\u4e4b\u548c\u53ef\u80fd\u8d85\u8fc7100%</p>';
            html += renderBarChart(counts, total);

            html += '<div class="detail-cross">';
            html += '<h4>\u4ea4\u53c9\u5206\u6790\uff1a\u6309\u6027\u522b</h4>';
            html += renderCrossTabCheckbox(q, "q1");
            html += '</div>';

        } else if (q.type === "textarea" || q.type === "text") {
            html += '<div class="detail-header"><h3>' + q.title + '</h3><span class="detail-badge">' + total + ' 人</span></div>';
            var answers = [];
            allResponses.forEach(function (r) {
                var a = r.answers[q.id];
                if (a && a.trim()) answers.push(a);
            });
            if (answers.length === 0) {
                html += '<p class="detail-note">\u6682\u65e0\u56de\u7b54</p>';
            } else {
                html += '<div class="text-answer-list">';
                answers.forEach(function (a, i) {
                    html += '<div class="text-answer-item"><span class="text-answer-num">#' + (i + 1) + '</span><span class="text-answer-content">' + escapeHtml(a) + '</span></div>';
                });
                html += '</div>';
            }
        }

        html += '</div>';
        container.innerHTML = html;
    };

    function renderCrossTab(q, groupQid) {
        var groupQ = SURVEY_QUESTIONS.find(function (x) { return x.id === groupQid; });
        if (!groupQ) return '';
        var groups = groupQ.options;
        var options = q.options.slice();
        if (q.hasOther) options.push("\u5176\u4ed6");

        var table = {};
        groups.forEach(function (g) { table[g] = {}; options.forEach(function (o) { table[g][o] = 0; }); });
        var groupTotals = {};
        groups.forEach(function (g) { groupTotals[g] = 0; });

        allResponses.forEach(function (r) {
            var group = r.answers[groupQid];
            var answer = r.answers[q.id];
            if (!group || !answer) return;
            if (!table[group]) return;
            groupTotals[group]++;
            if (table[group].hasOwnProperty(answer)) table[group][answer]++;
            else if (q.hasOther && typeof answer === "string" && answer.indexOf("\u5176\u4ed6\uff1a") === 0) table[group]["\u5176\u4ed6"]++;
        });

        var html = '<div class="crosstab-wrapper"><table class="crosstab"><thead><tr><th></th>';
        options.forEach(function (o) { html += '<th>' + o + '</th>'; });
        html += '<th>\u5408\u8ba1</th></tr></thead><tbody>';
        groups.forEach(function (g) {
            html += '<tr><td class="crosstab-row-header">' + g + '</td>';
            var rowTotal = 0;
            options.forEach(function (o) { var c = table[g][o]; rowTotal += c; html += '<td>' + c + '<br><span class="crosstab-pct">(' + (groupTotals[g] > 0 ? ((c / groupTotals[g]) * 100).toFixed(1) : "0.0") + '%)</span></td>'; });
            html += '<td><strong>' + rowTotal + '</strong></td></tr>';
        });
        html += '</tbody></table></div>';
        return html;
    }

    function renderCrossTabCheckbox(q, groupQid) {
        var groupQ = SURVEY_QUESTIONS.find(function (x) { return x.id === groupQid; });
        if (!groupQ) return '';
        var groups = groupQ.options;
        var options = q.options.slice();
        if (q.hasOther) options.push("\u5176\u4ed6");

        var table = {};
        groups.forEach(function (g) { table[g] = {}; options.forEach(function (o) { table[g][o] = 0; }); });
        var groupTotals = {};
        groups.forEach(function (g) { groupTotals[g] = 0; });

        allResponses.forEach(function (r) {
            var group = r.answers[groupQid];
            var answers = r.answers[q.id];
            if (!group || !answers || !Array.isArray(answers)) return;
            if (!table[group]) return;
            groupTotals[group]++;
            answers.forEach(function (a) {
                if (table[group].hasOwnProperty(a)) table[group][a]++;
                else if (q.hasOther && typeof a === "string" && a.indexOf("\u5176\u4ed6\uff1a") === 0) table[group]["\u5176\u4ed6"]++;
            });
        });

        var html = '<div class="crosstab-wrapper"><table class="crosstab"><thead><tr><th></th>';
        options.forEach(function (o) { html += '<th>' + o + '</th>'; });
        html += '<th>\u4eba\u6570</th></tr></thead><tbody>';
        groups.forEach(function (g) {
            html += '<tr><td class="crosstab-row-header">' + g + '</td>';
            options.forEach(function (o) {
                var c = table[g][o];
                html += '<td>' + c + '<br><span class="crosstab-pct">(' + (groupTotals[g] > 0 ? ((c / groupTotals[g]) * 100).toFixed(1) : "0.0") + '%)</span></td>';
            });
            html += '<td><strong>' + groupTotals[g] + '</strong></td></tr>';
        });
        html += '</tbody></table></div>';
        return html;
    }

    function escapeHtml(s) {
        return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    window.exportCSV = function () {
        loadResponses();
        if (allResponses.length === 0) { alert("\u6682\u65e0\u6570\u636e"); return; }

        var headers = ["\u5e8f\u53f7", "\u63d0\u4ea4\u65f6\u95f4"];
        SURVEY_QUESTIONS.forEach(function (q) { headers.push(q.title); });

        var rows = [headers.join(",")];
        allResponses.forEach(function (r, idx) {
            var row = [idx + 1, new Date(r.timestamp).toLocaleString("zh-CN")];
            SURVEY_QUESTIONS.forEach(function (q) {
                var a = r.answers[q.id];
                if (Array.isArray(a)) a = a.join(";");
                else if (a === undefined || a === null) a = "";
                row.push('"' + String(a).replace(/"/g, '""') + '"');
            });
            rows.push(row.join(","));
        });

        downloadCSV(rows, "survey_raw_data");
    };

    window.exportStats = function () {
        loadResponses();
        if (allResponses.length === 0) { alert("\u6682\u65e0\u6570\u636e"); return; }
        var total = allResponses.length;
        var rows = [];

        SURVEY_QUESTIONS.forEach(function (q) {
            if (q.type === "radio" || q.type === "checkbox") {
                var options = q.options.slice();
                if (q.hasOther) options.push("\u5176\u4ed6");
                var counts = getOptionCounts(q.id, q.options.slice(), q.hasOther, q.type);
                options.forEach(function (opt) {
                    var c = counts[opt] || 0;
                    rows.push(['"' + q.title.replace(/"/g, '""') + '"', '"' + opt.replace(/"/g, '""') + '"', c, total > 0 ? ((c / total) * 100).toFixed(2) + "%" : "0%"].join(","));
                });
            }
        });

        var header = "\u9898\u76ee,\u9009\u9879,\u9891\u6b21,\u767e\u5206\u6bd4";
        downloadCSV([header].concat(rows), "survey_stats");
    };

    window.exportCrossTab = function () {
        loadResponses();
        if (allResponses.length === 0) { alert("\u6682\u65e0\u6570\u636e"); return; }

        var groupFields = [{ id: "q1", name: "\u6027\u522b" }, { id: "q2", name: "\u5e74\u7ea7" }, { id: "q4", name: "\u6708\u53ef\u652f\u914d\u751f\u6d3b\u8d39" }];
        var rows = [];

        groupFields.forEach(function (gf) {
            var groupQ = SURVEY_QUESTIONS.find(function (x) { return x.id === gf.id; });
            if (!groupQ) return;
            var groups = groupQ.options;

            SURVEY_QUESTIONS.forEach(function (q) {
                if (q.type !== "radio") return;
                var options = q.options.slice();
                if (q.hasOther) options.push("\u5176\u4ed6");
                var counts = {};
                groups.forEach(function (g) { counts[g] = {}; options.forEach(function (o) { counts[g][o] = 0; }); });
                var groupTotals = {};
                groups.forEach(function (g) { groupTotals[g] = 0; });

                allResponses.forEach(function (r) {
                    var group = r.answers[gf.id];
                    var answer = r.answers[q.id];
                    if (!group || !answer || !counts[group]) return;
                    groupTotals[group]++;
                    if (counts[group].hasOwnProperty(answer)) counts[group][answer]++;
                    else if (q.hasOther && typeof answer === "string" && answer.indexOf("\u5176\u4ed6\uff1a") === 0) counts[group]["\u5176\u4ed6"]++;
                });

                groups.forEach(function (g) {
                    options.forEach(function (o) {
                        var c = counts[g][o] || 0;
                        var pct = groupTotals[g] > 0 ? ((c / groupTotals[g]) * 100).toFixed(2) + "%" : "0%";
                        rows.push(['"' + gf.name + '"', '"' + g + '"', '"' + q.title.replace(/"/g, '""') + '"', '"' + o.replace(/"/g, '""') + '"', c, pct].join(","));
                    });
                });
            });
        });

        var header = "\u5206\u7ec4\u5b57\u6bb5,\u5206\u7ec4\u503c,\u9898\u76ee,\u9009\u9879,\u9891\u6b21,\u767e\u5206\u6bd4";
        downloadCSV([header].concat(rows), "survey_crosstab");
    };

    function downloadCSV(rows, filename) {
        var csvContent = "\uFEFF" + rows.join("\n");
        var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = filename + "_" + new Date().toISOString().slice(0, 10) + ".csv";
        a.click();
        URL.revokeObjectURL(url);
    }

    window.clearAllData = function () {
        if (!confirm("\u786e\u5b9a\u8981\u6e05\u9664\u6240\u6709\u7b54\u5377\u6570\u636e\uff1f\u6b64\u64cd\u4f5c\u4e0d\u53ef\u6062\u590d\uff01")) return;
        if (!confirm("\u518d\u6b21\u786e\u8ba4\uff1a\u771f\u7684\u8981\u5220\u9664\u6240\u6709\u6570\u636e\uff1f")) return;
        localStorage.removeItem(STORAGE_KEY);
        allResponses = [];
        renderDashboard();
        alert("\u6570\u636e\u5df2\u6e05\u9664");
    };

})();
