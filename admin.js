(function () {
    var allResponses = [];
    var isLoggedIn = false;
    var supabaseClient = null;

    function initSupabase() {
        if (typeof SUPABASE_URL === 'undefined' || SUPABASE_URL === 'YOUR_SUPABASE_URL' || !SUPABASE_URL) {
            alert('\u8bf7\u5148\u914d\u7f6e Supabase\uff0c\u8be6\u89c1 supabase-config.js');
            return false;
        }
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return true;
    }

    function showPage(id) {
        document.querySelectorAll(".page").forEach(function (p) { p.classList.remove("active"); });
        document.getElementById(id).classList.add("active");
    }

    async function checkSession() {
        if (!initSupabase()) return;
        try {
            var result = await supabaseClient.auth.getSession();
            if (result.data && result.data.session) {
                isLoggedIn = true;
                showPage("page-dashboard");
                await loadResponses();
                renderDashboard();
            }
        } catch (e) {}
    }

    window.handleLogin = async function (e) {
        e.preventDefault();
        if (!supabaseClient && !initSupabase()) return false;

        var email = document.getElementById("admin-email").value;
        var pwd = document.getElementById("admin-password").value;

        try {
            var result = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: pwd
            });
            if (result.error) throw result.error;
            isLoggedIn = true;
            document.getElementById("login-error").style.display = "none";
            showPage("page-dashboard");
            await loadResponses();
            renderDashboard();
        } catch (err) {
            document.getElementById("login-error").style.display = "block";
            document.getElementById("login-error").textContent = "\u767b\u5f55\u5931\u8d25\uff1a" + (err.message || "\u8bf7\u68c0\u67e5\u90ae\u7bb1\u548c\u5bc6\u7801");
        }
        return false;
    };

    window.logout = async function () {
        if (supabaseClient) {
            try { await supabaseClient.auth.signOut(); } catch (e) {}
        }
        isLoggedIn = false;
        showPage("page-login");
    };

    window.switchTab = function (name) {
        document.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.remove("active"); });
        document.querySelectorAll(".tab-panel").forEach(function (p) { p.classList.remove("active"); });
        event.target.classList.add("active");
        document.getElementById("tab-" + name).classList.add("active");
    };

    async function loadResponses() {
        if (!supabaseClient) return;
        try {
            var result = await supabaseClient
                .from('responses')
                .select('*')
                .order('created_at', { ascending: true });
            if (result.error) throw result.error;
            allResponses = (result.data || []).map(function (r) {
                return { id: r.id, timestamp: r.created_at, answers: r.answers };
            });
        } catch (err) {
            allResponses = [];
            console.error('Failed to load responses:', err);
        }
    }

    function renderDashboard() {
        renderOverview();
        renderDetailSelect();
        renderDetailQuestion();
    }

    function renderOverview() {
        var total = allResponses.length;
        document.getElementById("stat-total").textContent = total;

        var today = new Date().toISOString().slice(0, 10);
        var todayCount = allResponses.filter(function (r) { return r.timestamp && r.timestamp.slice(0, 10) === today; }).length;
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
            if (!r.timestamp) return;
            var d = r.timestamp.slice(0, 10);
            dateCounts[d] = (dateCounts[d] || 0) + 1;
        });

        var dates = Object.keys(dateCounts).sort();
        var maxCount = Math.max.apply(null, Object.values(dateCounts).concat([1]));

        var container = document.getElementById("trend-chart");
        if (dates.length === 0) {
            container.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:40px">\u6682\u65e0\u63d0\u4ea4\u6570\u636e</div>';
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
            var counts = getOptionCounts(q.id, q.options.slice(), q.hasOther, q.type);
            html += '<div class="overview-card">';
            html += '<h4>' + q.title + '</h4>';
            html += renderBarChart(counts, allResponses.length);
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
            var counts = getOptionCounts(q.id, q.options.slice(), q.hasOther, q.type);
            html += '<div class="overview-card">';
            html += '<h4>' + q.title + '</h4>';
            html += renderBarChart(counts, allResponses.length);
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
            var counts = getOptionCounts(q.id, q.options.slice(), q.hasOther, q.type);
            html += '<div class="detail-header"><h3>' + q.title + '</h3><span class="detail-badge">' + total + ' \u4eba\u4f5c\u7b54</span></div>';
            html += renderBarChart(counts, total);
            html += '<div class="detail-cross"><h4>\u4ea4\u53c9\u5206\u6790\uff1a\u6309\u6027\u522b</h4>';
            html += renderCrossTab(q, "q1");
            html += '</div>';
            html += '<div class="detail-cross"><h4>\u4ea4\u53c9\u5206\u6790\uff1a\u6309\u5e74\u7ea7</h4>';
            html += renderCrossTab(q, "q2");
            html += '</div>';
        } else if (q.type === "checkbox") {
            var counts = getOptionCounts(q.id, q.options.slice(), q.hasOther, q.type);
            html += '<div class="detail-header"><h3>' + q.title + '</h3><span class="detail-badge">' + total + ' \u4eba\u4f5c\u7b54</span></div>';
            html += '<p class="detail-note">\u591a\u9009\u9898\uff0c\u767e\u5206\u6bd4\u4e4b\u548c\u53ef\u80fd\u8d85\u8fc7100%</p>';
            html += renderBarChart(counts, total);
            html += '<div class="detail-cross"><h4>\u4ea4\u53c9\u5206\u6790\uff1a\u6309\u6027\u522b</h4>';
            html += renderCrossTabCheckbox(q, "q1");
            html += '</div>';
        } else if (q.type === "textarea" || q.type === "text") {
            html += '<div class="detail-header"><h3>' + q.title + '</h3><span class="detail-badge">' + total + ' \u4eba</span></div>';
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

    window.exportCSV = async function () {
        await loadResponses();
        if (allResponses.length === 0) { alert("\u6682\u65e0\u6570\u636e"); return; }

        var headers = ["\u5e8f\u53f7", "\u63d0\u4ea4\u65f6\u95f4"];
        SURVEY_QUESTIONS.forEach(function (q) { headers.push(q.title); });

        var rows = [headers.join(",")];
        allResponses.forEach(function (r, idx) {
            var row = [idx + 1, r.timestamp ? new Date(r.timestamp).toLocaleString("zh-CN") : ""];
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

    window.exportStats = async function () {
        await loadResponses();
        if (allResponses.length === 0) { alert("\u6682\u65e0\u6570\u636e"); return; }
        var total = allResponses.length;
        var rows = [];

        SURVEY_QUESTIONS.forEach(function (q) {
            if (q.type === "radio" || q.type === "checkbox") {
                var counts = getOptionCounts(q.id, q.options.slice(), q.hasOther, q.type);
                Object.keys(counts).forEach(function (opt) {
                    var c = counts[opt] || 0;
                    rows.push(['"' + q.title.replace(/"/g, '""') + '"', '"' + opt.replace(/"/g, '""') + '"', c, total > 0 ? ((c / total) * 100).toFixed(2) + "%" : "0%"].join(","));
                });
            }
        });

        var header = "\u9898\u76ee,\u9009\u9879,\u9891\u6b21,\u767e\u5206\u6bd4";
        downloadCSV([header].concat(rows), "survey_stats");
    };

    window.exportCrossTab = async function () {
        await loadResponses();
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

    window.clearAllData = async function () {
        if (!confirm("\u786e\u5b9a\u8981\u6e05\u9664\u6240\u6709\u7b54\u5377\u6570\u636e\uff1f\u6b64\u64cd\u4f5c\u4e0d\u53ef\u6062\u590d\uff01")) return;
        if (!confirm("\u518d\u6b21\u786e\u8ba4\uff1a\u771f\u7684\u8981\u5220\u9664\u6240\u6709\u6570\u636e\uff1f")) return;

        try {
            var result = await supabaseClient.from('responses').delete().neq('id', 0);
            if (result.error) throw result.error;
            allResponses = [];
            renderDashboard();
            alert("\u6570\u636e\u5df2\u6e05\u9664");
        } catch (err) {
            alert("\u6e05\u9664\u5931\u8d25\uff1a" + (err.message || err));
        }
    };

    window.changePassword = async function (e) {
        e.preventDefault();
        if (!supabaseClient) { alert("\u8bf7\u5148\u767b\u5f55"); return false; }
        var newPwd = document.getElementById("new-pwd").value;
        var newPwd2 = document.getElementById("new-pwd2").value;
        var msg = document.getElementById("pwd-success");

        if (newPwd !== newPwd2) { alert("\u4e24\u6b21\u8f93\u5165\u7684\u65b0\u5bc6\u7801\u4e0d\u4e00\u81f4"); return false; }
        if (newPwd.length < 6) { alert("\u5bc6\u7801\u957f\u5ea6\u4e0d\u80fd\u5c11\u4e8e6\u4f4d"); return false; }

        try {
            var result = await supabaseClient.auth.updateUser({ password: newPwd });
            if (result.error) throw result.error;
            msg.style.display = "block";
            setTimeout(function () { msg.style.display = "none"; }, 2000);
            document.getElementById("new-pwd").value = "";
            document.getElementById("new-pwd2").value = "";
        } catch (err) {
            alert("\u4fee\u6539\u5931\u8d25\uff1a" + (err.message || err));
        }
        return false;
    };

    checkSession();
})();
