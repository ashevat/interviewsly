
var slackTool = require('./slack/messages');
const SlackStrategy = require('passport-slack').Strategy;
const passport = require('passport');
const express = require('express')
const path = require('path')
const bodyParser = require('body-parser');


const getRawBody = require("raw-body");
const crypto = require("crypto");
const timingSafeCompare = require("tsscmp");


// handlers
const SetupHandler = require('./handlers/setup_handler');
const setupHandler = new SetupHandler();

const StartHandler = require('./handlers/start_handler');
const startHandler = new StartHandler();


// user and team for the context
let user = null;
let team = null;

const PORT = process.env.PORT || 5000
const ACTION_GET_QUESTION = 1;
const ACTION_INTERVIEW_DASHBOARD = 2;
const ACTION_PANELIST_QUESTION = 3;
const ACTION_ASSESSMENT = 5;
const clientId = process.env.SLACK_CLIENT_ID;
const clientSecret = process.env.SLACK_CLIENT_SECRET;
const baseURL = process.env.BASE_URL;
const stripeSK = process.env.STRIPE_SK;
const stripePK = process.env.STRIPE_PK;
const stripeStandardPlan = process.env.STRIPE_STANDARD_PLAN;
const stripeActivateWebhookSigning = process.env.STRIPE_WEBHOOK_SIGNING;
const stripeDeactivateWebhookSigning = process.env.STRIPE_DEACTIVATE_WEBHOOK_SIGNING;
const cronSecret = process.env.CRON_SECRET;
const signingSecret = process.env.SLACK_SIGNING_SECRET;

const PUBLIC_TEAM_ID = -1;
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});
const stripe = require('stripe')(stripeSK);

// data objects
const User = require('./data-objects/user');
const Team = require('./data-objects/team');
const Interview = require('./data-objects/interview');
const Template = require('./data-objects/template');
const templateDO = new Template(pool);


passport.use(new SlackStrategy({
  clientID: clientId,
  clientSecret: clientSecret,
  callbackURL: baseURL + "/auth/slack/callback"
}, (accessToken, refreshToken, profile, done) => {
  // optionally persist profile data
  done(null, profile);
}
));

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});
session = require("express-session");

