
var slackTool = require('./slack/messages');
const express = require('express')
const path = require('path')
const User = require('./data-objects/user');
const SetupHandler = require('./handlers/setup_handler');
const setupHandler = new SetupHandler();

const Interview = require('./data-objects/interview');
const PORT = process.env.PORT || 5000
const ACTION_GET_QUESTION = 1;
const ACTION_INTERVIEW_DASHBOARD = 2;
const ACTION_PANELIST_QUESTION = 3;

const slackToken = process.env.SLACK_TOKEN;
const PUBLIC_TEAM_ID = -1;
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});
const Template = require('./data-objects/template');
const templateDO = new Template(pool);

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))

  .post('/setup', express.urlencoded({ extended: true }), async (req, res) => {
    res.status(200).send(':writing_hand: Preping setup...:writing_hand: ');
    setupHandler.handleSetupSlashCommand(req, res, pool, slackTool);
  })
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
    });


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
    const userDO = new User();
    const user = await userDO.getUserBySlackID(response.user.id, pool);

    if (response.type === "block_actions") {
      let response_url = response.response_url;
      let value = response.actions[0];
      if (!value) value = response.actions[0].selected_option
      console.log("got type" + JSON.stringify(value));

      // extract the context
      let contextStr = value.block_id;
      let context = slackTool.decodeBlockID(contextStr);

      if (context.action == setupHandler.ACTION_SETUP) {

        if (value.action_id === "filter_by_role") {
          context.role = parseInt(value.selected_option.value);
        } else if (value.action_id === "filter_by_level") {
          context.level = parseInt(value.selected_option.value);
        } else if (value.action_id === "create_new") {
          //todo: figure team id
          //todo: get role and level name
          console.log("got user" + user);
          let newTemplate = await templateDO.createTemplate(context.role, context.level, -1, "Custom Template", user.id);
          context.template_id = newTemplate.id;
        } else if (value.action_id === "add_onsite_interview_type") {
          // prompt user to add Competency
          context.org_msg_ts = response.container.message_ts;
          context.org_channel = response.channel.id;

          let msg = await slackTool.getAddOnsiteInterviewTypeResponse(response.trigger_id, context);
          //console.log("****view msg"+ JSON.stringify(msg) );
          const fetch = require('node-fetch');
          let debug = await fetch("https://slack.com/api/views.open", {
            method: 'post',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${slackToken}`
            },
            body: `${JSON.stringify(msg)}`
          });
          //let jsonDebug = await debug.json();
          //console.log("****debug"+ JSON.stringify(jsonDebug) );
        } else if (value.action_id === "competency_actions"){
          let subAction = value.selected_option.value.split("|")[0];
          let competencyId = value.selected_option.value.split("|")[1];
          if (subAction == "remove") {
            let template = await templateDO.getTemplateById(context.template_id);
            let result = await template.removeCompetency(competencyId);
            //let result = await template.removeInterviewType(onsiteInterview);
          } else if (subAction == "edit") {
            context.org_msg_ts = response.container.message_ts;
            context.org_channel = response.channel.id;
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
                'Authorization': `Bearer ${slackToken}`
              },
              body: `${JSON.stringify(msg)}`
            });
          }

        }else if (value.action_id === "onsite_interview_actions") {
          let subAction = value.selected_option.value.split("|")[0];
          let onsiteInterview = value.selected_option.value.split("|")[1];

          if (subAction == "add") {
            context.org_msg_ts = response.container.message_ts;
            context.org_channel = response.channel.id;
            context.onsite_interview_type_id = onsiteInterview;
            let msg = await slackTool.getAddCompetencyResponse(response.trigger_id, context);
            const fetch = require('node-fetch');
            let debug = await fetch("https://slack.com/api/views.open", {
              method: 'post',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${slackToken}`
              },
              body: `${JSON.stringify(msg)}`
            });
          } else if (subAction == "remove") {
            let template = await templateDO.getTemplateById(context.template_id);
            let result = await template.removeInterviewType(onsiteInterview);
          } else if (subAction == "edit") {
            context.org_msg_ts = response.container.message_ts;
            context.org_channel = response.channel.id;
            context.onsite_interview_type_id = onsiteInterview;
            let template = await templateDO.getTemplateById(context.template_id);
            let onsite = await template.getInterviewById(onsiteInterview);
            let msg = await slackTool.getEditOnsiteInterviewTypeResponse(response.trigger_id, context, onsite.name);
            //console.log("****view msg"+ JSON.stringify(msg) );
            const fetch = require('node-fetch');
            let debug = await fetch("https://slack.com/api/views.open", {
              method: 'post',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${slackToken}`
              },
              body: `${JSON.stringify(msg)}`
            });
          }

        }
        let templates = null;
        let currentTemplate = null;
        if (context.template_id) {
          currentTemplate = await templateDO.getTemplateById(context.template_id);
        } else if (context.role > 0 && context.level > 0 && !context.current_template_id) {
          //console.log(`looking for  templates ${context.role}, ${context.level} `);
          // todo: fix team id -1 to be real
          currentTemplate = await templateDO.getTemplate(context.role, context.level, -1)
          //console.log("found template: "+currentTemplate.description);
          if (currentTemplate) {
            context.template_id = currentTemplate.id;
          } else {
            templates = await templateDO.getPublicTemplates(context.role, context.level);
          }

          //console.log("Found templates"+templates);
        }

        let response_message = await slackTool.getSetupResponse(req, res, pool, context, currentTemplate, templates);
        const fetch = require('node-fetch');
        let debug = await fetch(response_url, {
          method: 'post',
          body: `${JSON.stringify(response_message)}`
        })
        let dblog = await debug.json();
        console.log(dblog);

      } else if (context.action == ACTION_GET_QUESTION) {
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
        let action = value.action_id.split("|")[0];
        let data = value.action_id.split("|")[1];
        
        if (action == "select_panelist") {
          // add the panelist 
         
            let slackUserId = value.selected_user;
            let interviewType = data;
            let userDO = new User();
            let user = await userDO.getUserBySlackID(slackUserId, pool);
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
                slack_user_id: `${responseJSON.user.id}`,
                username: `${responseJSON.user.real_name}`,
                name: `${responseJSON.user.real_name}`,
                team_id: `2`
              }

              user = await userDO.create(userData, pool);
            }
            const res = await interview.addPanelist(user.id, interviewType, pool);

            // send a message to the panelist 
            context.result_index = 0;
            context.action == ACTION_PANELIST_QUESTION;
            let questions = await slackTool.getPannelistQuestionResponse(interview, interviewType, pool, context);
            /*
            //https://slack.com/api/chat.getPermalink
            const fetch1 = require('node-fetch');
              const responsePremLinkinfo = await fetch1("https://slack.com/api/chat.getPermalink", {
                method: 'post',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Authorization': `Bearer ${slackToken}`
                },
                body: `channel=${interview.slack_channel_id}&message_ts=${interview.slack_dashboard_msg_id}`
              });
              const premLinkResJSON = await responsePremLinkinfo.json();
              let link = premLinkResJSON.permalink;
              console.log("****** Link params   = "+`channel=${interview.slack_channel_id}&message_ts=${interview.slack_dashboard_msg_id}`);

              console.log("****** Link  = "+JSON.stringify(premLinkResJSON));
              */
            let imParams = {
              "text": `you have been invited to ${interview.candidate_name}'s interview pannel`,
              "channel": `${slackUserId}`,
              "blocks": questions
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

            // invite the panelist the channel

            let invite_options = {
              "channel": `${interview.slack_channel_id}`,
              "users": `${slackUserId}`
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
            });

            context.type = null;
          

        } else if (value.action_id == "remove_panelist") {

          let panelistId = value.value.split("|")[0];
          let questionsType = value.value.split("|")[1];
          console.log("need to remove " + panelistId);
          let userDO = new User();
          let removedUser = await userDO.getUserBySlackID(panelistId, pool);
          let rez = await interview.removePanelist(removedUser.id, questionsType, pool);


          let isOwner = await interview.isInterviewOwner(removedUser.id, pool);
          let isPannelist = await interview.isPanelists(removedUser.id, pool);
          // kick user from channel if not longer has a role
          if (!isOwner && !isPannelist) {
            console.log("!!!bye bye!!!");
            //todo: kick user
            let imParams = {
              "text": `you have been removed from ${interview.candidate_name}'s interview pannel`,
              "channel": `${panelistId}`
            }

            const fetch = require('node-fetch');
            let http_response = fetch("https://slack.com/api/chat.postMessage", {
              method: 'post',
              headers: {
                'Content-Type': 'application/json; charset=utf-8; charset=utf-8',
                'Authorization': `Bearer ${slackToken}`
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
                'Authorization': `Bearer ${slackToken}`
              },
              body: `${JSON.stringify(imParams)}`
            });

          }

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

      if(response.view.callback_id == "edit-competency"){
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
        let question2 = values.example_question2.example_question2_value.value;
        if (question2) template.addQuestion(competency_id, question2, template.user_id);
        let question3 = values.example_question3.example_question3_value.value;
        if (question3) template.addQuestion(competency_id, question3, template.user_id);


        let response_message = await slackTool.getSetupResponse(req, res, pool, context, template, null);


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
            'Authorization': `Bearer ${slackToken}`
          },
          body: `${JSON.stringify(imParams)}`
        });

        let debug = await http_response.json()

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
        template.addQuestion(competency_id, question1, template.user_id);
        let question2 = values.example_question2.example_question2_value.value;
        if (question2) template.addQuestion(competency_id, question2, template.user_id);
        let question3 = values.example_question3.example_question3_value.value;
        if (question3) template.addQuestion(competency_id, question3, template.user_id);


        let response_message = await slackTool.getSetupResponse(req, res, pool, context, template, null);


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
            'Authorization': `Bearer ${slackToken}`
          },
          body: `${JSON.stringify(imParams)}`
        });

        let debug = await http_response.json()

      } else if (response.view.callback_id == "edit-onsite-interview-type") {
        const values = response.view.state.values;
        let metadata = response.view.private_metadata;
        let context = slackTool.decodeBlockID(metadata);

        let template = await templateDO.getTemplateById(context.template_id);
        let rez = await template.editInterviewType(context.onsite_interview_type_id , values.onsite_interview_type.onsite_interview_type_value.value);
        delete context.onsite_interview_type_id;

        let response_message = await slackTool.getSetupResponse(req, res, pool, context, template, null);


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
            'Authorization': `Bearer ${slackToken}`
          },
          body: `${JSON.stringify(imParams)}`
        });

        let debug = await http_response.json()

      }else if (response.view.callback_id == "add-onsite-interview-type") {
        const values = response.view.state.values;
        let metadata = response.view.private_metadata;
        let context = slackTool.decodeBlockID(metadata);

        let template = await templateDO.getTemplateById(context.template_id);
        let rez = await template.addInterviewType(values.onsite_interview_type.onsite_interview_type_value.value);


        let response_message = await slackTool.getSetupResponse(req, res, pool, context, template, null);


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
            'Authorization': `Bearer ${slackToken}`
          },
          body: `${JSON.stringify(imParams)}`
        });

        let debug = await http_response.json()


      } else if (response.view.callback_id == "create-interview") {
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
                  //console.log(err, res);
                });
            };

            for (let index = 0; index < question_role_levels.length; index++) {
              const level_id = question_role_levels[index].value;
              const result3 = await client.query(`INSERT INTO question_levels(id, question_id, level_id )VALUES(DEFAULT, '${question_id}' ,'${level_id}')`,
                (err, res) => {
                  //console.log(err, res);
                });
            };
            if (question_tags) {
              for (let index = 0; index < question_tags.length; index++) {
                const tag_id = question_tags[index].value;
                const result4 = await client.query(`INSERT INTO question_tags(id, question_id, tag_id )VALUES(DEFAULT, '${question_id}' ,'${tag_id}')`,
                  (err, res) => {
                    //console.log(err, res);
                  });
              };
            }


          }
        );
        client.release();
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





/*
  .post('/add_question', express.urlencoded({ extended: true }), async (req, res) => {

    //console.log(req.body.trigger_id);
    res.end("Adding a question");
    let msg = await slackTool.getAddQuestionResponse(req, res, pool);
    //console.log(msg);

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
  })
  */