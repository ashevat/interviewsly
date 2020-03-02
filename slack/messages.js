module.exports = {

  getAddQuestionResponse: async function (req, res, pool) {
    let response_view1 = {
      "trigger_id": `${req.body.trigger_id}`,
      "view": {
        "type": "modal",
        "callback_id": "modal-identifier",
        "title": {
          "type": "plain_text",
          "text": "Add a question"
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
                "text": "This question applies to the following roles",
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

    try {
      const client = await pool.connect()
      let result = await client.query('SELECT * FROM roles');
      populateDropdown(response_view1.view.blocks[2].element.options, result.rows);

      let result2 = await client.query('SELECT * FROM levels');
      populateDropdown(response_view1.view.blocks[3].element.options, result2.rows);


      const result3 = await client.query('SELECT * FROM question_type');
      populateDropdown(response_view1.view.blocks[4].element.options, result3.rows);

      const result4 = await client.query('SELECT * FROM tags');
      populateDropdown(response_view1.view.blocks[5].element.options, result4.rows);

      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }

    return response_view1;
  },


  getInterviewResponse: async function (req, res, pool) {
    let response_view1 = {
      "trigger_id": `${req.body.trigger_id}`,
      "view": {
        "type": "modal",
        "callback_id": "create-interview",
        "title": {
          "type": "plain_text",
          "text": "Setup an interview"
        },
        "submit": {
          "type": "plain_text",
          "text": "Create an interview",
          "emoji": true
        },
        "blocks":
          [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "Please fill  the data bellow - once done we will create a channel and continue the interview planning process there.\n\n"
              }
            },
            {
              "type": "input",
              "block_id": "candidate_name",
              "element": {
                "type": "plain_text_input",
                "action_id": "candidate_name_value",
              },
              "label": {
                "type": "plain_text",
                "text": "Candidate name:",
                "emoji": true
              }
            },
            {
              "type": "input",
              "block_id": "linkedin_url",
              "element": {
                "type": "plain_text_input",
                "action_id": "linkedin_url_value",
              },
              "label": {
                "type": "plain_text",
                "text": "Candidate LinkedIn",
                "emoji": true
              }
            },
            {
              "type": "input",
              "block_id": "role",
              "element": {
                "type": "static_select",
                "action_id": "role_value",
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
                "text": "Candidate role",
                "emoji": true
              }
            },

            {
              "type": "input",
              "block_id": "role_level",
              "element": {
                "type": "static_select",
                "action_id": "role_level_value",
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
              "optional": true,
              "block_id": "notes",
              "element": {
                "type": "plain_text_input",
                "action_id": "notes_value",
                "multiline": true
              },
              "label": {
                "type": "plain_text",
                "text": "Addtional notes",
                "emoji": true
              }
            }
          ]
      }
    };

    try {
      const client = await pool.connect()
      let result = await client.query('SELECT * FROM roles');
      populateDropdown(response_view1.view.blocks[3].element.options, result.rows);

      let result2 = await client.query('SELECT * FROM levels');
      populateDropdown(response_view1.view.blocks[4].element.options, result2.rows);

      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }

    return response_view1;
  },

  getInterviewDashboardResponse: async function (interview, pool, context) {
    //console.log("datboard for interview" + JSON.stringify(interview));

    let roleName = await interview.getCachedRoleName(pool);
    let roleLevelName = await interview.getCachedRoleLevelName(pool);
    let ownerName = await interview.getCachedOwnerName(pool);

    let response_message = [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `:couple: @${ownerName} started an interview process:`
        }
      },
      {
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": `*Candidate Name:*\n${interview.candidate_name}`
          },
          {
            "type": "mrkdwn",
            "text": `*LinkedIn URL:*\n${interview.linkedin}`
          },
          {
            "type": "mrkdwn",
            "text": `*Role:*\n${roleName}`
          },
          {
            "type": "mrkdwn",
            "text": `*Seniority:*\n${roleLevelName}`
          }
        ]
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `*Notes:*\n ${ interview.notes}`
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "Pannelists:"
        }
      },
      {
        "type": "actions",
        "block_id":`${this.encodeBlockID(context)}`,
        "elements": [
          {
            "type": "users_select",
            "action_id":"select_pannelist",
            "placeholder": {
              "type": "plain_text",
              "text": "Select a user",
              "emoji": true
            }
          },
          {
            "type": "static_select",
            "action_id":"select_attribute",
            "placeholder": {
              "type": "plain_text",
              "text": "Interview Attribute",
              "emoji": true
            },
            "options": [
              
            ]
          },
          {
            "type": "button",
            "action_id":"add_pannelist",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Add Pannelist"
            },
            "style": "primary",
            "value": "click_me_123"
          }
        ]
      }
    ];

    try {
    const client = await pool.connect()
    const result3 = await client.query('SELECT * FROM question_type');
      selected = populateDropdown(response_message[5].elements[1].options, result3.rows, context.type);
      if(selected){
        response_message[5].elements[1].initial_option = selected;
      }

      if(context.pannelist_id){
        response_message[5].elements[0].initial_user = context.pannelist_id;
      }

      let pannelists = await interview.getPannelists(pool); 
      populatePannelists(response_message, pannelists, context);

      client.release();
    } catch (err) {
      console.error(err);
      //res.send("Error " + err);
    }

    return response_message;

  },

  getQuestionResponse: async function (req, res, pool, context) {

    let response_message = {
      "response_type": "in_channel",
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "plain_text",
            "emoji": true,
            "text": "Here is a list of interview questions, use the filters to find the right question:"
          }
        },
        {
          "type": "divider"
        },

        {
          "type": "actions",
          "block_id":`${this.encodeBlockID(context)}`,
          "elements": [
            {
              "action_id":"filter_by_role",
              "type": "static_select",
              "placeholder": {
                "type": "plain_text",
                "text": "Candidate role",
                "emoji": true
              },
              "options": [

              ]
            },
            {
              "action_id":"filter_by_level",
              "type": "static_select",
              "placeholder": {
                "type": "plain_text",
                "text": "Candidate level",
                "emoji": true
              },
              "options": [

              ],
            },
            {
              "action_id":"filter_by_type",
              "type": "static_select",
              "placeholder": {
                "type": "plain_text",
                "text": "Question type",
                "emoji": true
              },
              "options": [

              ]
            }
          ]
        },
        {
          "type": "divider"
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "*Questions founds:*"
          }
        },
        
        
      ]
    };


    try {
      const client = await pool.connect()
      let result = await client.query('SELECT * FROM roles');
      let selected = populateDropdown(response_message.blocks[2].elements[0].options, result.rows , context.role);
      if(selected){
        response_message.blocks[2].elements[0].initial_option = selected;
      }

      let result2 = await client.query('SELECT * FROM levels');
      selected = populateDropdown(response_message.blocks[2].elements[1].options, result2.rows, context.level);
      if(selected){
        response_message.blocks[2].elements[1].initial_option = selected;
      }

      const result3 = await client.query('SELECT * FROM question_type');
      selected = populateDropdown(response_message.blocks[2].elements[2].options, result3.rows, context.type);
      if(selected){
        response_message.blocks[2].elements[2].initial_option = selected;
      }
      //const result4 = await client.query('SELECT * FROM tags');
      //populateDropdown(response_message.blocks[2].elements[3].options, result4.rows);

      // pupulate questions
      let offset = context.result_index;
      let limit = 3;
      let innerJoinStatment = "";
      let where = "";
      if(context.role >0){
        innerJoinStatment  = " INNER JOIN question_roles ON questions.id = question_roles.question_id " ;
        where = ` WHERE question_roles.role_id='${context.role}' `;
        if(context.level>0){
          innerJoinStatment += " INNER JOIN question_levels ON questions.id = question_levels.question_id " ;
          where += ` AND question_levels.level_id='${context.level}' `;
        }
      }else if(context.level>0){
        innerJoinStatment = " INNER JOIN question_levels ON questions.id = question_levels.question_id " ;
        where = `WHERE question_levels.level_id='${context.level}' `;
      }
      
      console.log("Statment =" + `SELECT question FROM questions ${innerJoinStatment} ${where}  OFFSET ${offset} LIMIT ${limit}`);
      const questions = await client.query(`SELECT question FROM questions ${innerJoinStatment} ${where}  OFFSET ${offset} LIMIT ${limit}`);
      populateQuestions(response_message.blocks, questions.rows);

      const nextQuestions = await client.query(`SELECT questions.id FROM questions ${innerJoinStatment} ${where} OFFSET ${offset + limit} LIMIT 1`);
      if(offset>0){
        response_message.blocks.push({
          "type": "actions",
          "block_id":`${this.encodeBlockID(context)}`,
          "elements": [
            {
              "type": "button",
              "action_id":"get_prev_questions",
              "text": {
                "type": "plain_text",
                "emoji": true,
                "text": "Prev Results"
              },
              "value": "get_prev_questions"
            }
          ]
        }
        );
      }
      if(nextQuestions.rows.length >0){
        response_message.blocks.push({
          "type": "actions",
          "block_id":`${this.encodeBlockID(context)}`,
          "elements": [
            {
              "type": "button",
              "action_id":"get_next_questions",
              "text": {
                "type": "plain_text",
                "emoji": true,
                "text": "Next Results"
              },
              "value": "get_next_questions"
            }
          ]
        }
        );
      }
      


      client.release();
    } catch (err) {
      console.error(err);
      //res.send("Error " + err);
    }


    return response_message;
  },

  encodeBlockID: function (context) {
    let seed = Math.floor((Math.random() * 10000) + 1);
    let str = Object.keys(context).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(context[k])}`).join('&');

    return `${seed}|${str}`;
  },

  decodeBlockID: function (block_id) {
    var query = {};
    block_id = block_id.split("|")[1];
    var pairs = (block_id[0] === '?' ? block_id.substr(1) : block_id).split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
  }
}

// returns selected item if avilable 
function populateDropdown(dropdown, list , selected_value) {
  let selected_result = null;
  for (let index = 0; index < list.length; index++) {
    const resultset = list[index];
    item = {
      "text": {
        "type": "plain_text",
        "text": `${resultset.name}`,
        "emoji": true
      },
      "value": `${resultset.id}`
    }
    dropdown.push(item);
    if(resultset.id == selected_value){
      selected_result =  item;
    }
  }
  return selected_result;

}


function populateQuestions(blockList, list) {

  for (let index = 0; index < list.length; index++) {
    const resultset = list[index];
    blockList.push({
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `:memo: ${resultset.question}`
      },
      "accessory": {
        "type": "button",
        "text": {
          "type": "plain_text",
          "emoji": true,
          "text": "Pick"
        },
        "value": "click_me_123"
      }
    });
  }

}


function populatePannelists(blocklist, pannellists, context){
  for (let index = 0; index < pannellists.length; index++) {
    const pannelist = pannellists[index];
    block = {
      "type": "section",
      "block_id":`${encd(context)}`,
      "text": {
        "type": "mrkdwn",
        "text": `:writing_hand: *${pannelist.username}* will observe _${pannelist.name}_ attributes `
      },
      "accessory": {
        "type": "button",
        "action_id": "remove_pannelist",
        "text": {
          "type": "plain_text",
          "emoji": true,
          "text": "Remove"
        },
        "value": `${pannelist.slack_user_id}`
      }
    }
    blocklist.push(block)
    
  }


   function encd(context) {
    let seed = Math.floor((Math.random() * 10000) + 1);
    let str = Object.keys(context).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(context[k])}`).join('&');

    return `${seed}|${str}`;
  }
  

}