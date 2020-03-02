
var slackTool = require('./slack/messages');
const express = require('express')
const path = require('path')
const User = require('./data-objects/user');
const Interview = require('./data-objects/interview');
const PORT = process.env.PORT || 5000
const ACTION_GET_QUESTION = 1;
const ACTION_INTERVIEW_DASHBOARD = 2;
const slackToken = process.env.SLACK_TOKEN;
const PUBLIC_TEAM_ID = -1;
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .post('/interview_question', express.urlencoded({ extended: true }), async (req, res) => {

    //console.log(req.body);
    res.status(200).send(':writing_hand: Preping questions...:writing_hand: ');
    let context = {
      action: ACTION_GET_QUESTION,
      role: -1,
      level: -1,
      type: -1,
      result_index: 0,
    };
    let response_message = await slackTool.getQuestionResponse(req, res, pool, context);


    const fetch = require('node-fetch');
    fetch(req.body.response_url, {
      method: 'post',
      body: `${JSON.stringify(response_message)}`
    }).then((response) => {
      console.log("got respond");
    })
    console.log("end fetch");


  })
  .post('/add_question', express.urlencoded(), async (req, res) => {

    //console.log(req.body.trigger_id);
    res.end("Adding a question");
    let msg = await slackTool.getAddQuestionResponse(req, res, pool);
    console.log(msg);

    const fetch = require('node-fetch');
    fetch("https://slack.com/api/views.open", {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${slackToken}`
      },
      body: `${JSON.stringify(msg)}`
    }).then((response) => {
      //console.log("got respond"+ JSON.stringify(response));
    })
    //console.log("end fetch" + JSON.stringify(response_view1));


  }).post('/interview', express.urlencoded(), async (req, res) => {

    res.end(":hourglass_flowing_sand: preping an interview :hourglass_flowing_sand:");

    const userDO = new User();
    let currentUser = await userDO.getUserBySlackID(req.body.user_id, pool);
    //todo: fix team ID
    if (!currentUser) {
      currentUser = await userDO.create(
        {
          "slack_user_id": req.body.user_id,
          "name": req.body.user_name,
          "username": req.body.user_name,
          "team_id": 2
        },
        pool
      );

    }

    let msg = await slackTool.getInterviewResponse(req, res, pool);
    console.log(msg);
    const fetch = require('node-fetch');
    fetch("https://slack.com/api/views.open", {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${slackToken}`
      },
      body: `${JSON.stringify(msg)}`
    }).then((response) => {
      return response.json();
    }).then((myJson) => {
      // console.log("got respond" + JSON.stringify(myJson));
    });
    //console.log("end fetch" + JSON.stringify(response_view1));


  })

  .post('/interactive_callback', express.urlencoded(), async (req, res) => {

    res.status(200).send('');
    const response = JSON.parse(req.body.payload);

    if (response.type === "block_actions") {

      let response_url = response.response_url;
      let value = response.actions[0];
      if (!value) value = response.actions[0].selected_option
      console.log("got type" + JSON.stringify(value));

      // extract the context
      let contextStr = value.block_id;
      let context = slackTool.decodeBlockID(contextStr);

      if (context.action == ACTION_GET_QUESTION) {
        if (value.action_id === "get_next_questions") {
          context.result_index = parseInt(context.result_index) + 3;

        } else if (value.action_id === "get_prev_questions") {
          context.result_index = parseInt(context.result_index) - 3;

        } else if (value.action_id === "filter_by_role") {
          context.role = parseInt(value.selected_option.value);
        } else if (value.action_id === "filter_by_level") {
          context.level = parseInt(value.selected_option.value);
        } else if (value.action_id === "filter_by_type") {
          context.type = parseInt(value.selected_option.value);
        }
        let response_message = await slackTool.getQuestionResponse(req, res, pool, context);
        const fetch = require('node-fetch');
        fetch(response_url, {
          method: 'post',
          body: `${JSON.stringify(response_message)}`
        }).then((response) => {
          console.log("got respond");
        });


      } else if (context.action == ACTION_INTERVIEW_DASHBOARD) {
        let interviewDO = new Interview();
        let interview = await interviewDO.getInterviewById(context.interview_id, pool);
        //console.log("got dashboard interaction " + JSON.stringify(value));
        if (value.action_id == "select_pannelist") {
          context.pannelist_id = value.selected_user;
        } else if (value.action_id == "select_attribute") {
          context.type = parseInt(value.selected_option.value);
        } else if (value.action_id == "add_pannelist") {
          // add the pannelist 
          if (context.pannelist_id != null && context.type != null) {
            let slackUserId = context.pannelist_id;
            let questionsType = context.type;
            let userDO = new User();
            let user = await userDO.getUserBySlackID(context.pannelist_id, pool);
            if (user == null) {
              // create user on the fly
              //todo: catpture email and handle team //${myJson.user.team_id}

              const fetch = require('node-fetch');
              const responseinfo = await fetch("https://slack.com/api/users.info", {
                method: 'post',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                  'Authorization': `Bearer ${slackToken}`
                },
                body: `user=${slackUserId}`
              });
              const responseJSON = await responseinfo.json();
              let userData = {
                slack_user_id:`${responseJSON.user.id}`,
                username:`${responseJSON.user.real_name}`,
                name:`${responseJSON.user.real_name}`,
                team_id:`2`
              }
              
              user = await userDO.create(userData, pool);
              //interview.addPannelist(user.id, questionsType, pool);
            }
            interview.addPannelist(user.id, questionsType, pool);


            let imParams = {
              "text": `you have been invited to a pannel`,
              "channel": `${slackUserId}`
            }
            const fetch = require('node-fetch');
            fetch("https://slack.com/api/chat.postMessage", {
              method: 'post',
              headers: {
                'Content-Type': 'application/json; charset=utf-8; charset=utf-8',
                'Authorization': `Bearer ${slackToken}`
              },
              body: `${JSON.stringify(imParams)}`
            }).then((response) => {
              return response.json();
            }).then((myJson) = async (myJson) => {
            });


            context.pannelist_id = null;
            context.type = null;
          } else {
            //todo handle error message
          }

        }else if (value.action_id == "remove_pannelist")  {

          let pannelistId = value.value;
          console.log("need to remove "+ pannelistId);

        }

        let response_message = await slackTool.getInterviewDashboardResponse(interview, pool, context);

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


      if (response.view.callback_id == "create-interview") {
        // handle create interview flow 

        const values = response.view.state.values;


        const userDO = new User();
        let currentUser = await userDO.getUserBySlackID(response.user.id, pool);

        //todo: fix team_id
        let param = {
          "candidate_name": values.candidate_name.candidate_name_value.value,
          "owner_id": currentUser.id,
          "linkedin": values.linkedin_url.linkedin_url_value.value,
          "role_id": values.role.role_value.selected_option.value,
          "role_level_id": values.role_level.role_level_value.selected_option.value,
          "team_id": 2,
          "slack_channel_id": "",
          "slack_dashboard_msg_id": "",
          "notes": values.notes.notes_value.value,
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
        channelName = channelName.replace(" ", "_")
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
            'Authorization': `Bearer ${slackToken}`
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
              'Authorization': `Bearer ${slackToken}`
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
          postInterviewDashboard(interview, req, res, pool, context);


        });


      } else {
        // add question 

        const values = response.view.state.values;
        const question = values.question_text.question_text_value.value;
        const question_roles = values.question_roles.question_roles_value.selected_options;
        const question_role_levels = values.question_role_levels.question_role_levels_value.selected_options;
        const question_type = values.question_type.question_type_value.selected_option.value;
        const question_tags = values.question_tags.question_tags_value.selected_options;
        const question_notes = values.question_notes.question_notes_value.value;
        //console.log(JSON.stringify(question_roles));

        const client = await pool.connect();
        // **** todo: pull the author ID and team
        const result1 = await client.query(
          `INSERT INTO questions(id, question, question_type, visible, notes, author, author_team_id, team_id )VALUES(DEFAULT, '${question}' ,'${question_type}', '0', '${question_notes}','1','1', '${PUBLIC_TEAM_ID}' ) RETURNING id`,
          async (err, res) => {
            //console.log(err, res);
            //console.log( "A-sync:" +   JSON.stringify(res));
            const question_id = res.rows[0].id;
            console.log("A-sync ID:" + question_id);

            for (let index = 0; index < question_roles.length; index++) {
              const role_id = question_roles[index].value;
              const result2 = await client.query(`INSERT INTO question_roles(id, question_id, role_id )VALUES(DEFAULT, '${question_id}' ,'${role_id}')`,
                (err, res) => {
                  console.log(err, res);
                });
            };

            for (let index = 0; index < question_role_levels.length; index++) {
              const level_id = question_role_levels[index].value;
              const result3 = await client.query(`INSERT INTO question_levels(id, question_id, level_id )VALUES(DEFAULT, '${question_id}' ,'${level_id}')`,
                (err, res) => {
                  console.log(err, res);
                });
            };

            for (let index = 0; index < question_tags.length; index++) {
              const tag_id = question_tags[index].value;
              const result4 = await client.query(`INSERT INTO question_tags(id, question_id, tag_id )VALUES(DEFAULT, '${question_id}' ,'${tag_id}')`,
                (err, res) => {
                  console.log(err, res);
                });
            };

          }
        );
      }
    }


    //client.release();
    //"team":{"id":"T04QUFN4S","domain":"stryxapp"},"user":{"id":"U04QUFN56","username":"amirshevat","name":"amirshevat","team_id":"T04QUFN4S"}

    //console.log(`parsed form: ${question}, ${question_roles}, ${question_role_levels}, ${question_type}, ${question_tags}, ${question_notes}, `)

  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`))



async function postInterviewDashboard(interview, req, res, pool, context) {

  let dashboardBlock = await slackTool.getInterviewDashboardResponse(interview, pool, context);

  let msg = {
    "channel": `${interview.slack_channel_id}`,
    "text": `Starting Interview process`,
    "blocks": dashboardBlock
  }

  const fetch = require('node-fetch');
  fetch("https://slack.com/api/chat.postMessage", {
    method: 'post',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${slackToken}`
    },
    body: `${JSON.stringify(msg)}`
  }).then((response) => {
    return response.json();
  }).then((myJson) => {
    console.log("got sync post message" + JSON.stringify(myJson));

  });
}


