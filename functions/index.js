const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cheerio = require("cheerio");

admin.initializeApp();

exports.scrapeProduct = functions.https.onRequest(async (req, res) => {
  const productUrl = req.query.url;
  if (!productUrl) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const response = await axios.get(productUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/103 Safari/537.36",
      },
    });

    const $ = cheerio.load(response.data);
    const hostname = new URL(productUrl).hostname;

    let title = "";
    let image = "";
    let price = "";

    if (hostname.includes("amazon")) {
      title = $("#productTitle").text().trim();
      image = $("#landingImage").attr("src") || $("img#imgBlkFront").attr("src");
      price = $("#priceblock_ourprice").text().trim() || $("#priceblock_dealprice").text().trim();
    } else if (hostname.includes("flipkart")) {
      title = $("span.B_NuCI").first().text().trim();
      price = $("div._30jeq3").first().text().replace(/[₹,$]/g, "").trim();
      image = $("img._396cs4").first().attr("src");
    } else if (hostname.includes("myntra")) {
      title = $("h1.pdp-title").text().trim();
      price = $("span.pdp-price").first().text().replace(/[₹,$]/g, "").trim();
      image = $("img.img-responsive").attr("src");
    } else {
      return res.status(400).json({ error: "Unsupported site" });
    }

    res.json({
      title,
      image,
      price: parseFloat(price.replace(/[^0-9.]/g, "")) || 0,
      platform: hostname,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to scrape product" });
  }
});
