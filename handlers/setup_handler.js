class SetupHandler {
    constructor(){
        this.ACTION_SETUP = 4
    }
    

    async handleSetup(req, res,pool, slackTool ,team, user ) {
    let context = {
      action: this.ACTION_SETUP,
      role: -1,
      level: -1,
      type: -1,
      result_index: 0,
    };
    let response_message = await slackTool.getSetupResponse(req, res, pool, context);
    
    let imParams = {
      "text": `some message`,
      "channel": `${user.slack_user_id}`,
      "blocks": response_message.blocks
    }
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

module.exports = SetupHandler;