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
  .post('/add_question', express.urlencoded(), async (req, res) => {

    //console.log(req.body.trigger_id);
    res.end("aaa");



    let response_view1 = {
      "trigger_id": `${req.body.trigger_id}`,
      "view": {
        "type": "modal",
        "callback_id": "modal-identifier",
        "title": {
          "type": "plain_text",
          "text": "Just a modal"
        },
        "submit": {
          "type": "plain_text",
          "text": "Submit",
          "emoji": true
        },
        "blocks":
          [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "Please fill all the data bellow:\n\n"
              }
            },
            {
              "type": "input",
              "block_id": "question_text",
              "element": {
                "type": "plain_text_input",
                "action_id": "question_text_value",
                "multiline": true
              },
              "label": {
                "type": "plain_text",
                "text": "Question",
                "emoji": true
              }
            },
            {
              "type": "input",
              "block_id": "question_roles",
              "element": {
                "type": "multi_static_select",
                "action_id": "question_roles_value",
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select options",
                  "emoji": true
                },
                "options": [
                  // to be filled 

                ]
              },
              "label": {
                "type": "plain_text",
                "text": "This quetion applies to the following roles",
                "emoji": true
              }
            },

            {
              "type": "input",
              "block_id": "question_role_levels",
              "element": {
                "type": "multi_static_select",
                "action_id": "question_role_levels_value",
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select options",
                  "emoji": true
                },
                "options": [
                  // to be filled 

                ]
              },
              "label": {
                "type": "plain_text",
                "text": "Level or seniority",
                "emoji": true
              }
            },

            {
              "type": "input",
              "block_id": "question_type",
              "element": {
                "type": "static_select",
                "action_id": "question_type_value",
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select options",
                  "emoji": true
                },
                "options": [
                  // to be filled 

                ]
              },
              "label": {
                "type": "plain_text",
                "text": "Question type",
                "emoji": true
              }
            },

            {
              "type": "input",
              "optional": true,
              "block_id": "question_tags",
              "element": {
                "type": "multi_static_select",
                "action_id": "question_tags_value",
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select options",
                  "emoji": true
                },
                "options": [
                  // to be filled 

                ]
              },
              "label": {
                "type": "plain_text",
                "text": "question tags",
                "emoji": true
              }
            },
            {
              "type": "input",
              "optional": true,
              "block_id": "question_notes",
              "element": {
                "type": "plain_text_input",
                "action_id": "question_notes_value",
                "multiline": true
              },
              "label": {
                "type": "plain_text",
                "text": "Question addtional details",
                "emoji": true
              }
            }
          ]
      }
    };


    console.log("text" + response_view1.view.blocks[2]);

    try {
      const client = await pool.connect()
      const result = await client.query('SELECT * FROM roles');
      console.log(result.rows);
      for (let index = 0; index < result.rows.length; index++) {
        const role = result.rows[index];
        response_view1.view.blocks[2].element.options.push({
          "text": {
            "type": "plain_text",
            "text": `${role.name}`,
            "emoji": true
          },
          "value": `${role.id}`
        });
      }

      const result2 = await client.query('SELECT * FROM levels');
      //console.log(result.rows);
      for (let index = 0; index < result2.rows.length; index++) {
        const level = result2.rows[index];
        response_view1.view.blocks[3].element.options.push({
          "text": {
            "type": "plain_text",
            "text": `${level.name}`,
            "emoji": true
          },
          "value": `${level.id}`
        });
      }

      const result3 = await client.query('SELECT * FROM question_type');
      //console.log(result.rows);
      for (let index = 0; index < result3.rows.length; index++) {
        const question_type = result3.rows[index];
        response_view1.view.blocks[4].element.options.push({
          "text": {
            "type": "plain_text",
            "text": `${question_type.name}`,
            "emoji": true
          },
          "value": `${question_type.id}`
        });
      }

      const result4 = await client.query('SELECT * FROM tags');
      //console.log(result.rows);
      for (let index = 0; index < result4.rows.length; index++) {
        const question_tag = result4.rows[index];
        response_view1.view.blocks[5].element.options.push({
          "text": {
            "type": "plain_text",
            "text": `${question_tag.name}`,
            "emoji": true
          },
          "value": `${question_tag.id}`
        });
      }

      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }



    const fetch = require('node-fetch');
    fetch("https://slack.com/api/views.open", {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer xoxb-4844532162-947808065460-5QNNTV8s3kug4XmyQbCNLymJ'
      },
      body: `${JSON.stringify(response_view1)}`
    }).then((response) => {
      //console.log("got respond"+ JSON.stringify(response));
    })
    //console.log("end fetch" + JSON.stringify(response_view1));


  })
  .post('/interactive_callback', express.urlencoded(), async (req, res) => {
    res.status(200).send('');
    const response = JSON.parse(req.body.payload);
    //console.log("got interactive payload" +JSON.stringify(response) );
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
    //client.release();
    //"team":{"id":"T04QUFN4S","domain":"stryxapp"},"user":{"id":"U04QUFN56","username":"amirshevat","name":"amirshevat","team_id":"T04QUFN4S"}

    //console.log(`parsed form: ${question}, ${question_roles}, ${question_role_levels}, ${question_type}, ${question_tags}, ${question_notes}, `)

  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`))
