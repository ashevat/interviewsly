
class Interview {
    
    async getInterviewById(id, pool) {

        const client = await pool.connect();
        let result = await client.query(`SELECT * FROM interviews WHERE id='${id}'`);

        if (result.rows[0]) {
            let i = new Interview()
            i.id = result.rows[0].id;
            i.owner_id = result.rows[0].owner_id;
            i.candidate_name = result.rows[0].candidate_name;
            i.role_id = result.rows[0].role_id;
            i.role_level_id = result.rows[0].role_level_id;
            i.linkedin = result.rows[0].linkedin;
            i.notes = result.rows[0].notes;
            i.slack_channel_id = result.rows[0].slack_channel_id;
            i.slack_dashboard_msg_id = result.rows[0].slack_dashboard_msg_id;
            i.team_id = result.rows[0].team_id;
            i.status = result.rows[0].status;
            client.release();
            return i;
        } else {
            client.release();
            return null;
        }

    }

    async getInterviewDataByStatus(status, pool){
        const client = await pool.connect();
        let result = await client.query(`SELECT * FROM interviews INNER JOIN roles ON interviews.role_id = roles.id WHERE status='${status}'`);
        client.release();
        return result.rows;
    }

    async getTemplate(pool) {
        const Template = require('./template');
        const templateDO = new Template(pool);
        //todo: fix team
        return await templateDO.getTemplate(this.role_id, this.role_level_id, -1);
    }


    async create(params, pool) {
        this.owner_id = params.owner_id;
        this.candidate_name = params.candidate_name;
        this.role_id = params.role_id;
        this.role_level_id = params.role_level_id;
        this.linkedin = params.linkedin;
        this.notes = params.notes;
        this.slack_channel_id = params.slack_channel_id;
        this.slack_dashboard_msg_id = params.slack_dashboard_msg_id;
        this.team_id = params.team_id;
        this.status = 1; //active

        const client = await pool.connect();
        const result1 = await client.query(
            `INSERT INTO interviews (id, owner_id, candidate_name, role_id, role_level_id, linkedin, notes, slack_channel_id, slack_dashboard_msg_id, team_id, status )
                        VALUES(DEFAULT, '${this.owner_id}' ,'${this.candidate_name}', '${this.role_id}', '${this.role_level_id}','${this.linkedin}','${this.notes}', '${this.slack_channel_id}', '${this.slack_dashboard_msg_id}' ,'${this.team_id}', '${this.status}'  ) RETURNING id`);
        this.id = result1.rows[0].id;
        client.release();
        return this;
    }

    async addAssessment(panelist_id, competency_id, assessment, notes, pool) {
        const client = await pool.connect();
        const result1 = await client.query(
            `INSERT INTO assessments(id, interview_id, competency_id, panelist_id, assessment, notes )VALUES(DEFAULT, '${this.id}' ,'${competency_id}',  '${panelist_id}', '${assessment}','${notes}')`);
        client.release();

        return this;
    }

    async updateAssessment(assessment_id, assessment, notes, pool) {
        const client = await pool.connect();
        const result1 = await client.query(
            `UPDATE assessments SET assessment='${assessment}', notes='${notes}' WHERE id='${assessment_id}'`);
        client.release();

        return this;
    }

    async getAssessment(panelist_id, competency_id, pool) {
        const client = await pool.connect();

        let result = await client.query(`SELECT * FROM assessments WHERE panelist_id='${panelist_id}' AND competency_id='${competency_id}' AND interview_id='${this.id}' `);

        client.release();
        if (result.rows.length == 0) {
            return null;
        } else {
            return result.rows[0];
        }

    }

    async addInterviewAssessment(panelist_id, interview_type, score, notes, pool) {
        const client = await pool.connect();
        const result1 = await client.query(
            `INSERT INTO interview_assessments(id, interview_id, interview_type_id, panelist_id, score, notes )VALUES(DEFAULT, '${this.id}' ,'${interview_type}',  '${panelist_id}', '${score}','${notes}')`);
        client.release();

        return this;
    }

    async getInterviewAssessment(panelist_id, interview_type, pool) {
        const client = await pool.connect();

        let result = await client.query(`SELECT * FROM interview_assessments WHERE panelist_id='${panelist_id}' AND interview_type_id='${interview_type}' AND interview_id='${this.id}' `);

        client.release();
        if (result.rows.length == 0) {
            return null;
        } else {
            return result.rows[0];
        }

    }