express()
  .use(express.static(path.join(__dirname, 'public')))
  .use(session({ secret: "cats" }))
  .use(require('body-parser').urlencoded({
    extended: true, verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  }))
  .use(passport.initialize())
  .use(passport.session())
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => {
    let results = { "user": req.user };
    res.render('pages/index', results);
  })
  .get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  })
  .get('/auth/slack', passport.authenticate('slack'))
  .get('/auth/slack/callback', passport.authenticate('slack', { failureRedirect: '/' }), (req, res) => res.redirect('/billed'))
  .get('/pre-active', async (req, res) => {
    if (!req.user) {
      res.redirect('/');
      return;
    }

    //console.log("pre active user" + JSON.stringify(req.user));
    console.log("pre active user id" + JSON.stringify(req.user.id));
    const userDO = new User();
    let ownerUser = await userDO.getUserBySlackID(req.user.id, pool);
    let rawdata = JSON.parse(ownerUser.raw);

    const standardStripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      subscription_data: {
        items: [{
          plan: stripeStandardPlan,
        }],
        trial_from_plan: true,
      },
      success_url: baseURL + '/billed?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: baseURL + '/pre-active',
      client_reference_id: req.user.id,
      customer_email: rawdata.user.profile.email
    });


    let results = { "data": req.user, "stripe": { "standard_plan_session": standardStripeSession, "pk": stripePK } };
    //console.log("Resutls"+ JSON.stringify(results));

    res.render('pages/pre-active', results);
  }).post('/events', express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }), async (request, response) => {
    //console.log("got event"+ JSON.stringify(request.body));
    response.send("ok");
    //verify the request
    let parseRawBody = request.rawBody;
    //console.log("body"+parseRawBody);
    let goodCall = verifyRequestSignature(signingSecret, request.headers, parseRawBody);
    if (!goodCall) {
      console.error("bad call!!! verification faild!");
      return;
    }

    let team_id = request.body.team_id;
    let teamDO = new Team();
    team = await teamDO.getTeamBySlackID(team_id, pool);
    let eventType = request.body.event.type;
    let channelId = request.body.event.channel;
    if (eventType == "group_archive") {
      let interviewDO = new Interview();
      let interview = await interviewDO.getInterviewByChannel(channelId, pool);
      if (interview) {
        await interview.updateStatus(0, pool);
        await setTeamAndUser(request.body.event.actor_id, request.body.team_id);
        await updateAppHome();
      }
    } else if (eventType == "group_unarchive") {
      let interviewDO = new Interview();
      let interview = await interviewDO.getInterviewByChannel(channelId, pool);
      if (interview) {
        await interview.updateStatus(1, pool);
        await setTeamAndUser(request.body.event.actor_id, request.body.team_id);
        await updateAppHome();
      }
    } else if (eventType == "app_home_opened") {
      //console.log("got home event:" + JSON.stringify(request.body));
      await setTeamAndUser(request.body.event.user, request.body.team_id);
      await updateAppHome();
    } if (eventType == "message") {
      let eventSubtype = request.body.event.subtype;
      if (eventSubtype == "message_changed") {
        console.log("ignoring update message");
      } else {
        await setTeamAndUser(request.body.event.user, request.body.team_id);
        //let responseBlocks = slackTool.getStartResponse();
        if (request.body.event.bot_id) {
          console.log("ignoring bot message");
        } else {
          console.log("human message message");
          startHandler.handleStartSlashCommand(slackTool, team, user);

        }
      }
      //;
    }



    //console.log(request.body);
    //response.send(request.body.challenge); 

  }).post('/deactivate', bodyParser.raw({ type: 'application/json' }), async (request, response) => {
    // this is a callback webhook from stripe when a user pays.
    const sig = request.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(request.body, sig, stripeDeactivateWebhookSigning);
    } catch (err) {
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }
    console.log(":(  team unsubscribed " + JSON.stringify(event));
    response.json({ received: true });
  })
  .post('/activate', bodyParser.raw({ type: 'application/json' }), async (request, response) => {
    // this is a callback webhook from stripe when a user pays.
    const sig = request.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(request.body, sig, stripeActivateWebhookSigning);
    } catch (err) {
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      //console.log("user id "+JSON.stringify(session));
      let paying_user_id = session.client_reference_id;
      let userDO = new User();
      user = await userDO.getUserBySlackID(paying_user_id, pool);
      console.log("plan: " + JSON.stringify(session.display_items[0]));

      let teamDO = new Team();
      team = await teamDO.getTeam(user.team_id, pool);
      await team.activateTeam(session.display_items[0].plan.id, JSON.stringify(session), pool);
      console.log("Team activated " + team.slack_team_id);
    }

    // Return a response to acknowledge receipt of the event
    response.json({ received: true });
  }).get('/privacy', async (req, res) => {
    res.render('pages/privacy');

  }).get('/support', async (req, res) => {
    res.render('pages/support');

  }).get('/slack_redirect', async (req, res) => {
    res.redirect('https://slack.com/oauth/v2/authorize?client_id=959957947635.974835054183&scope=channels:manage,chat:write,commands,groups:read,groups:write,im:history,im:write,mpim:write,users:read,users:read.email');

  }).get('/activate_basic', async (req, res) => {


    if (!req.user) {
      res.redirect('/');
      return;
    }
    //console.log("got user billed check"+ JSON.stringify(req.user));
    let teamDO = new Team();
    team = await teamDO.getTeamBySlackID(req.user.team.id, pool);
    await team.activateTeamBasic("Basic", "Basic", pool);
    console.log("Team activated" + team.slack_team_id);
    res.redirect("/billed");

    // Return a response to acknowledge receipt of the event
    //response.json({ received: true });
  }).get('/activate_covid', async (req, res) => {


    if (!req.user) {
      res.redirect('/');
      return;
    }
    //console.log("got user billed check"+ JSON.stringify(req.user));
    let teamDO = new Team();
    team = await teamDO.getTeamBySlackID(req.user.team.id, pool);
    await team.activateTeamTrial("covid-19", "covid-19", pool);
    console.log("Team activated" + team.slack_team_id);
    res.redirect("/billed");

    // Return a response to acknowledge receipt of the event
    //response.json({ received: true });
  }).get('/cron', async (req, res) => {
    let curCronSecret = req.query.code;
    if (!curCronSecret || CurCronSecret != cronSecret) {
      res.status(500).send("unauthorized");
      return;
    }
    console.log("running cron");

    let teamDO = new Team();
    let teams = await teamDO.getActiveTeamData(pool);
    let userDO = new User();
    for (let index = 0; index < teams.length; index++) {
      const curTeam = teams[index];
      console.log("Processing team:" + curTeam.name)
      let panelists = await userDO.getTodaysPanelistsToNotify(curTeam.id, pool);
      for (let index = 0; index < panelists.length; index++) {
        const panelist = panelists[index];
        console.log(`Notifing panalist ${panelist.name} about message ${panelist.link_to_questions} `);
        //todo: enable and test this line
        await userDO.panalistNotified(panelist.panelist_id, panelist.interview_id, pool);
        let reminder = [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `:bell: Reminder - you have an <${panelist.link_to_questions}|interview> today :bell:`
            }
          }
        ]
        let imParams = {
          "text": `Thank you for installing Interviewsly!`,
          "channel": `${panelist.slack_user_id}`,
          "blocks": reminder
        }
        const fetch2 = require('node-fetch');
        let http_response = fetch2("https://slack.com/api/chat.postMessage", {
          method: 'post',
          headers: {
            'Content-Type': 'application/json; charset=utf-8; charset=utf-8',
            'Authorization': `Bearer ${curTeam.token}`
          },
          body: `${JSON.stringify(imParams)}`
        });


      }

    }


    res.status(200).send("done");

  }).get('/billed', async (req, res) => {
    // routes the user to the dashboard if account is active or to the re-active page if not.
    if (!req.user) {
      res.redirect('/');
      return;
    }
    let teamDO = new Team();
    team = await teamDO.getTeamBySlackID(req.user.team.id, pool);
    if (!team) {
      res.redirect("/slack_redirect");
      // this is for BETA interviewsly:
      //res.redirect("https://slack.com/oauth/v2/authorize?client_id=959957947635.1000424138385&scope=commands,channels:manage,chat:write,groups:write,im:write,mpim:write,users:read,users:read.email,channels:read,groups:read,im:history");
      return;
    }
    if (team.status < 1) {
      res.redirect("/pre-active");
    } else {
      res.redirect("/dashboard");
    }
    //console.log("Billed user!"+req.query.session_id);

  }).get('/unsubscribe', async (req, res) => {
    if (!req.user) {
      res.redirect('/');
      return;
    }
    const userDO = new User();
    let currentUser = await userDO.getUserBySlackID(req.user.id, pool);

    let teamDO = new Team();
    team = await teamDO.getTeam(currentUser.team_id, pool);
    if(team.status == 1){
      let rawData = JSON.parse(await team.deactivateTeam(pool));
      let subscription = rawData.subscription;
      stripe.subscriptions.del(subscription);
    }else{
      await team.deactivateTeam(pool);
    }
    
    res.redirect("/pre-active");
  })
  .get('/account', async (req, res) => {
    if (!req.user) {
      res.redirect('/');
      return;
    }

    const userDO = new User();
    let currentUser = await userDO.getUserBySlackID(req.user.id, pool);
    let rawData = JSON.parse(currentUser.raw);
    let teamDO = new Team();
    team = await teamDO.getTeam(currentUser.team_id, pool);
    if (team.status < 1) {
      res.redirect("/pre-active");
      return;
    }
    currentUser.photo = rawData.user.profile.image_48;
    let results = {
      user: currentUser,
      team: team,
    };
    res.render('pages/account', results);

  })
  .get('/dashboard', async (req, res) => {
    // routes the user to the dashboard if account is active or to the re-active page if not.
    if (!req.user) {
      res.redirect('/');
      return;
    }

    const userDO = new User();
    let currentUser = await userDO.getUserBySlackID(req.user.id, pool);
    let rawData = JSON.parse(currentUser.raw);
    let teamDO = new Team();
    team = await teamDO.getTeam(currentUser.team_id, pool);
    if (team.status < 1) {
      res.redirect("/pre-active");
      return;
    }
    let interviewDO = new Interview();
    let activeInterviews = await interviewDO.getInterviewDataByStatus(1, team.id, pool);
    let archivedInterviews = await interviewDO.getInterviewDataByStatus(0, team.id, pool);
    //console.log("User photo: "+ JSON.stringify(rawData.user.profile.image_48));
    currentUser.photo = rawData.user.profile.image_48;

    let results = {
      user: currentUser,
      team: team,
      activeInterviews: activeInterviews,
      archivedInterviews: archivedInterviews
    };
    res.render('pages/dashboard', results);
  })
  .get('/auth', async (req, res) => {

    let code = req.query.code;
    const fetch = require('node-fetch');
    const responseinfo = await fetch("	https://slack.com/api/oauth.v2.access", {
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `code=${code}&client_secret=${clientSecret}&client_id=${clientId}`
    });
   // console.log(`code=${code}&client_secret=${clientSecret}&client_id=${clientId}`);
    const responseJSON = await responseinfo.json();
   //console.log("got response" + JSON.stringify(responseJSON));
    let owner_slack_id = responseJSON.authed_user.id;
    let token = responseJSON.access_token;
    const userDO = new User();
    let ownerUser = await userDO.getUserBySlackID(owner_slack_id, pool);
    if (!ownerUser) {

      const fetch = require('node-fetch');
      const responseinfo1 = await fetch("https://slack.com/api/users.info", {
        method: 'post',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`
        },
        body: `user=${owner_slack_id}`
      });
      const responseJSON1 = await responseinfo1.json();
      let userData = {
        slack_user_id: `${responseJSON1.user.id}`,
        username: `${responseJSON1.user.name}`,
        name: `${responseJSON1.user.real_name}`,
        team_id: `-1`,
        raw: JSON.stringify(responseJSON1)
      }

      ownerUser = await userDO.create(userData, pool);
    }

    let team = new Team();
    let curteam = await team.getTeamBySlackID(responseJSON.team.id, pool);
    if (!curteam) {
      const teamParams = {
        "owner_id": ownerUser.id,
        "owner_slack_id": ownerUser.slack_user_id,
        "token": responseJSON.access_token,
        "slack_team_id": responseJSON.team.id,
        "name": responseJSON.team.name,
        "raw": JSON.stringify(responseJSON)
      }

      curteam = await team.create(teamParams, pool);
    } else {
      await curteam.updateToken(responseJSON.access_token, pool);
      await curteam.updateRaw(JSON.stringify(responseJSON), pool);
    }

    ownerUser = await ownerUser.updateTeamId(curteam.id, pool);
    let context = {
      action: startHandler.ACTION_START,
    };
    let welcomeBlocks = await slackTool.getWelcomeResponse(context);
    let imParams = {
      "text": `Thank you for installing Interviewsly!`,
      "channel": `${ownerUser.slack_user_id}`,
      "blocks": welcomeBlocks
    }
    const fetch2 = require('node-fetch');
    let http_response = fetch2("https://slack.com/api/chat.postMessage", {
      method: 'post',
      headers: {
        'Content-Type': 'application/json; charset=utf-8; charset=utf-8',
        'Authorization': `Bearer ${responseJSON.access_token}`
      },
      body: `${JSON.stringify(imParams)}`
    });

    let systemUser = {
      "user": { "name": ownerUser.name, "id": ownerUser.slack_user_id },
      "team": { "id": curteam.slack_team_id },
      "id": ownerUser.slack_user_id
    }

    console.log("login user" + JSON.stringify(systemUser));

    req.login(systemUser, function (err) {
      if (err) {
        console.error(err);
        return next(err);
      }
      //console.log("auto login user"+ JSON.stringify(req.user));
      return res.redirect('/billed');
    });


  })
  .post('/setup', express.urlencoded({ extended: true }), async (req, res) => {
    await setTeamAndUser(req.body.user_id, req.body.team_id);
    res.status(200).send(':writing_hand: Preping setup...:writing_hand: ');
    setupHandler.handleSetup(req, res, pool, slackTool, team, user);

  }).post('/interview', express.urlencoded(), async (req, res) => {
    await setTeamAndUser(req.body.user_id, req.body.team_id);
    res.end("");

    let msg = await slackTool.getInterviewResponse(req.body.trigger_id, pool);
    //console.log(msg);
    const fetch = require('node-fetch');
    fetch("https://slack.com/api/views.open", {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${team.token}`
      },
      body: `${JSON.stringify(msg)}`
    });
    //console.log("end fetch" + JSON.stringify(response_view1));

  }).post('/start', express.urlencoded(), async (req, res) => {

    let text = req.body.text;
    if (text.toLowerCase() == "feedback" || text.toLowerCase() == "help") {
      res.end("To get started, head to the Interviewly app home in Slack. If you need further assistance, or want to give us feedback, please contact us at support@interviewsly.com");
      return;
    }
    await setTeamAndUser(req.body.user_id, req.body.team_id);
    res.end("");

    //let responseBlocks = slackTool.getStartResponse();
    startHandler.handleStartSlashCommand(slackTool, team, user);

  })

  .post('/interactive_callback', async (req, res) => {

    res.status(200).send('');
    //verify the request
    let parseRawBody = req.rawBody;
    let goodCall = verifyRequestSignature(signingSecret, req.headers, parseRawBody);
    if (!goodCall) {
      console.error("bad call, verification failed");
      return;
    }

    const response = JSON.parse(req.body.payload);
    await setTeamAndUser(response.user.id, response.team.id);
    //console.log("got interactive event:"+  JSON.stringify(response) );
    if (response.type === "shortcut") {
      // mimic click on "Start an Interview Panel"
      response.type = "block_actions";
      response.actions = [{ "action_id": "new_interview", "block_id": "6666|src=app_home&action=6" }];
    }

    if (response.type === "block_actions") {
      let response_url = response.response_url;
      let value = response.actions[0];
      if (!value) value = response.actions[0].selected_option
      console.log("got type" + JSON.stringify(value));

      // extract the context
      let contextStr = value.block_id;
      let context = slackTool.decodeBlockID(contextStr);

      if (context.action == startHandler.ACTION_START) {
        let trigger = response.trigger_id;
        if (value.action_id === "new_interview") {
          let msg = await slackTool.getInterviewResponse(trigger, pool);
          console.log(msg);
          const fetch = require('node-fetch');
          fetch("https://slack.com/api/views.open", {
            method: 'post',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${team.token}`
            },
            body: `${JSON.stringify(msg)}`
          });
        } else if (value.action_id === "setup") {
          if (context.src && context.src === "app_home") {

            let context = {
              action: 4,
              role: -1,
              level: -1,
              type: -1,
              result_index: 0,
              src: "app_home"
            };
            let setupBlocks = await slackTool.getSetupResponse(req, res, pool, context);

            await updateAppHome(setupBlocks);

          } else {
            setupHandler.handleSetup(req, res, pool, slackTool, team, user);
          }

        }

      } else if (context.action == setupHandler.ACTION_SETUP) {

        if (value.action_id === "filter_by_role") {
          context.role = parseInt(value.selected_option.value);
        } else if (value.action_id === "filter_by_level") {
          context.level = parseInt(value.selected_option.value);
        } else if (value.action_id === "clone_template") {
          let newTemplate = await templateDO.clonePublicTemplate(context.role, context.level, team.id, user.id);
          context.template_id = newTemplate.id;
        } else if (value.action_id === "revert_template") {
          await templateDO.removeTemplate(context.template_id);
          delete context.template_id;
        }
        else if (value.action_id === "create_new") {
          //console.log("got user" + user);
          let newTemplate = await templateDO.createTemplate(context.role, context.level, team.id, "Custom Template", user.id);
          context.template_id = newTemplate.id;
        } else if (value.action_id === "done_template_setup") {
          if (context.src && context.src === "app_home") {
            updateAppHome()
            return;
          } else {
            let imParams = {
              "text": `Thank you for installing Interviewsly!`,
              "blocks": [{
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "Setup done!\n _Pro tip: You can always re-access interviewsly setup by typing `/interviewsly` in Slack._"
                }

              }]
            }
            const fetch = require('node-fetch');
            let debug = await fetch(response_url, {
              method: 'post',
              body: `${JSON.stringify(imParams)}`
            })
            return;
          }


        } else if (value.action_id === "add_onsite_interview_type") {
          // prompt user to add Competency
          context.org_msg_ts = response.container.message_ts;
          if (response.channel) context.org_channel = response.channel.id;
          let msg = await slackTool.getAddOnsiteInterviewTypeResponse(response.trigger_id, context);
          //console.log("****view msg"+ JSON.stringify(msg) );
          const fetch = require('node-fetch');
          let debug = await fetch("https://slack.com/api/views.open", {
            method: 'post',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${team.token}`
            },
            body: `${JSON.stringify(msg)}`
          });
          //let jsonDebug = await debug.json();
          //console.log("****debug"+ JSON.stringify(jsonDebug) );
        } else if (value.action_id === "competency_actions") {
          let subAction = value.selected_option.value.split("|")[0];
          let competencyId = value.selected_option.value.split("|")[1];
          if (subAction == "remove") {
            let template = await templateDO.getTemplateById(context.template_id);
            let result = await template.removeCompetency(competencyId);
            //let result = await template.removeInterviewType(onsiteInterview);
          } else if (subAction == "edit") {
            context.org_msg_ts = response.container.message_ts;
            if (response.channel) context.org_channel = response.channel.id;
            context.competency_id = competencyId;
            let template = await templateDO.getTemplateById(context.template_id);
            let questions = await template.getQuestions(competencyId);
            let competency = await template.getCompetency(competencyId);

            let msg = await slackTool.getEditCompetencyResponse(response.trigger_id, context, competency, questions);
            const fetch = require('node-fetch');
            let debug = await fetch("https://slack.com/api/views.open", {
              method: 'post',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${team.token}`
              },
              body: `${JSON.stringify(msg)}`
            });
          }

        } else if (value.action_id === "onsite_interview_actions") {
          let subAction = value.selected_option.value.split("|")[0];
          let onsiteInterview = value.selected_option.value.split("|")[1];

          if (subAction == "add") {
            context.org_msg_ts = response.container.message_ts;
            if (response.channel) context.org_channel = response.channel.id;
            context.onsite_interview_type_id = onsiteInterview;
            let msg = await slackTool.getAddCompetencyResponse(response.trigger_id, context);
            const fetch = require('node-fetch');
            let debug = await fetch("https://slack.com/api/views.open", {
              method: 'post',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${team.token}`
              },
              body: `${JSON.stringify(msg)}`
            });
          } else if (subAction == "remove") {
            let template = await templateDO.getTemplateById(context.template_id);
            let result = await template.removeInterviewType(onsiteInterview);
          } else if (subAction == "edit") {
            context.org_msg_ts = response.container.message_ts;
            if (response.channel) context.org_channel = response.channel.id;
            context.onsite_interview_type_id = onsiteInterview;
            let template = await templateDO.getTemplateById(context.template_id);
            let onsite = await template.getInterviewTypeById(onsiteInterview);
            let msg = await slackTool.getEditOnsiteInterviewTypeResponse(response.trigger_id, context, onsite.name);
            //console.log("****view msg"+ JSON.stringify(msg) );
            const fetch = require('node-fetch');
            let debug = await fetch("https://slack.com/api/views.open", {
              method: 'post',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${team.token}`
              },
              body: `${JSON.stringify(msg)}`
            });
          }

        }
        let currentTemplate = null;
        let publicTemplate = null;
        if (context.template_id && context.template_id != "null") {
          currentTemplate = await templateDO.getTemplateById(context.template_id);
        } else if (context.role > 0 && context.level > 0 && !context.current_template_id) {
          currentTemplate = await templateDO.getTemplate(context.role, context.level, team.id);
          //console.log("found template: "+currentTemplate.description);

          if (currentTemplate) {
            context.template_id = currentTemplate.id;
          } else {
            // todo: copy the default template to this team, so user can edit it.
            publicTemplate = await templateDO.getPublicTemplateByRoleAndLevel(context.role, context.level);
          }

        }
        // todo potentialy route to app home
        let response_message = await slackTool.getSetupResponse(req, res, pool, context, currentTemplate, publicTemplate);
        if (context.src && context.src === "app_home") {
          await updateAppHome(response_message);
        } else {
          const fetch = require('node-fetch');
          let debug = await fetch(response_url, {
            method: 'post',
            body: `${JSON.stringify(response_message)}`
          })
          let dblog = await debug.json();

        }

        //console.log(dblog);

      } else if (context.action == ACTION_ASSESSMENT) {
        let interviewDO = new Interview();
        let interview = await interviewDO.getInterviewById(context.interview_id, pool);
        let action = value.action_id.split("|")[0];
        let data = value.action_id.split("|")[1];
        context.competency_id = data;

        if (action == "submit_final_assessment") {
          let msg = await slackTool.getFinalAssesmentResponse(response.trigger_id, interview, context, null, pool);

          const fetch = require('node-fetch');
          let debug = await fetch("https://slack.com/api/views.open", {
            method: 'post',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${team.token}`
            },
            body: `${JSON.stringify(msg)}`
          });

          let debugJson = await debug.json();
          //console.log(JSON.stringify(msg));

        } else if (action == "start_assessment") {
          let msg = await slackTool.getAssesmentResponse(response.trigger_id, interview, data, context, null, pool);
          const fetch = require('node-fetch');
          let debug = await fetch("https://slack.com/api/views.open", {
            method: 'post',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${team.token}`
            },
            body: `${JSON.stringify(msg)}`
          });

        } else if (action == "edit_assessment") {
          let assessment = await interview.getAssessment(context.panelist_id, context.competency_id, pool);
          let msg = await slackTool.getAssesmentResponse(response.trigger_id, interview, data, context, assessment, pool);
          const fetch = require('node-fetch');
          let debug = await fetch("https://slack.com/api/views.open", {
            method: 'post',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${team.token}`
            },
            body: `${JSON.stringify(msg)}`
          });

        }
        delete context.competency_id;
      } else if (context.action == ACTION_INTERVIEW_DASHBOARD) {
        let interviewDO = new Interview();
        let interview = await interviewDO.getInterviewById(context.interview_id, pool);
        let action = value.action_id.split("|")[0];
        let data = value.action_id.split("|")[1];

        if (action == "publish_result") {

          let dashboardBlock = await slackTool.getInterviewFinalAssessmentResultsResponse(interview, pool, context, user);

          let msg = {
            "channel": `${interview.slack_channel_id}`,
            "text": `Results of Interview Process`,
            "blocks": dashboardBlock
          }

          const fetch = require('node-fetch');
          let results = await fetch("https://slack.com/api/chat.postMessage", {
            method: 'post',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Authorization': `Bearer ${team.token}`
            },
            body: `${JSON.stringify(msg)}`
          });

        } else if (action == "select_panelist") {
          // add the panelist 

          let slackUserId = value.selected_user;
          let interviewType = data;
          let userDO = new User();
          let user = await userDO.getUserBySlackID(slackUserId, pool);
          if (user == null) {
            // create user on the fly          
            const fetch = require('node-fetch');
            const responseinfo = await fetch("https://slack.com/api/users.info", {
              method: 'post',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                'Authorization': `Bearer ${team.token}`
              },
              body: `user=${slackUserId}`
            });
            const responseJSON = await responseinfo.json();
            let userData = {
              slack_user_id: `${responseJSON.user.id}`,
              username: `${responseJSON.user.name}`,
              name: `${responseJSON.user.real_name}`,
              team_id: team.id,
              raw: JSON.stringify(responseJSON)
            }

            user = await userDO.create(userData, pool);
          }

          // send a message to the panelist 
          context.result_index = 0;
          context.action == ACTION_PANELIST_QUESTION;

          let assessmentContext = {
            "interview_id": context.interview_id,
            "interview_type": interviewType,
            "panelist_id": user.id,
            "action": ACTION_ASSESSMENT
          };

          let questions = await slackTool.getPannelistQuestionResponse(interview, interviewType, pool, assessmentContext);
          let imParams = {
            "text": `you have been invited to ${interview.candidate_name}'s interview pannel`,
            "channel": `${slackUserId}`,
            "blocks": questions
          }
          const fetch = require('node-fetch');
          let result = await fetch("https://slack.com/api/chat.postMessage", {
            method: 'post',
            headers: {
              'Content-Type': 'application/json; charset=utf-8; charset=utf-8',
              'Authorization': `Bearer ${team.token}`
            },
            body: `${JSON.stringify(imParams)}`
          });

          let jsonResults = await result.json();
          //console.log(">>>>> "+ JSON.stringify(jsonResults));
          let ts = jsonResults.ts;
          let channel = jsonResults.channel;
          let linkToMessage = await getMessageLink(channel, ts, team);
          const res = await interview.addPanelist(user.id, interviewType, ts, channel, linkToMessage, pool);
          // invite the panelist the channel

          let invite_options = {
            "channel": `${interview.slack_channel_id}`,
            "users": `${slackUserId}`
          }
          fetch("https://slack.com/api/conversations.invite", {
            method: 'post',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Authorization': `Bearer ${team.token}`
            },
            body: `${JSON.stringify(invite_options)}`
          }).then((response) => {
            return response.json();
          }).then((myJson) => {
          });

          //context.type = null;
          delete context.type;


        } else if (value.action_id == "schedule") {

          let panelistId = value.value.split("|")[0];
          let questionsType = value.value.split("|")[1];
          context.panelistId = panelistId;
          context.questionsType = questionsType;
          let msg = await slackTool.getScheduleResponse(response.trigger_id, context, pool);
          const fetch = require('node-fetch');
          let debug = await fetch("https://slack.com/api/views.open", {
            method: 'post',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${team.token}`
            },
            body: `${JSON.stringify(msg)}`
          });


        } else if (value.action_id == "remove_panelist") {

          let panelistId = value.value.split("|")[0];
          let questionsType = value.value.split("|")[1];
          console.log("need to remove " + panelistId);
          let userDO = new User();
          let removedUser = await userDO.getUserBySlackID(panelistId, pool);
          let result3 = await interview.removePanelist(removedUser.id, questionsType, pool);
          let imParams = {
            "text": `Request deprecated`,
            "channel": `${result3.channel_id}`,
            "ts": `${result3.message_id}`,
            "blocks": [{ "type": "divider" }, {
              "type": "section",
              "text": {
                "type": "plain_text",
                "text": "CANCELLED: you’ve been removed from this interview.",
                "emoji": true
              }
            }]
          }


          const fetch = require('node-fetch');
          let http_response = await fetch("https://slack.com/api/chat.update", {
            method: 'post',
            headers: {
              'Content-Type': 'application/json; charset=utf-8; charset=utf-8',
              'Authorization': `Bearer ${team.token}`
            },
            body: `${JSON.stringify(imParams)}`
          });

          let debug = await http_response.json();
          //console.log("<<< "+ JSON.stringify(imParams));
          //console.log("**** "+ JSON.stringify(debug));


          let isOwner = await interview.isInterviewOwner(removedUser.id, pool);
          let isPannelist = await interview.isPanelists(removedUser.id, pool);
          // kick user from channel if not longer has a role
          if (!isOwner && !isPannelist) {
            console.log("!!!bye bye!!!");
            //todo: kick user
            let imParams = {
              "text": `Your interview with ${interview.candidate_name} was cancelled.`,
              "channel": `${panelistId}`
            }

            const fetch = require('node-fetch');
            let http_response = fetch("https://slack.com/api/chat.postMessage", {
              method: 'post',
              headers: {
                'Content-Type': 'application/json; charset=utf-8; charset=utf-8',
                'Authorization': `Bearer ${team.token}`
              },
              body: `${JSON.stringify(imParams)}`
            });

          } else {
            let imParams = {
              "text": `your respinsibilities have been updated at ${interview.candidate_name}'s interview pannel`,
              "channel": `${panelistId}`
            }
            console.log("sending an update " + JSON.stringify(imParams));
            const fetch = require('node-fetch');
            let http_response = fetch("https://slack.com/api/chat.postMessage", {
              method: 'post',
              headers: {
                'Content-Type': 'application/json; charset=utf-8; charset=utf-8',
                'Authorization': `Bearer ${team.token}`
              },
              body: `${JSON.stringify(imParams)}`
            });

          }

        }
        //console.log("needed context" + JSON.stringify(context));
        let response_message = await slackTool.getInterviewDashboardResponse(interview, pool, context, team);

        let msg = {
          "text": `Starting Interview process`,
          "blocks": response_message
        }
        const fetch = require('node-fetch');
        fetch(response_url, {
          method: 'post',
          body: `${JSON.stringify(msg)}`
        }).then((response) => {
          return response.json()
        }).then((myJson) => {
          console.log("got respond:" + JSON.stringify(myJson));
        });

      }


    } else if (response.type === "view_submission") {
      if (response.view.callback_id == "schedule-interview") {
        console.log("schedule output" + JSON.stringify(response.view.state.values));
        const values = response.view.state.values;
        let metadata = response.view.private_metadata;
        let context = slackTool.decodeBlockID(metadata);
        let date = values.interview_date.interview_date_value.selected_date;
        let time = values.interview_time.interview_time_value.selected_option.value;

        let location = null;
        if (values.interview_location && values.interview_location.interview_location_value && values.interview_location.interview_location_value.value) {
          location = values.interview_location.interview_location_value.value;
        }
        //console.log(`context: ${JSON.stringify(context)}`);
        let interviewId = context.interview_id;
        let interviewType = context.questionsType;
        let panelistId = context.panelistId;
        const interviewDO = new Interview();
        let interview = await interviewDO.getInterviewById(interviewId, pool);
        await interview.setInterviewTypeTimeDateAndLocation(interviewType, panelistId, date, time, location, pool);

        // update the panelist interview panel

        let assessmentContext = {
          "interview_id": context.interview_id,
          "interview_type": context.questionsType,
          "panelist_id": panelistId,
          "action": ACTION_ASSESSMENT
        };

        let questions = await slackTool.getPannelistQuestionResponse(interview, context.questionsType, pool, assessmentContext);
        let onsite = await interview.getPanelist(context.questionsType, pool);
        let imParams = {
          "text": `updated`,
          "channel": `${onsite.channel_id}`,
          "ts": `${onsite.message_id}`,
          "blocks": questions
        }
        const fetch = require('node-fetch');
        let http_response = await fetch("https://slack.com/api/chat.update", {
          method: 'post',
          headers: {
            'Content-Type': 'application/json; charset=utf-8; charset=utf-8',
            'Authorization': `Bearer ${team.token}`
          },
          body: `${JSON.stringify(imParams)}`
        });

        // update the dashboard

        let dashboardContext = {
          "interview_id": context.interview_id,
          "action": ACTION_INTERVIEW_DASHBOARD
        };
        let response_message = await slackTool.getInterviewDashboardResponse(interview, pool, dashboardContext, team);
        let imParams2 = {
          "text": `updated`,
          "channel": `${interview.slack_channel_id}`,
          "ts": `${interview.slack_dashboard_msg_id}`,
          "blocks": response_message
        }
        const fetch2 = require('node-fetch');
        let http_response2 = await fetch2("https://slack.com/api/chat.update", {
          method: 'post',
          headers: {
            'Content-Type': 'application/json; charset=utf-8; charset=utf-8',
            'Authorization': `Bearer ${team.token}`
          },
          body: `${JSON.stringify(imParams2)}`
        });



      } else if (response.view.callback_id == "interview-assessment") {
        const values = response.view.state.values;
        let metadata = response.view.private_metadata;
        let context = slackTool.decodeBlockID(metadata);
        console.log("got values" + JSON.stringify(values));
        let interview_assessment = values.final_assesment.final_assesment_value.selected_option.value;
        let notes = values.final_assesment_notes.final_assesment_notes_value.value;
        const interviewDO = new Interview();
        let interview = await interviewDO.getInterviewById(context.interview_id, pool);
        interview.addInterviewAssessment(context.panelist_id, context.interview_type, interview_assessment, notes, pool);

        // update the panelist interview panel        
        let assessmentContext = {
          "interview_id": context.interview_id,
          "interview_type": context.interview_type,
          "panelist_id": user.id,
          "action": ACTION_ASSESSMENT
        };

        let questions = await slackTool.getPannelistQuestionResponse(interview, context.interview_type, pool, assessmentContext);
        let onsite = await interview.getPanelist(context.interview_type, pool);
        let imParams = {
          "text": `updated`,
          "channel": `${onsite.channel_id}`,
          "ts": `${onsite.message_id}`,
          "blocks": questions
        }
        const fetch = require('node-fetch');
        let http_response = await fetch("https://slack.com/api/chat.update", {
          method: 'post',
          headers: {
            'Content-Type': 'application/json; charset=utf-8; charset=utf-8',
            'Authorization': `Bearer ${team.token}`
          },
          body: `${JSON.stringify(imParams)}`
        });

        // update the dashboard

        let dashboardContext = {
          "interview_id": context.interview_id,
          "action": ACTION_INTERVIEW_DASHBOARD
        };
        let response_message = await slackTool.getInterviewDashboardResponse(interview, pool, dashboardContext, team);
        let imParams2 = {
          "text": `updated`,
          "channel": `${interview.slack_channel_id}`,
          "ts": `${interview.slack_dashboard_msg_id}`,
          "blocks": response_message
        }
        const fetch2 = require('node-fetch');
        let http_response2 = await fetch2("https://slack.com/api/chat.update", {
          method: 'post',
          headers: {
            'Content-Type': 'application/json; charset=utf-8; charset=utf-8',
            'Authorization': `Bearer ${team.token}`
          },
          body: `${JSON.stringify(imParams2)}`
        });

      } else if (response.view.callback_id == "assesment-intake") {
        const values = response.view.state.values;
        let metadata = response.view.private_metadata;
        let context = slackTool.decodeBlockID(metadata);
        let assessment = values.onsite_interview.onsite_interview_value.value;

        let notes = "N/A";
        if (values.interview_notes && values.interview_notes.interview_notes_value && values.interview_notes.interview_notes_value.value) {
          notes = values.interview_notes.interview_notes_value.value;
        }
        const interviewDO = new Interview();
        let interview = await interviewDO.getInterviewById(context.interview_id, pool);

        let prevAssessment = await interview.getAssessment(context.panelist_id, context.competency_id, pool);
        if (!prevAssessment) {
          let result = await interview.addAssessment(context.panelist_id, context.competency_id, assessment, notes, pool);
        } else {
          console.log("updating assessment" + prevAssessment.id)
          let result = await interview.updateAssessment(prevAssessment.id, assessment, notes, pool);
        }

        // update the interview panel
        let assessmentContext = {
          "interview_id": context.interview_id,
          "interview_type": context.interview_type,
          "panelist_id": user.id,
          "action": ACTION_ASSESSMENT
        };

        let questions = await slackTool.getPannelistQuestionResponse(interview, context.interview_type, pool, assessmentContext);
        let onsite = await interview.getPanelist(context.interview_type, pool);
        let imParams = {
          "text": `updated`,
          "channel": `${onsite.channel_id}`,
          "ts": `${onsite.message_id}`,
          "blocks": questions
        }
        const fetch = require('node-fetch');
        let http_response = await fetch("https://slack.com/api/chat.update", {
          method: 'post',
          headers: {
            'Content-Type': 'application/json; charset=utf-8; charset=utf-8',
            'Authorization': `Bearer ${team.token}`
          },
          body: `${JSON.stringify(imParams)}`
        });
        //let dbugObj = await http_response.json();
        //console.log("&&&&" + JSON.stringify(assessmentContext));

      } else if (response.view.callback_id == "edit-competency") {
        const values = response.view.state.values;
        let metadata = response.view.private_metadata;
        let context = slackTool.decodeBlockID(metadata);

        let template = await templateDO.getTemplateById(context.template_id);
        let competency_id = context.competency_id;
        let rez = await template.editCompetency(competency_id, values.competency.competency_value.value);
        delete context.competency_id;
        let rez2 = await template.removeQuestions(competency_id);

        let question1 = values.example_question1.example_question1_value.value;
        //todo: check if we can pull the user ID
        template.addQuestion(competency_id, question1, template.user_id);

        if (values.example_question2 && values.example_question2.example_question2_value) {
          let question2 = values.example_question2.example_question2_value.value;
          if (question2) await template.addQuestion(competency_id, question2, template.user_id);
        }
        if (values.example_question3 && values.example_question3.example_question3_value) {
          let question3 = values.example_question3.example_question3_value.value;
          if (question3) await template.addQuestion(competency_id, question3, template.user_id);
        }

        let response_message = await slackTool.getSetupResponse(req, res, pool, context, template, null);

        if (context.src && context.src == "app_home") {
          await updateAppHome(response_message);
        } else {
          let imParams = {
            "text": `added`,
            "channel": `${context.org_channel}`,
            "ts": `${context.org_msg_ts}`,
            "blocks": response_message.blocks
          }

          const fetch = require('node-fetch');
          let http_response = await fetch("https://slack.com/api/chat.update", {
            method: 'post',
            headers: {
              'Content-Type': 'application/json; charset=utf-8; charset=utf-8',
              'Authorization': `Bearer ${team.token}`
            },
            body: `${JSON.stringify(imParams)}`
          });
          let debug = await http_response.json()

        }


      } else if (response.view.callback_id == "add-competency") {

        const values = response.view.state.values;
        let metadata = response.view.private_metadata;
        let context = slackTool.decodeBlockID(metadata);

        let template = await templateDO.getTemplateById(context.template_id);
        let interview_type_id = context.onsite_interview_type_id
        let competency_id = await template.addCompetency(interview_type_id, values.competency.competency_value.value);
        delete context.onsite_interview_type_id;


        let question1 = values.example_question1.example_question1_value.value;
        console.log(`Adding question = ${interview_type_id}, ${competency_id} , ${question1} `);
        //todo: check if we can pull the user ID
        await template.addQuestion(competency_id, question1, template.user_id);
        if (values.example_question2 && values.example_question2.example_question2_value) {
          let question2 = values.example_question2.example_question2_value.value;
          if (question2) await template.addQuestion(competency_id, question2, template.user_id);
        }

        if (values.example_question3 && values.example_question3.example_question3_value) {
          let question3 = values.example_question3.example_question3_value.value;
          if (question3) await template.addQuestion(competency_id, question3, template.user_id);
        }



        let response_message = await slackTool.getSetupResponse(req, res, pool, context, template, null);

        if (context.src && context.src == "app_home") {
          await updateAppHome(response_message);
        } else {
          let imParams = {
            "text": `added`,
            "channel": `${context.org_channel}`,
            "ts": `${context.org_msg_ts}`,
            "blocks": response_message.blocks
          }

          const fetch = require('node-fetch');
          let http_response = await fetch("https://slack.com/api/chat.update", {
            method: 'post',
            headers: {
              'Content-Type': 'application/json; charset=utf-8; charset=utf-8',
              'Authorization': `Bearer ${team.token}`
            },
            body: `${JSON.stringify(imParams)}`
          });
          let debug = await http_response.json()
        }




      } else if (response.view.callback_id == "edit-onsite-interview-type") {
        const values = response.view.state.values;
        let metadata = response.view.private_metadata;
        let context = slackTool.decodeBlockID(metadata);

        let template = await templateDO.getTemplateById(context.template_id);
        let rez = await template.editInterviewType(context.onsite_interview_type_id, values.onsite_interview_type.onsite_interview_type_value.value);
        delete context.onsite_interview_type_id;

        let response_message = await slackTool.getSetupResponse(req, res, pool, context, template, null);

        if (context.src && context.src == "app_home") {
          await updateAppHome(response_message);
        } else {
          let imParams = {
            "text": `added`,
            "channel": `${context.org_channel}`,
            "ts": `${context.org_msg_ts}`,
            "blocks": response_message.blocks
          }

          const fetch = require('node-fetch');
          let http_response = await fetch("https://slack.com/api/chat.update", {
            method: 'post',
            headers: {
              'Content-Type': 'application/json; charset=utf-8; charset=utf-8',
              'Authorization': `Bearer ${team.token}`
            },
            body: `${JSON.stringify(imParams)}`
          });

          let debug = await http_response.json();

        }


      } else if (response.view.callback_id == "add-onsite-interview-type") {
        const values = response.view.state.values;
        let metadata = response.view.private_metadata;
        let context = slackTool.decodeBlockID(metadata);

        let template = await templateDO.getTemplateById(context.template_id);
        let rez = await template.addInterviewType(values.onsite_interview_type.onsite_interview_type_value.value);


        let response_message = await slackTool.getSetupResponse(req, res, pool, context, template, null);

        if (context.src && context.src == "app_home") {
          await updateAppHome(response_message);
        } else {
          let imParams = {
            "text": `added`,
            "channel": `${context.org_channel}`,
            "ts": `${context.org_msg_ts}`,
            "blocks": response_message.blocks
          }

          const fetch = require('node-fetch');
          let http_response = await fetch("https://slack.com/api/chat.update", {
            method: 'post',
            headers: {
              'Content-Type': 'application/json; charset=utf-8; charset=utf-8',
              'Authorization': `Bearer ${team.token}`
            },
            body: `${JSON.stringify(imParams)}`
          });

          let debug = await http_response.json()
        }



      } else if (response.view.callback_id == "create-interview") {
        // handle create interview flow 

        const values = response.view.state.values;

        const userDO = new User();
        let currentUser = await userDO.getUserBySlackID(response.user.id, pool);
        let linkedIn = "N/A";

        if (values.linkedin_url && values.linkedin_url.linkedin_url_value && values.linkedin_url.linkedin_url_value.value) {
          linkedIn = values.linkedin_url.linkedin_url_value.value;
        }

        let notes = "N/A";
        if (values.notes && values.notes.notes_value && values.notes.notes_value.value) {
          notes = values.notes.notes_value.value;
        }
        let param = {
          "candidate_name": values.candidate_name.candidate_name_value.value,
          "owner_id": currentUser.id,
          "linkedin": linkedIn,
          "role_id": values.role.role_value.selected_option.value,
          "role_level_id": values.role_level.role_level_value.selected_option.value,
          "team_id": team.id,
          "slack_channel_id": "",
          "slack_dashboard_msg_id": "",
          "link_to_dashboard": "",
          "notes": notes,
        }

        const interviewDO = new Interview();
        let interview = await interviewDO.create(param, pool);

        // cache known vars to save query to the DB
        interview.owner_name = response.user.name;
        interview.role_name = values.role.role_value.selected_option.text.text;
        interview.role_level_name = values.role_level.role_level_value.selected_option.text.text;
        //return;

        // create a channel for the interview
        let seed = Math.floor((Math.random() * 10000) + 1);
        let channelName = `Interview_${interview.candidate_name}_${seed}`;
        channelName = channelName.replace(/ /g, "_")
        channelName = channelName.toLowerCase();
        let options = {
          "name": channelName,
          "is_private": "true"
        }
        //console.log(JSON.stringify(options));
        const fetch = require('node-fetch');
        fetch("https://slack.com/api/conversations.create", {
          method: 'post',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': `Bearer ${team.token}`
          },
          body: `${JSON.stringify(options)}`
        }).then((response) => {
          return response.json();
        }).then((myJson) = async (myJson) => {
          // todo: handle channel creation errors
          let channelId = myJson.channel.id;
          interview = await interview.updateSlackChannelID(channelId, pool);

          console.log("after update channel:" + JSON.stringify(interview));

          let invite_options = {
            "channel": `${interview.slack_channel_id}`,
            "users": `${response.user.id}`
          }
          fetch("https://slack.com/api/conversations.invite", {
            method: 'post',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Authorization': `Bearer ${team.token}`
            },
            body: `${JSON.stringify(invite_options)}`
          }).then((response) => {
            return response.json();
          }).then((myJson) => {
            //console.log("got sync respond to invite channel" + JSON.stringify(myJson));

          });

          let context = {
            "action": ACTION_INTERVIEW_DASHBOARD,
            "interview_id": interview.id,
          };
          await postInterviewDashboard(interview, req, res, pool, context);
          await updateAppHome();

        });


      }
    }


    //client.release();
    //"team":{"id":"T04QUFN4S","domain":"stryxapp"},"user":{"id":"U04QUFN56","username":"amirshevat","name":"amirshevat","team_id":"T04QUFN4S"}

    //console.log(`parsed form: ${question}, ${question_roles}, ${question_role_levels}, ${question_type}, ${question_tags}, ${question_notes}, `)

  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`))



async function postInterviewDashboard(interview, req, res, pool, context) {

  let dashboardBlock = await slackTool.getInterviewDashboardResponse(interview, pool, context, team);

  let msg = {
    "channel": `${interview.slack_channel_id}`,
    "text": `Starting Interview process`,
    "blocks": dashboardBlock
  }

  const fetch = require('node-fetch');
  let results = await fetch("https://slack.com/api/chat.postMessage", {
    method: 'post',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${team.token}`
    },
    body: `${JSON.stringify(msg)}`
  });
  let jsonResults = await results.json()
  let ts = jsonResults.ts;
  let link = await getMessageLink(interview.slack_channel_id, ts, team);
  await interview.updateDashboardIdAndLink(ts, link, pool);
}

