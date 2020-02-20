
var slackTool = require('./slack/messages');
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
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

    console.log(req.body);
    res.status(200).send('Preping questions...');


    let response_message = await slackTool.getQuestionResponse(req, pool);
    //console.log(JSON.stringify(response_message));


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

    let msg = await slackTool.getAddQuestionResponse(req, pool);
    console.log(msg);
    let slackToken = process.env.SLACK_TOKEN;
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
  .post('/interactive_callback', express.urlencoded(), async (req, res) => {    

    res.status(200).send('');
    const response = JSON.parse(req.body.payload);
    console.log("got interactive payload message" + JSON.stringify(response.message));
    console.log("got type" + JSON.stringify(response.type));
    if(response.type === "block_actions"){
      let context = {
        action:1,
        role: 1,
        level: 2,
        type: 3,
        keyword: "1_1_2"
      };
      console.log("got context" + slackTool.encodeBlockID(context));
      

    }else{
      const values = response.view.state.values;
      const question = values.question_text.question_text_value.value;
      const question_roles = values.question_roles.question_roles_value.selected_options;
      const question_role_levels = values.question_role_levels.question_role_levels_value.selected_options;
      const question_type = values.question_type.question_type_value.selected_option.value;
      const question_tags = values.question_tags.question_tags_value.selected_options;
      const question_notes = values.question_notes.question_notes_value.value;
      console.log(JSON.stringify(question_roles));
  
      const client = await pool.connect();
      // **** todo: pull the author ID and team
      const result1 = await client.query(
        `INSERT INTO questions(id, question, question_type, visible, notes, author, author_team_id, team_id )VALUES(DEFAULT, '${question}' ,'${question_type}', '0', '${question_notes}','1','1', '-1' ) RETURNING id`,
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
    
 
    //client.release();
    //"team":{"id":"T04QUFN4S","domain":"stryxapp"},"user":{"id":"U04QUFN56","username":"amirshevat","name":"amirshevat","team_id":"T04QUFN4S"}

    //console.log(`parsed form: ${question}, ${question_roles}, ${question_role_levels}, ${question_type}, ${question_tags}, ${question_notes}, `)

  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`))
