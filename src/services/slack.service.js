const { WebClient } = require("@slack/web-api");

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

const sendSlackMessage = async (channel, message, blocks) => {
  if (!channel) {
    console.error("Channel is required to send a Slack message.");
    return;
  }
  
  try {
    await slackClient.chat.postMessage({
      channel,
      text: message,
      blocks,
    });
    console.log(`Message sent to Slack channel ${channel}`);
  } catch (error) {
    console.error(`Error sending message to Slack: ${error.message}`);
  }
};

module.exports = { sendSlackMessage };