async function setTeamAndUser(slack_user_id, slack_team_id) {
  //let slack_user_id = req.body.user_id;
  //let slack_team_id = req.body.team_id;
  console.log("Slack user -" + slack_user_id);
  let teamDO = new Team();
  team = await teamDO.getTeamBySlackID(slack_team_id, pool);

  if (!team) {
    console.error("got request from an unknow team - " + JSON.stringify(req));
    return;
  }
  let token = team.token;

  let userDO = new User();
  user = await userDO.getUserBySlackID(slack_user_id, pool);
  if (!user) {
    // create user
    const fetch = require('node-fetch');
    const responseinfo1 = await fetch("https://slack.com/api/users.info", {
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`
      },
      body: `user=${slack_user_id}`
    });
    const responseJSON1 = await responseinfo1.json();
    let userData = {
      slack_user_id: `${responseJSON1.user.id}`,
      username: `${responseJSON1.user.name}`,
      name: `${responseJSON1.user.real_name}`,
      team_id: team.id,
      raw: JSON.stringify(responseJSON1)
    }

    user = await userDO.create(userData, pool);
  }

}

async function getMessageLink(slack_channel_id, slack_message_id, team) {
  const fetch1 = require('node-fetch');
  const responsePremLinkinfo = await fetch1("https://slack.com/api/chat.getPermalink", {
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${team.token}`
    },
    body: `channel=${slack_channel_id}&message_ts=${slack_message_id}`
  });
  const premLinkResJSON = await responsePremLinkinfo.json();
  let link = premLinkResJSON.permalink;
  return link;

}

