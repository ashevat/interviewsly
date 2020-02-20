module.exports = {

  getAddQuestionResponse: async function (req, pool) {
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

  getQuestionResponse: async function (req, pool) {

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
          "elements": [
              {
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
              "type": "static_select",
              "placeholder": {
                "type": "plain_text",
                "text": "Candidate level",
                "emoji": true
              },
              "options": [
                
              ]
            },
            {
              "type": "static_select",
              "placeholder": {
                "type": "plain_text",
                "text": "Question type",
                "emoji": true
              },
              "options": [
                
              ]
            },
            {
              "type": "static_select",
              "placeholder": {
                "type": "plain_text",
                "text": "Question tag",
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
            "text": "*Propose a new time:*"
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "*Today - 4:30-5pm*\nEveryone is available: @iris, @zelda"
          },
          "accessory": {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Choose"
            },
            "value": "click_me_123"
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "*Tomorrow - 4-4:30pm*\nEveryone is available: @iris, @zelda"
          },
          "accessory": {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Choose"
            },
            "value": "click_me_123"
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "*Tomorrow - 6-6:30pm*\nSome people aren't available: @iris, ~@zelda~"
          },
          "accessory": {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Choose"
            },
            "value": "click_me_123"
          }
        },
        {
          "type": "actions",
          "elements": [
            {
              "type": "button",
              "text": {
                "type": "plain_text",
                "emoji": true,
                "text": "Next Results"
              },
              "value": "click_me_123"
            }
          ]
        }
      ]
    };


    try {
      const client = await pool.connect()
      let result = await client.query('SELECT * FROM roles');
      populateDropdown(response_message.blocks[2].elements[0].options, result.rows);

      let result2 = await client.query('SELECT * FROM levels');
      populateDropdown(response_message.blocks[2].elements[1].options, result2.rows);


      const result3 = await client.query('SELECT * FROM question_type');
      populateDropdown(response_message.blocks[2].elements[2].options, result3.rows);

      const result4 = await client.query('SELECT * FROM tags');
      populateDropdown(response_message.blocks[2].elements[3].options, result4.rows);

      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }


    return response_message;
  },

  encodeBlockID: function (context) {
    let seed  = Math.floor((Math.random() * 10000) + 1);
    let str = Object.keys(context).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(context[k])}`).join('&');
  
    return `${seed}|${str}`;
  },

  decodeBlockID: function(block_id){
    //string contextStr = block_id.split
  } 
}


function populateDropdown(dropdown, list) {

  for (let index = 0; index < list.length; index++) {
    const resultset = list[index];
    dropdown.push({
      "text": {
        "type": "plain_text",
        "text": `${resultset.name}`,
        "emoji": true
      },
      "value": `${resultset.id}`
    });
  }

}

