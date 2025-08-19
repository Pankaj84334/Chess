require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  console.log(userMessage);

  const predictionRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: "8e6975e5ed6174911a6ff3d60540dfd4844201974602551e10e9e87ab143d81e",
      input: { prompt: userMessage },
    }),
  });

  const prediction = await predictionRes.json();

  const predictionId = prediction.id;
  let output;

  while (!output) {
    const statusRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` },
    });

    const statusData = await statusRes.json();

    if (statusData.status === "succeeded") {
      output = statusData.output;
      break;
    } else if (statusData.status === "failed") {
      return res.status(500).json({ reply: "Generation failed." });
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  res.json({ reply: output });
});

app.listen(3001, () => console.log("Server running on port 3001"));
