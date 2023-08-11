## Platform Explorations

Our project is designed to fetch data from various social media platforms. At present, the application supports YouTube, Twitter, and Meta, demonstrating our continuous commitment to broadening its reach. Our design inherently relies on the accessibility of these platform APIs, and the ability to extract data is contingent upon these services' ongoing operation.

Below, we delve into each platform, elucidating the methods used to retrieve data and outlining what the deployer needs to utilize these platforms effectively.

It's crucial to bear in mind that while we've laid the groundwork for accessing these platform APIs, the final authority on data access rests with the platforms themselves. Despite this, we believe that the growing importance of XPOC's use cases in verifying the origin of information could provide an impetus for these platforms to make their APIs more accessible.

With the acceleration of digital misinformation, having verified and trustworthy data becomes an increasingly critical matter. It's this belief that fuels our ambition to make data verification ubiquitous across all social media platforms.

### YouTube

Our application retrieves YouTube video data by using Cheerio to scrape the YouTube video page for the required data. For this, we do not require any API tokens, making it easy to deploy.

Here's the logic for YouTube:

1. The URL of the YouTube video is provided.
2. The video ID is extracted from the URL.
3. The page is fetched, and Cheerio is used to extract the video's title, account name, description, and the XPOC URI, if present.

To add support for YouTube in your deployment, no specific setup is required.

### Twitter

For Twitter, we use Twitter's v2 API to fetch tweet data. Twitter controls access to its API, requiring a bearer token to authenticate API requests.

Here's the logic for Twitter:

1. The URL of the tweet is provided.
2. The tweet ID is extracted from the URL.
3. The tweet data is fetched from the Twitter API using the bearer token for authentication.
4. The tweet's text, author ID, and the XPOC URI are extracted from the response.

To add support for Twitter in your deployment, you need to:

1. Create a Twitter Developer Account and apply for API access. For details, refer to the [Twitter API documentation](https://developer.twitter.com/en/docs).
2. Once you have access to the API, generate a bearer token.
3. Add the bearer token to your environment variables. The variable key should be `TWITTER_BEARER_TOKEN`, and the value should be your actual token.

### Meta

For Meta, we utilize the Meta Graph API to fetch data from posts. This requires an access token to authenticate API requests.

Here's the logic for Meta:

1. The URL of the Meta post is provided.
2. The post ID is extracted from the URL.
3. The post data is fetched from the Meta Graph API using the access token for authentication.
4. The post's text, author ID, and any attached media URLs are extracted from the response.

To add support for Meta in your deployment, you need to:

1. Create a Meta Developer Account and set up an app. For details, refer to the [Meta API documentation](https://developers.facebook.com/docs/graph-api/overview).
2. Generate an access token for your app.
3. Add the access token to your environment variables. The variable key should be `Meta_ACCESS_TOKEN`, and the value should be your actual token.

Note: The Meta Graph API requires specific permissions to access certain data. Be sure to request these permissions during the app review process.