/*
Alex Xu
Content script
checks for new tweets each second
for now: if tweet can be classified as positive or negative, it will cover it and show why
*/
let allTweets = {};
const API_REF = "https://hsr23-api.herokuapp.com/api/classify";
refreshFeed();

function refreshFeed() {
  const feedTweets = Array.prototype.slice.call(
    document.querySelectorAll("[data-testid=tweet]")
  );

  processNewTweets(feedTweets);
  window.setTimeout(refreshFeed, 500);
}

async function processNewTweets(feedTweets) {
  for (const tweet of feedTweets) {
    const tweetID = stripTweetID(tweet);
    if (allTweets[tweetID] === undefined) {
      allTweets[tweetID] = {
        ID: tweetID,
        innerHTML: tweet,
        text: stripTweetText(tweet),
      };
      allTweets[tweetID].sentiment = await classifyTweet(
        allTweets[tweetID].text
      ).then((res) => {
        res != 0 &&
          stripTweetBody(tweet)?.appendChild(
            createMask(
              res > 0
                ? "Classified as positive sentiment"
                : "Classified as negative sentiment"
            )
          );
      });
    }
  }
}

/*
Query backend for tweet classification
*/
async function classifyTweet(text) {
  const response = await fetch(API_REF, {
    method: "POST",
    body: JSON.stringify({
      text: text,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  return await response.json();
}

/*
Hides the tweet body
*/
function createMask(message) {
  const textStyling =
    " color: rgba(0,0,0,1); font-family: Helvetica; line-height: 1.2rem; font-size: 1rem; font-weight: bold; ";

  const mask = document.createElement("div");
  mask.id = "mask";
  mask.style.cssText =
    "position: absolute; \
      width: 100%; \
      height: 100%; \
      backdrop-filter: blur(2rem); \
      background-color: rgb(255,255,255); \
      background-color: rgba(255,255,255,0.8); \
      flex-direction: column; \
      align-items: center; \
      padding: .25rem; \
      display: flex; \
      opacity: 1; \
      transition: all 1s linear;";
  mask.addEventListener("mouseenter", () => {
    mask.style.visibility = "hidden";
    mask.style.opacity = "0";
  });

  const warningText = document.createElement("h2");
  warningText.appendChild(document.createTextNode(message));
  warningText.id = "warningText";
  warningText.style.cssText = "margin: auto;" + textStyling;

  mask.appendChild(warningText);

  return mask;
}

/*
Extracts the unique tweet html ID
*/
function stripTweetID(tweet) {
  return tweet.querySelector("div[id^=id__]")?.id;
}

/*
Extracts the tweet body html
*/
function stripTweetBody(tweet) {
  return tweet.querySelector(
    "div.css-1dbjc4n.r-1iusvr4.r-16y2uox.r-1777fci.r-kzbkwu"
  )?.lastChild;
}

/*
Extracts the tweet text
*/
function stripTweetText(tweet) {
  const tweetText = tweet.querySelector(
    'div[data-testid="tweetText"]'
  )?.children;

  return tweetText
    ? Array.from(tweetText, ({ textContent }) => textContent.trim())
        .filter(Boolean)
        .join(" ")
    : "";
}
