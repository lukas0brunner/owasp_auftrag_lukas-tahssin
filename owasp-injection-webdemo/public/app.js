let currentUser = null;

function pretty(obj) {
    return JSON.stringify(obj, null, 2);
}

async function postJson(url, body) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
}

async function getJson(url) {
    const headers = {};
    if (currentUser?.username) {
        headers["x-demo-user"] = currentUser.username; // demo-only "session"
    }
    const res = await fetch(url, { headers });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
}

// Login
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const username = form.username.value;
    const password = form.password.value;

    const result = await postJson("/api/login", { username, password });
    document.getElementById("loginOut").textContent = pretty(result);

    if (result.ok && result.data?.user) {
        currentUser = result.data.user;
    } else {
        currentUser = null;
    }
});

// Search
document.getElementById("searchForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = e.currentTarget.q.value;
    const result = await getJson(`/api/search?q=${encodeURIComponent(q)}`);
    document.getElementById("searchOut").textContent = pretty(result);
});

// Admin
document.getElementById("adminBtn").addEventListener("click", async () => {
    const result = await getJson("/api/admin");
    document.getElementById("adminOut").textContent = pretty(result);
});