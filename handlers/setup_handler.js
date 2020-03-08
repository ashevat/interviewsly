class SetupHandler {
    constructor(){
        this.ACTION_SETUP = 4
    }
    

    async handleSetupSlashCommand(req, res,pool, slackTool ) {
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
      "channel": `${req.body.user_id}`,
      "blocks": response_message.blocks
    }
    const fetch = require('node-fetch');
    let slackRes = await fetch("https://slack.com/api/chat.postMessage", {
      method: 'post',
      headers: {
        'Content-Type': 'application/json; charset=utf-8; charset=utf-8',
        'Authorization': `Bearer ${slackTool.getSlackToket(req, res,pool)}`
      },
      body: `${JSON.stringify(imParams)}`
    })

    let jsonRes = await slackRes.json()
    console.log(jsonRes);
    }

}

module.exports = SetupHandler;