async function updateAppHome(setupBlocks) {

  let context = { "src": "app_home", "action": startHandler.ACTION_START };
  let appHomeBlocks = await slackTool.getAppHomeResponse(user, context, pool, setupBlocks);
  //console.log("App home res:" + JSON.stringify(appHomeBlocks));
  let imParams = {
    "user_id": user.slack_user_id,

    "view": {
      "type": "home",
      "blocks": appHomeBlocks
    }

  }
  const fetch2 = require('node-fetch');
  let http_response = fetch2("https://slack.com/api/views.publish", {
    method: 'post',
    headers: {
      'Content-Type': 'application/json; charset=utf-8; charset=utf-8',
      'Authorization': `Bearer ${team.token}`
    },
    body: `${JSON.stringify(imParams)}`
  });

}

/**
 * Method to verify signature of requests
 *
 * @param signingSecret - Signing secret used to verify request signature
 * @param requestHeaders - The signing headers. If `req` is an incoming request, then this should be `req.headers`.
 * @param body - Raw body string
 * @returns Indicates if request is verified
 */
function verifyRequestSignature(signingSecret, requestHeaders, body) {
  //console.log(`debuging verify: '${signingSecret}', '${requestHeaders}', '${body}' `)
  // Request signature
  const signature = requestHeaders['x-slack-signature'];
  // Request timestamp
  const ts = parseInt(requestHeaders['x-slack-request-timestamp'], 10);

  // Divide current date to match Slack ts format
  // Subtract 5 minutes from current time
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - (60 * 5);

  if (ts < fiveMinutesAgo) {
    console.log('request is older than 5 minutes');
    return false;
  }

  const hmac = crypto.createHmac('sha256', signingSecret);
  const [version, hash] = signature.split('=');
  hmac.update(`${version}:${ts}:${body}`);

  if (!timingSafeCompare(hash, hmac.digest('hex'))) {
    console.log('request signature is not valid');
    return false;
  }

  console.log('request signing verification success');
  return true;
}