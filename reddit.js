import fetch from "node-fetch";

// 🔑 Replace these with your Reddit app + account info
const clientId = "JwVoE-HJYFLmGinDOLitLg";
const clientSecret = "fAKSdRYFtyOFW0ann8vQZmNDgxgEFg";
const username = "YOUR_REDDIT_USERNAME";
const password = "YOUR_REDDIT_PASSWORD";

async function getToken() {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "password",
      username,
      password
    })
  });

  const data = await res.json();
  if (data.error) {
    console.error("❌ Error fetching token:", data);
    return null;
  }
  return data.access_token;
}

async function getTrendingPosts() {
  const token = await getToken();
  if (!token) return;

  const res = await fetch("https://oauth.reddit.com/r/all/top?limit=5", {
    headers: {
      "Authorization": `Bearer ${token}`,
      "User-Agent": "vibe_check_app/0.1 by YOUR_REDDIT_USERNAME"
    }
  });

  const data = await res.json();
  console.log("\n🔥 Trending Reddit Posts:");
  data.data.children.forEach((p, i) => {
    console.log(`${i + 1}. ${p.data.title}`);
  });
}

getTrendingPosts();
