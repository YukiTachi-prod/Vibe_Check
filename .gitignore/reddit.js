import express from "express";
import axios from "axios";
import qs from "querystring";

const app = express();
const port = 3000;

const clientId = "JwVoE-HJYFLmGinDOLitLg";
const clientSecret = "fAKSdRYFtyOFW0ann8vQZmNDgxgEFg";
const redirectUri = "http://localhost:3000/callback";

app.get("/login", (req, res) => {
  const authUrl = `https://www.reddit.com/api/v1/authorize?` +
    `client_id=${clientId}` +
    `&response_type=code` +
    `&state=randomstring` +
    `&redirect_uri=${redirectUri}` +
    `&duration=temporary` +
    `&scope=identity`;
  res.redirect(authUrl);
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;

  try {
    const tokenResponse = await axios.post(
      "https://www.reddit.com/api/v1/access_token",
      qs.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      {
        auth: {
          username: clientId,
          password: clientSecret,
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log("✅ Access Token:", accessToken);

    const meResponse = await axios.get("https://oauth.reddit.com/api/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "VibeCheckApp/0.1 by Enough_Inflation1633",
      },
    });

    console.log("🙋 Reddit Profile:", meResponse.data);
    res.send(meResponse.data);
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
    res.send("Error fetching token or profile");
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}/login`);
});
