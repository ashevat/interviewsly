class StartHandler {
    constructor(){
        this.ACTION_START = 6;
    }
    

    async handleStartSlashCommand(slackTool, team, user ) {
      let context = {
        action: this.ACTION_START,
      };
    
    let response_message = await slackTool.getStartResponse(context);
    
    let imParams = {
      "text": `Interviewsly control panel`,
      "channel": `${user.slack_user_id}`,
      "blocks": response_message
    }

    console.log(imParams);

    const fetch = require('node-fetch');
    let slackRes = await fetch("https://slack.com/api/chat.postMessage", {
      method: 'post',
      headers: {
        'Content-Type': 'application/json; charset=utf-8; charset=utf-8',
        'Authorization': `Bearer ${team.token}`
      },
      body: `${JSON.stringify(imParams)}`
    })

    let jsonRes = await slackRes.json()
    console.log(jsonRes);
    }

}

module.exports = StartHandler;