    async getInterviewAssessments(pool) {
        const client = await pool.connect();

        let result = await client.query(`SELECT * FROM interview_assessments INNER JOIN users ON interview_assessments.panelist_id = users.id INNER JOIN template_interview_types ON interview_assessments.interview_type_id = template_interview_types.id WHERE interview_assessments.interview_id='${this.id}' `);

        client.release();
        return result.rows;


    }

    async addPanelist(panelist_id, questions_type, message_id, channel_id, pool) {
        const client = await pool.connect();
        const result1 = await client.query(
            `INSERT INTO interview_panelists (id, interview_id, panelist_id, questions_type, message_id, channel_id, active )VALUES(DEFAULT, '${this.id}' ,'${panelist_id}', '${questions_type}', '${message_id}', '${channel_id}', '1')`);
        client.release();

        return this;
    }

    async removePanelist(panelistId, questionsType, pool) {
        const client = await pool.connect();
        const result1 = await client.query(
            `UPDATE interview_panelists SET active='0' WHERE interview_id='${this.id}' AND panelist_id='${panelistId}' AND questions_type='${questionsType}' AND active='1' RETURNING message_id, channel_id `);

        client.release();

        return result1.rows[0];
    }

    async getPanelists(pool) {
        const client = await pool.connect();
        let result = await client.query(`SELECT * FROM interview_panelists INNER JOIN users ON interview_panelists.panelist_id = users.id INNER JOIN question_type ON interview_panelists.questions_type = question_type.id WHERE interview_id='${this.id}' AND interview_panelists.active='1'`);
        client.release();

        return result.rows;
    }

    async getPanelist(questions_type, pool) {
        const client = await pool.connect();
        let result = await client.query(`SELECT * FROM interview_panelists INNER JOIN users ON interview_panelists.panelist_id = users.id WHERE interview_id='${this.id}' AND questions_type='${questions_type}' AND interview_panelists.active='1' `);


        client.release();
        if (result.rows.length == 0) {
            return null;
        } else {
            return result.rows[0];
        }
    }

    async isPanelists(panelistId, pool) {
        const client = await pool.connect();
        let result = await client.query(`SELECT id FROM interview_panelists WHERE interview_id='${this.id}' AND panelist_id='${panelistId}' AND active='1' `);
        client.release();

        return result.rows.length > 0;
    }

    async isInterviewOwner(user_id, pool) {
        const client = await pool.connect();
        let result = await client.query(`SELECT id FROM interviews WHERE id='${this.id}' AND owner_id='${user_id}' `);
        client.release();

        return result.rows.length > 0;
    }


    async updateSlackChannelID(channel_id, pool) {
        const client = await pool.connect();
        const result1 = await client.query(
            `UPDATE interviews SET slack_channel_id ='${channel_id}' WHERE id='${this.id}'  RETURNING slack_channel_id`);
        this.slack_channel_id = result1.rows[0].slack_channel_id;
        client.release();
        return this;
    }


    async updateDashboardId(ts, pool) {
        const client = await pool.connect();
        const result1 = await client.query(
            `UPDATE interviews SET slack_dashboard_msg_id ='${ts}' WHERE id='${this.id}'  RETURNING slack_dashboard_msg_id`);
        this.slack_dashboard_msg_id = result1.rows[0].slack_dashboard_msg_id;
        client.release();
        return this;
    }

    async getCachedRoleName(pool) {
        if (this.role_name) {
            return this.role_name
        }
        const client = await pool.connect();
        //console.log(`this = '${JSON.stringify(this)}'`);
        let result = await client.query(`SELECT name FROM roles WHERE id='${this.role_id}'`);
        client.release();
        this.role_name = result.rows[0].name
        return result.rows[0].name;
    }


    async getCachedRoleLevelName(pool) {
        if (this.role_level_name) {
            return this.role_level_name
        }
        const client = await pool.connect();
        let result = await client.query(`SELECT name FROM levels WHERE id='${this.role_level_id}'`);
        client.release();
        this.role_level_name = result.rows[0].name;
        return result.rows[0].name;
    }


    async getCachedOwnerName(pool) {
        if (this.owner_name) {
            return this.owner_name
        }
        const client = await pool.connect();
        //console.log(`this = '${JSON.stringify(this)}'`);
        let result = await client.query(`SELECT name FROM users WHERE id='${this.owner_id}'`);
        client.release();
        this.owner_name = result.rows[0].name;
        return result.rows[0].name;
    }


}


module.exports = Interview;