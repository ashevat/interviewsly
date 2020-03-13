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

  //${this.encodeBlockID(context)}

  getEditCompetencyResponse: async function (trigger_id, context, competency, questions) {
    let question1 = "";
    let question2 = "";
    let question3 = "";
    if (questions) {
      if (questions[0]) {
        question1 = questions[0].question;
      }

      if (questions[1]) {
        question2 = questions[1].question;
      }
      if (questions[2]) {
        question3 = questions[2].question;
      }
    }


    let response_view = {
      "trigger_id": `${trigger_id}`,
      "view": {
        "type": "modal",
        "callback_id": "edit-competency",
        "private_metadata": `${this.encodeBlockID(context)}`,
        "title": {
          "type": "plain_text",
          "text": "Competency and Questions"
        },
        "submit": {
          "type": "plain_text",
          "text": "Update",
          "emoji": true
        },
        "blocks":
          [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "What type of competency would you like the interviewer to explore:\n\n"
              }
            },
            {
              "type": "input",
              "block_id": `competency`,
              "element": {
                "type": "plain_text_input",
                "action_id": "competency_value",
                "initial_value": `${competency.competency}`,
                "placeholder": {
                  "type": "plain_text",
                  "text": "e.g. Can candidate work together effectively with Sales and other functions?",
                },
              },
              "label": {
                "type": "plain_text",
                "text": "Candidate competency/skill",
                "emoji": true
              }
            },
            {
              "type": "input",
              "block_id": `example_question1`,
              "element": {
                "type": "plain_text_input",
                "action_id": "example_question1_value",
                "initial_value": `${question1}`,
                "placeholder": {
                  "type": "plain_text",
                  "text": "e.g. tell me about your experience working with Sales and Customer Success.",
                },
              },
              "label": {
                "type": "plain_text",
                "text": "Example question",
                "emoji": true
              }
            },
            {
              "type": "input",
              "optional": true,
              "block_id": `example_question2`,
              "element": {
                "type": "plain_text_input",
                "action_id": "example_question2_value",
                "initial_value": `${question2}`,
                "placeholder": {
                  "type": "plain_text",
                  "text": "e.g. tell me about your experience working with Sales and Customer Success.",
                },
              },
              "label": {
                "type": "plain_text",
                "text": "Example question 2",
                "emoji": true
              }
            },
            {
              "type": "input",
              "optional": true,
              "block_id": `example_question3`,
              "element": {
                "type": "plain_text_input",
                "action_id": "example_question3_value",
                "initial_value": `${question3}`,
                "placeholder": {
                  "type": "plain_text",
                  "text": "e.g. tell me about your experience working with Sales and Customer Success.",
                },
              },
              "label": {
                "type": "plain_text",
                "text": "Example question 3",
                "emoji": true
              }
            }
          ]
      }
    };

    return response_view;
  },




  getAddCompetencyResponse: async function (trigger_id, context) {
    let response_view = {
      "trigger_id": `${trigger_id}`,
      "view": {
        "type": "modal",
        "callback_id": "add-competency",
        "private_metadata": `${this.encodeBlockID(context)}`,
        "title": {
          "type": "plain_text",
          "text": "Competency and Questions"
        },
        "submit": {
          "type": "plain_text",
          "text": "Add Competency",
          "emoji": true
        },
        "blocks":
          [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "What type of competency would you like the interviewer to explore:\n\n"
              }
            },
            {
              "type": "input",
              "block_id": `competency`,
              "element": {
                "type": "plain_text_input",
                "action_id": "competency_value",
                "placeholder": {
                  "type": "plain_text",
                  "text": "e.g. Can candidate work together effectively with Sales and other functions?",
                },
              },
              "label": {
                "type": "plain_text",
                "text": "Candidate competency/skill",
                "emoji": true
              }
            },
            {
              "type": "input",
              "block_id": `example_question1`,
              "element": {
                "type": "plain_text_input",
                "action_id": "example_question1_value",
                "placeholder": {
                  "type": "plain_text",
                  "text": "e.g. tell me about your experience working with Sales and Customer Success.",
                },
              },
              "label": {
                "type": "plain_text",
                "text": "Example question",
                "emoji": true
              }
            },
            {
              "type": "input",
              "optional": true,
              "block_id": `example_question2`,
              "element": {
                "type": "plain_text_input",
                "action_id": "example_question2_value",
                "placeholder": {
                  "type": "plain_text",
                  "text": "e.g. tell me about your experience working with Sales and Customer Success.",
                },
              },
              "label": {
                "type": "plain_text",
                "text": "Example question 2",
                "emoji": true
              }
            },
            {
              "type": "input",
              "optional": true,
              "block_id": `example_question3`,
              "element": {
                "type": "plain_text_input",
                "action_id": "example_question3_value",
                "placeholder": {
                  "type": "plain_text",
                  "text": "e.g. tell me about your experience working with Sales and Customer Success.",
                },
              },
              "label": {
                "type": "plain_text",
                "text": "Example question 3",
                "emoji": true
              }
            }
          ]
      }
    };

    return response_view;
  },

  getEditOnsiteInterviewTypeResponse: async function (trigger_id, context, name) {
    let response_view = {
      "trigger_id": `${trigger_id}`,
      "view": {
        "type": "modal",
        "callback_id": "edit-onsite-interview-type",
        "private_metadata": `${this.encodeBlockID(context)}`,
        "title": {
          "type": "plain_text",
          "text": "Edit onsite interview"
        },
        "submit": {
          "type": "plain_text",
          "text": "Save Interview Type",
          "emoji": true
        },
        "blocks":
          [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "What type of interview would you like to add:\n\n"
              }
            },
            {
              "type": "input",
              "block_id": `onsite_interview_type`,
              "element": {
                "type": "plain_text_input",
                "action_id": "onsite_interview_type_value",
                "initial_value": `${name}`,
              },
              "label": {
                "type": "plain_text",
                "text": "Onsite interview",
                "emoji": true
              }
            }
          ]
      }
    };

    return response_view;
  },


  getAddOnsiteInterviewTypeResponse: async function (trigger_id, context) {
    let response_view = {
      "trigger_id": `${trigger_id}`,
      "view": {
        "type": "modal",
        "callback_id": "add-onsite-interview-type",
        "private_metadata": `${this.encodeBlockID(context)}`,
        "title": {
          "type": "plain_text",
          "text": "Add onsite interview"
        },
        "submit": {
          "type": "plain_text",
          "text": "Add Interview Type",
          "emoji": true
        },
        "blocks":
          [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "What type of interview would you like to add:\n\n"
              }
            },
            {
              "type": "input",
              "block_id": `onsite_interview_type`,
              "element": {
                "type": "plain_text_input",
                "action_id": "onsite_interview_type_value",
                "placeholder": {
                  "type": "plain_text",
                  "text": "e.g. Product Sense / Leadership",
                },
              },
              "label": {
                "type": "plain_text",
                "text": "Onsite interview",
                "emoji": true
              }
            }
          ]
      }
    };

    return response_view;
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

  getInterviewFinalAssessmentResultsResponse: async function (interview, pool, context, user) {
    let response = [{
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `:champagne: Pannel Results (published by the request of ${user.name}):`
      }
    }];
    let result = await interview.getInterviewAssessments(pool);
    let score = ["NA", "Strong don't hire", "Don't hire", "Hire", "Strong hire"];
    for (let index = 0; index < result.length; index++) {
      const element = result[index];
      console.log("element " + JSON.stringify(element));
      let interviewAssessmentResults = {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `:notebook_with_decorative_cover: *${element.name} interview* conducted by ${element.username}: *${score[element.score]}* :notebook_with_decorative_cover:\n\n General notes: ${element.notes} `
        }
      }
      response.push(interviewAssessmentResults);
      const templateDO = await interview.getTemplate(pool);
      let competencies = await templateDO.getCompetencies(element.interview_type_id);
      for (let index2 = 0; index2 < competencies.length; index2++) {
        const competency = competencies[index2];
        let panelistDetailsAssessment = await interview.getAssessment(element.panelist_id, competency.id, pool);
        if(panelistDetailsAssessment){
          let detailedAssessmentResults = {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `Competency -  _${competency.competency}_ \n\n Assessment:  ${panelistDetailsAssessment.assessment} `
            }
          }
          response.push(detailedAssessmentResults);
        }  
      }

    
    }
    return response;

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
          "text": `*Notes:*\n ${interview.notes}`
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Onsite Interviews and Pannelists:*"
        }
      }
    ];

    try {
      const client = await pool.connect()

      const Template = require("../data-objects/template");
      const templateDO = new Template(pool);
      //todo fix team to interview.team_id
      let template = await templateDO.getTemplate(interview.role_id, interview.role_level_id, -1);
      let interviewTypes = await template.getInterviewTypes()
      let assessmentCollected = 0;
      let onsiteCount = 0;
      for (let index = 0; index < interviewTypes.length; index++) {
        onsiteCount++;
        const onsite = interviewTypes[index];
        let dividerBlock = {
          "type": "divider"
        };
        let pannelist = await interview.getPanelist(onsite.id, pool);

        if (pannelist) {
          let finalAssessment = await interview.getInterviewAssessment(pannelist.id, onsite.id, pool);
          if (finalAssessment) {
            assessmentCollected++;
            let assesment_submitted = {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": `:white_check_mark: Assessment for *_${onsite.name}_ interview* submitted by @${pannelist.name}`

              }
            };
            response_message.push(assesment_submitted);
          } else {
            let onsiteBlock = {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": `:pencil:_${onsite.name}_ interview will be done by @${pannelist.name}`
              }
            };
            let selectPanalistBlock = {
              "type": "section",
              "block_id": `${this.encodeBlockID(context)}`,
              "text": {
                "type": "mrkdwn",
                "text": "Reassign the panelist (interviewer) for this onsite:"
              },
              "accessory": {
                "type": "button",
                "action_id": "remove_panelist",
                "style": "primary",
                "text": {
                  "type": "plain_text",
                  "text": "Reassign",
                  "emoji": true
                },
                "value": `${pannelist.slack_user_id}|${onsite.id}`
              }
            };

            response_message.push(onsiteBlock);
            response_message.push(selectPanalistBlock);
          }


        } else {
          let onsiteBlock = {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `:pencil: _${onsite.name}_ interview`
            }
          };
          let selectPanalistBlock = {
            "type": "section",
            "block_id": `${this.encodeBlockID(context)}`,
            "text": {
              "type": "mrkdwn",
              "text": "Assign a panelist (interviewer) for this onsite:"
            },
            "accessory": {
              "type": "users_select",
              "action_id": `select_panelist|${onsite.id}`,
              "placeholder": {
                "type": "plain_text",
                "text": "Select an panelist",
                "emoji": true
              }
            }
          };

          response_message.push(onsiteBlock);
          response_message.push(selectPanalistBlock);

        }

        response_message.push(dividerBlock);
      }

      if (assessmentCollected) {
        if (assessmentCollected < onsiteCount) {
          let publishResult = {
            "type": "actions",
            "block_id": `${this.encodeBlockID(context)}`,
            "elements": [
              {
                "type": "button",
                "action_id": `publish_result|${interview.id}`,
                "text": {
                  "type": "plain_text",
                  "text": ":no_entry_sign: Publish results (not rec.)",
                  "emoji": true
                },
                "value": "click_me_123"
              }
            ]
          }
          response_message.push(publishResult);
        } else {
          let publishResult = {
            "type": "actions",
            "block_id": `${this.encodeBlockID(context)}`,
            "elements": [
              {
                "type": "button",
                "action_id": `publish_result|${interview.id}`,
                "text": {
                  "type": "plain_text",
                  "text": ":white_check_mark: Publish results",
                  "emoji": true
                },
                "style": "primary",
                "value": "click_me_123"
              }
            ]
          }
          response_message.push(publishResult);

        }

      }

      client.release();
    } catch (err) {
      console.error(err);
      //res.send("Error " + err);
    }

    return response_message;

  },

  getFinalAssesmentResponse: async function (trigger_id, interview, context, orgAssessment, pool) {
    let response_view = {
      "trigger_id": `${trigger_id}`,
      "view": {
        "type": "modal",
        "callback_id": "interview-assessment",
        "private_metadata": `${this.encodeBlockID(context)}`,
        "title": {
          "type": "plain_text",
          "text": "Interview Assessment"
        },
        "submit": {
          "type": "plain_text",
          "text": "Submit assessment",
          "emoji": true
        },
        "blocks":
          [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "Please fill your candidate assessment:"
              }
            },
            {
              "type": "input",
              "block_id": "final_assesment",
              "element": {
                "type": "static_select",
                "action_id": "final_assesment_value",
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select an item",
                  "emoji": true
                },
                "options": [
                  {
                    "text": {
                      "type": "plain_text",
                      "text": ":trophy: Strong yes ",
                      "emoji": true
                    },
                    "value": "4"
                  },
                  {
                    "text": {
                      "type": "plain_text",
                      "text": ":thumbsup: Yes ",
                      "emoji": true
                    },
                    "value": "3"
                  },
                  {
                    "text": {
                      "type": "plain_text",
                      "text": ":thumbsdown: No",
                      "emoji": true
                    },
                    "value": "2"
                  },
                  {
                    "text": {
                      "type": "plain_text",
                      "text": ":scream: Strong no",
                      "emoji": true
                    },
                    "value": "1"
                  }

                ]
              },
              "label": {
                "type": "plain_text",
                "text": "Should we hire this candidate?",
                "emoji": true
              }
            },
            {
              "type": "input",
              "block_id": "final_assesment_notes",
              "element": {
                "type": "plain_text_input",
                "action_id": "final_assesment_notes_value",
                "multiline": true
              },
              "label": {
                "type": "plain_text",
                "text": "Comments",
                "emoji": true
              }
            }
          ]
      }
    };
    return response_view;

  },

  getAssesmentResponse: async function (trigger_id, interview, competency_id, context, orgAssessment, pool) {
    let response_view = {
      "trigger_id": `${trigger_id}`,
      "view": {
        "type": "modal",
        "callback_id": "assesment-intake",
        "private_metadata": `${this.encodeBlockID(context)}`,
        "title": {
          "type": "plain_text",
          "text": "Assessment intake"
        },
        "submit": {
          "type": "plain_text",
          "text": "Save assessment",
          "emoji": true
        },
        "blocks":
          [

          ]
      }
    };
    try {
      const client = await pool.connect();
      let template = await interview.getTemplate(pool);
      let competency = await template.getCompetency(competency_id);
      let competencyPrompt = {
        "type": "section",
        "block_id": `${this.encodeBlockID(context)}`,
        "text": {
          "type": "mrkdwn",
          "text": `:muscle: *What to assess:*  _${competency.competency}_`
        }
      };
      let questions = await template.getQuestions(competency.id);
      for (let index3 = 0; index3 < questions.length; index3++) {
        const element3 = questions[index3];
        competencyPrompt.text.text += `\n :pencil: Example question: ${element3.question} `;
      }
      response_view.view.blocks.push(competencyPrompt);
      let divider = {
        "type": "divider"
      }
      response_view.view.blocks.push(divider);

      client.release();

    } catch (err) {
      console.error(err);
      //res.send("Error " + err);
    }

    let assessmentQuestion = {
      "type": "input",
      "block_id": `onsite_interview`,
      "element": {
        "type": "plain_text_input",
        "action_id": "onsite_interview_value",
        "multiline": true,
        "placeholder": {
          "type": "plain_text",
          "text": "The candidate demonstrated deep understanding in.. ",
        },
      },
      "label": {
        "type": "plain_text",
        "text": "What was the candidate's answer? What is your assessment?",
        "emoji": true
      }
    };
    if (orgAssessment) {
      assessmentQuestion.element.initial_value = orgAssessment.assessment;
    }
    response_view.view.blocks.push(assessmentQuestion);

    let assessmentNotes = {
      "type": "input",
      "optional": true,
      "block_id": `interview_notes`,
      "element": {
        "type": "plain_text_input",
        "action_id": "interview_notes_value",
        "multiline": true,
        "placeholder": {
          "type": "plain_text",
          "text": "The candidate seemed very relaxed.. ",
        },
      },
      "label": {
        "type": "plain_text",
        "text": "Addtional notes",
        "emoji": true
      }
    };
    if (orgAssessment) {
      assessmentNotes.element.initial_value = orgAssessment.notes;
    }
    response_view.view.blocks.push(assessmentNotes);
    return response_view;
  },
  getPannelistQuestionResponse: async function (interview, interviewType, linkToDashboard, pool, context) {
    let roleName = await interview.getCachedRoleName(pool);
    let roleLevel = await interview.getCachedRoleLevelName(pool);
    let response_message = [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `:tada: You have been invited to participate in an interview panel:`
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
            "text": `*Candidate interview dashboard:*\n <${linkToDashboard}|Interview Dashboard>`
          },
          {
            "type": "mrkdwn",
            "text": `*Role:*\n${roleName}`
          },
          {
            "type": "mrkdwn",
            "text": `*Seniority:*\n${roleLevel}`
          }
        ]
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Suggested Questions for this interview:*"
        }
      },


    ];


    try {
      const client = await pool.connect();
      let template = await interview.getTemplate(pool);
      let competencies = await template.getCompetencies(interviewType);
      for (let index2 = 0; index2 < competencies.length; index2++) {
        const element2 = competencies[index2];

        let competencyPrompt = {
          "type": "section",
          "block_id": `${this.encodeBlockID(context)}`,
          "text": {
            "type": "mrkdwn",
            "text": `:muscle: _ What to assess:  ${element2.competency}_`
          },
          "accessory": {
            "type": "button",
            "action_id": `start_assessment|${element2.id}`,
            "style": "primary",
            "text": {
              "type": "plain_text",
              "text": "Start assesment :pencil2:",
              "emoji": true
            },
            "value": `${element2.id}`
          }
        };
        let questions = await template.getQuestions(element2.id);
        for (let index3 = 0; index3 < questions.length; index3++) {
          const element3 = questions[index3];
          competencyPrompt.text.text += `\n :pencil: Example question: ${element3.question} `;
        }
        let assessment = await interview.getAssessment(context.panelist_id, element2.id, pool);
        //console.log("got assessment"+JSON.stringify(assessment));
        if (assessment) {
          competencyPrompt.accessory = {
            "type": "button",
            "action_id": `edit_assessment|${element2.id}`,
            "text": {
              "type": "plain_text",
              "text": ":white_check_mark: Edit my assessment",
              "emoji": true
            },
            "value": `${element2.id}`
          }

        }

        response_message.push(competencyPrompt);
        let divider = {
          "type": "divider"
        }
        response_message.push(divider);
      }
      let finalAssessment = await interview.getInterviewAssessment(context.panelist_id, interviewType, pool);
      if (finalAssessment) {
        let done = {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `:white_check_mark: Thank you! You have sucessfully submitted your interview assessment! Results will show up <${linkToDashboard}|here> when all interviews are finished.`
          }
        };
        response_message.push(done);
      } else {
        let actions = {
          "type": "actions",
          "block_id": `${this.encodeBlockID(context)}`,
          "elements": [
            {
              "type": "button",
              "action_id": `submit_final_assessment|${interviewType}`,
              "style": "primary",
              "text": {
                "type": "plain_text",
                "text": "Submit final assessment :thumbsup::thumbsdown: ",
                "emoji": true
              },
              "value": `submit`
            }
          ]
        }
        response_message.push(actions);
      }


      // pupulate questions

      /*
    let offset = context.result_index;
    let limit = 3;
    let innerJoinStatment = "";
    let where = "";

  
    innerJoinStatment = " INNER JOIN question_roles ON questions.id = question_roles.question_id INNER JOIN question_levels ON questions.id = question_levels.question_id  ";
    where = ` WHERE question_roles.role_id='${interview.role_id}' AND question_levels.level_id='${interview.role_level_id}' AND questions.question_type='${questionsType}' `;


    console.log("Statment =" + `SELECT question FROM questions ${innerJoinStatment} ${where}  OFFSET ${offset} LIMIT ${limit}`);
    const questions = await client.query(`SELECT question FROM questions ${innerJoinStatment} ${where}  OFFSET ${offset} LIMIT ${limit}`);
    populateQuestions(response_message, questions.rows);

    const nextQuestions = await client.query(`SELECT questions.id FROM questions ${innerJoinStatment} ${where} OFFSET ${offset + limit} LIMIT 1`);
    if (offset > 0) {
      response_message.push({
        "type": "actions",
        "block_id": `${this.encodeBlockID(context)}`,
        "elements": [
          {
            "type": "button",
            "action_id": "get_prev_questions",
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
    if (nextQuestions.rows.length > 0) {
      response_message.push({
        "type": "actions",
        "block_id": `${this.encodeBlockID(context)}`,
        "elements": [
          {
            "type": "button",
            "action_id": "get_next_questions",
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

*/

      client.release();
    } catch (err) {
      console.error(err);
      //res.send("Error " + err);
    }


    return response_message;
  },


  getSetupResponse: async function (req, res, pool, context, currentTemplate, templates) {

    let response_message = {
      "response_type": "in_channel",
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": ":hammer_and_pick: *Setup interview process with Interviewsly* :hammer_and_pick:\n  "
          }
        },
        {
          "type": "divider"
        }
      ]
    };


    try {
      const client = await pool.connect()
      //console.log("current template: "+ currentTemplate.description);
      if (currentTemplate) {
        let templatePrompt = {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `:file_folder: *Template setup: ${currentTemplate.description} *`
          }

        };
        response_message.blocks.push(templatePrompt);

        let onsite = await currentTemplate.getInterviewTypes();
        //console.log(">>>> onsites"+ JSON.stringify(onsite));
        if (onsite.length == 0) {
          let templatePrompt = {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "First, lets add onsite interviews for this role, click on the *Add onsite interview* to do so:"
            }
          };
          response_message.blocks.push(templatePrompt);

        } else {
          for (let index = 0; index < onsite.length; index++) {
            const element = onsite[index];
            let onsitePrompt = {
              "type": "section",
              "block_id": `${this.encodeBlockID(context)}`,
              "text": {
                "type": "mrkdwn",
                "text": `*${index + 1}. Onsite interview - * ${element.name}`
              },
              "accessory": {
                "type": "overflow",
                "action_id": "onsite_interview_actions",
                "options": [
                  {
                    "text": {
                      "type": "plain_text",
                      "text": ":heavy_plus_sign: Competency & Questions",
                      "emoji": true
                    },
                    "value": `add|${element.id}`
                  },
                  {
                    "text": {
                      "type": "plain_text",
                      "text": ":pencil2: Edit Interview",
                      "emoji": true
                    },

                    "value": `edit|${element.id}`
                  },
                  {
                    "text": {
                      "type": "plain_text",
                      "text": ":put_litter_in_its_place: Remove Interview",
                      "emoji": true
                    },
                    "value": `remove|${element.id}`
                  }
                ]
              }
            };

            response_message.blocks.push(onsitePrompt);
            // add competencies
            let competencies = await currentTemplate.getCompetencies(element.id);
            for (let index2 = 0; index2 < competencies.length; index2++) {
              const element2 = competencies[index2];
              let competencyPrompt = {
                "type": "section",
                "block_id": `${this.encodeBlockID(context)}`,
                "text": {
                  "type": "mrkdwn",
                  "text": `:muscle: _ Competency:  ${element2.competency}_`
                },
                "accessory": {
                  "type": "overflow",
                  "action_id": "competency_actions",
                  "options": [
                    {
                      "text": {
                        "type": "plain_text",
                        "text": ":pencil2: Edit",
                        "emoji": true
                      },

                      "value": `edit|${element2.id}`
                    },
                    {
                      "text": {
                        "type": "plain_text",
                        "text": ":put_litter_in_its_place: Remove",
                        "emoji": true
                      },
                      "value": `remove|${element2.id}`
                    }
                  ]
                }
              };
              let questions = await currentTemplate.getQuestions(element2.id);
              for (let index3 = 0; index3 < questions.length; index3++) {
                const element3 = questions[index3];
                competencyPrompt.text.text += `\n :pencil: Competency question: ${element3.question} `;
              }
              response_message.blocks.push(competencyPrompt);
            }

          }
        }
        let addInterviewTypeAction = {
          "type": "actions",
          "block_id": `${this.encodeBlockID(context)}`,
          "elements": [
            {
              "type": "button",
              "action_id": "add_onsite_interview_type",
              "text": {
                "type": "plain_text",
                "emoji": true,
                "text": "Add onsite interview"
              },
              "style": "primary",
              "value": `${currentTemplate.id}`
            }
          ]
        }
        response_message.blocks.push(addInterviewTypeAction);


        let div = {
          "type": "divider"
        }
        response_message.blocks.push(div);
        let actions = {
          "type": "actions",
          "block_id": `${this.encodeBlockID(context)}`,
          "elements": [
            {
              "type": "button",
              "action_id": "done_template_setup",
              "text": {
                "type": "plain_text",
                "emoji": true,
                "text": "Done"
              },
              "value": `${currentTemplate.id}`
            }
          ]
        }
        response_message.blocks.push(actions);

      } else {
        // not current template picked

        let filterPrompt = {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `To get started, pick a role and level that you're recruiting for.`
          }

        };
        response_message.blocks.push(filterPrompt);

        let filter = {
          "type": "actions",
          "block_id": `${this.encodeBlockID(context)}`,
          "elements": [
            {
              "action_id": "filter_by_role",
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
              "action_id": "filter_by_level",
              "type": "static_select",
              "placeholder": {
                "type": "plain_text",
                "text": "Candidate level",
                "emoji": true
              },
              "options": [

              ],
            }
          ]
        }
        let result = await client.query('SELECT * FROM roles');
        let selected = populateDropdown(filter.elements[0].options, result.rows, context.role);
        if (selected) {
          filter.elements[0].initial_option = selected;
        }

        let result2 = await client.query('SELECT * FROM levels');
        selected = populateDropdown(filter.elements[1].options, result2.rows, context.level);
        if (selected) {
          filter.elements[1].initial_option = selected;
        }
        response_message.blocks.push(filter);

        let div = {
          "type": "divider"
        }
        response_message.blocks.push(div);

        // show results if needed 
        if (context.role > 0 && context.level > 0) {
          let templatePrompt = {};
          if (templates && templates.length > 0) {

            templatePrompt = {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "*Templates:*"
              }
              // todo: list templates for selection
            }

          } else {
            templatePrompt = {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "*No templates found, please create an interview template:*"
              }
            }

          }
          response_message.blocks.push(templatePrompt);

          let actions = {
            "type": "actions",
            "block_id": `${this.encodeBlockID(context)}`,
            "elements": [
              {
                "type": "button",
                "action_id": "create_new",
                "text": {
                  "type": "plain_text",
                  "emoji": true,
                  "text": "Create my own template"
                },
                "style": "primary",
                "value": "create_new"
              }
            ]
          }
          response_message.blocks.push(actions);
        }

      }



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
          "block_id": `${this.encodeBlockID(context)}`,
          "elements": [
            {
              "action_id": "filter_by_role",
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
              "action_id": "filter_by_level",
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
              "action_id": "filter_by_type",
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
      let selected = populateDropdown(response_message.blocks[2].elements[0].options, result.rows, context.role);
      if (selected) {
        response_message.blocks[2].elements[0].initial_option = selected;
      }

      let result2 = await client.query('SELECT * FROM levels');
      selected = populateDropdown(response_message.blocks[2].elements[1].options, result2.rows, context.level);
      if (selected) {
        response_message.blocks[2].elements[1].initial_option = selected;
      }

      const result3 = await client.query('SELECT * FROM question_type');
      selected = populateDropdown(response_message.blocks[2].elements[2].options, result3.rows, context.type);
      if (selected) {
        response_message.blocks[2].elements[2].initial_option = selected;
      }
      //const result4 = await client.query('SELECT * FROM tags');
      //populateDropdown(response_message.blocks[2].elements[3].options, result4.rows);

      // pupulate questions
      let offset = context.result_index;
      let limit = 3;
      let innerJoinStatment = "";
      let where = "";
      if (context.role > 0) {
        innerJoinStatment = " INNER JOIN question_roles ON questions.id = question_roles.question_id ";
        where = ` WHERE question_roles.role_id='${context.role}' `;
        if (context.level > 0) {
          innerJoinStatment += " INNER JOIN question_levels ON questions.id = question_levels.question_id ";
          where += ` AND question_levels.level_id='${context.level}' `;
        }
      } else if (context.level > 0) {
        innerJoinStatment = " INNER JOIN question_levels ON questions.id = question_levels.question_id ";
        where = `WHERE question_levels.level_id='${context.level}' `;
      }

      console.log("Statment =" + `SELECT question FROM questions ${innerJoinStatment} ${where}  OFFSET ${offset} LIMIT ${limit}`);
      const questions = await client.query(`SELECT question FROM questions ${innerJoinStatment} ${where}  OFFSET ${offset} LIMIT ${limit}`);
      populateQuestions(response_message.blocks, questions.rows);

      const nextQuestions = await client.query(`SELECT questions.id FROM questions ${innerJoinStatment} ${where} OFFSET ${offset + limit} LIMIT 1`);
      if (offset > 0) {
        response_message.blocks.push({
          "type": "actions",
          "block_id": `${this.encodeBlockID(context)}`,
          "elements": [
            {
              "type": "button",
              "action_id": "get_prev_questions",
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
      if (nextQuestions.rows.length > 0) {
        response_message.blocks.push({
          "type": "actions",
          "block_id": `${this.encodeBlockID(context)}`,
          "elements": [
            {
              "type": "button",
              "action_id": "get_next_questions",
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
function populateDropdown(dropdown, list, selected_value) {
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
    if (resultset.id == selected_value) {
      selected_result = item;
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
          "text": "Question & answer notes"
        },
        "value": "click_me_123"
      }
    });
  }

}


function populatePannelists(blocklist, pannellists, context) {
  for (let index = 0; index < pannellists.length; index++) {
    const pannelist = pannellists[index];
    block = {
      "type": "section",
      "block_id": `${encd(context)}`,
      "text": {
        "type": "mrkdwn",
        "text": `:writing_hand: *${pannelist.username}* will observe *${pannelist.name}* attributes `
      },
      "accessory": {
        "type": "button",
        "action_id": "remove_pannelist",
        "text": {
          "type": "plain_text",
          "emoji": true,
          "text": "Remove"
        },
        "value": `${pannelist.slack_user_id}|${pannelist.questions_type}`
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