
class Interview {
    
    async getInterviewById(id, pool) {

        const client = await pool.connect();
        const query = 'SELECT * FROM interviews WHERE id=$1';
        const values = [id];
        let result = await client.query(query, values);

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
            i.link_to_dashboard = result.rows[0].link_to_dashboard;
            client.release();
            return i;
        } else {
            client.release();
            return null;
        }

    }

    async getInterviewByChannel(channel_id, pool) {

        const client = await pool.connect();
        const query = 'SELECT * FROM interviews WHERE slack_channel_id=$1';
        const values = [channel_id];
        let result = await client.query(query, values);

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
            i.link_to_dashboard = result.rows[0].link_to_dashboard
            client.release();
            return i;
        } else {
            client.release();
            return null;
        }

    }

    async getInterviewDataByStatus(status, team_id, pool){
        const client = await pool.connect();
        const query = 'SELECT * FROM interviews INNER JOIN roles ON interviews.role_id = roles.id WHERE interviews.team_id=$1 AND status=$2';
        const values = [team_id, status];
        let result = await client.query(query, values);
        client.release();
        return result.rows;
    }

    async getInterviewsByOwnerId(user_id, pool){
        const client = await pool.connect();
        const query = 'SELECT * FROM interviews INNER JOIN roles ON interviews.role_id = roles.id WHERE interviews.status=$1 AND interviews.owner_id=$2';
        const values = [1, user_id];
        let result = await client.query(query, values);
        client.release();
        return result.rows;
    }

    async getInterviewsByPanelistId(user_id, pool){
        const client = await pool.connect();
        const query = 'SELECT * FROM interviews INNER JOIN roles ON interviews.role_id = roles.id INNER JOIN interview_panelists ON interviews.id = interview_panelists.interview_id WHERE interviews.status=$1 AND interview_panelists.panelist_id=$2';
        const values = [1, user_id];
        let result = await client.query(query, values);
        client.release()
        return result.rows;
    }

    async getTemplate(pool) {
        const Template = require('./template');
        const templateDO = new Template(pool);
        let thisInterviewTemplate = await templateDO.getTemplate(this.role_id, this.role_level_id, this.team_id);
        if(!thisInterviewTemplate){
            thisInterviewTemplate = await templateDO.getPublicTemplateByRoleAndLevel(this.role_id, this.role_level_id);
        }
        return thisInterviewTemplate
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
        this.link_to_dashboard = params.link_to_dashboard;

        const client = await pool.connect();
        const query = 'INSERT INTO interviews ( owner_id, candidate_name, role_id, role_level_id, linkedin, notes, slack_channel_id, slack_dashboard_msg_id, link_to_dashboard , team_id, status ) VALUES($1 ,$2, $3, $4, $5,$6, $7, $8, $9 ,$10, $11 ) RETURNING id';
        const values = [this.owner_id,this.candidate_name , this.role_id, this.role_level_id, this.linkedin, this.notes ,this.slack_channel_id, this.slack_dashboard_msg_id, this.link_to_dashboard, this.team_id, this.status ];
        const result1 = await client.query(query, values);
        this.id = result1.rows[0].id;
        client.release();
        return this;
    }

    async addAssessment(panelist_id, competency_id, assessment, notes, pool) {
        const client = await pool.connect();
        const query = 'INSERT INTO assessments(interview_id, competency_id, panelist_id, assessment, notes )VALUES( $1 , $2,  $3, $4, $5)';
        const values = [this.id, competency_id, panelist_id, assessment, notes];
        const result1 = await client.query(query, values);
        client.release();

        return this;
    }

    async updateAssessment(assessment_id, assessment, notes, pool) {
        const client = await pool.connect();
        const query = 'UPDATE assessments SET assessment=$1, notes=$2 WHERE id=$3';
        const values = [assessment, notes, assessment_id];
        const result1 = await client.query(query,values );
        client.release();

        return this;
    }

    async getAssessment(panelist_id, competency_id, pool) {
        const client = await pool.connect();
        const query = 'SELECT * FROM assessments WHERE panelist_id=$1 AND competency_id=$2 AND interview_id=$3';
        const values = [panelist_id, competency_id, this.id];
        let result = await client.query(query, values);

        client.release();
        if (result.rows.length == 0) {
            return null;
        } else {
            return result.rows[0];
        }

    }

    async addInterviewAssessment(panelist_id, interview_type, score, notes, pool) {
        const client = await pool.connect();
        const query = 'INSERT INTO interview_assessments(interview_id, interview_type_id, panelist_id, score, notes )VALUES( $1 ,$2, $3, $4,$5)';
        const values = [this.id, interview_type, panelist_id, score, notes];
        const result1 = await client.query(query, values );
        client.release();

        return this;
    }

    async getInterviewAssessment(panelist_id, interview_type, pool) {
        const client = await pool.connect();
        const query = 'SELECT * FROM interview_assessments WHERE panelist_id=$1 AND interview_type_id=$2 AND interview_id=$3';
        const values = [panelist_id, interview_type, this.id];
        let result = await client.query(query, values);

        client.release();
        if (result.rows.length == 0) {
            return null;
        } else {
            return result.rows[0];
        }

    }

    async getInterviewAssessments(pool) {
        const client = await pool.connect();
        const query = 'SELECT * FROM interview_assessments INNER JOIN users ON interview_assessments.panelist_id = users.id INNER JOIN template_interview_types ON interview_assessments.interview_type_id = template_interview_types.id WHERE interview_assessments.interview_id=$1';
        const values = [this.id];
        let result = await client.query(query, values);

        client.release();
        return result.rows;


    }

    async addPanelist(panelist_id, questions_type, message_id, channel_id, link_to_questions, pool) {
        const client = await pool.connect();
        const query = 'INSERT INTO interview_panelists (interview_id, panelist_id, questions_type, message_id, channel_id, link_to_questions,  active )VALUES( $1 ,$2, $3, $4, $5, $6, $7)';
        const values = [this.id ,panelist_id, questions_type, message_id, channel_id, link_to_questions,1];
        const result1 = await client.query(query, values);
        client.release();

        return this;
    }

    async removePanelist(panelistId, questionsType, pool) {
        const client = await pool.connect();
        const query = 'UPDATE interview_panelists SET active=$1 WHERE interview_id=$2 AND panelist_id=$3 AND questions_type=$4 AND active=$5 RETURNING message_id, channel_id 3';
        const values = [0 ,this.id, panelistId, questionsType, 1];
        const result1 = await client.query(query,values);

        client.release();

        return result1.rows[0];
    }

    async getPanelists(pool) {
        const client = await pool.connect();
        const query = 'SELECT * FROM interview_panelists INNER JOIN users ON interview_panelists.panelist_id = users.id INNER JOIN question_type ON interview_panelists.questions_type = question_type.id WHERE interview_id=$1 AND interview_panelists.active=$2';
        const values = [this.id, 1];
        let result = await client.query(query, values);
        client.release();

        return result.rows;
    }

    async getPanelist(questions_type, pool) {
        const client = await pool.connect();
        const query = 'SELECT * FROM interview_panelists INNER JOIN users ON interview_panelists.panelist_id = users.id WHERE interview_id=$1 AND questions_type=$2 AND interview_panelists.active=$3';
        const values = [this.id, questions_type, 1];
        let result = await client.query(query, values);
        client.release();
        if (result.rows.length == 0) {
            return null;
        } else {
            return result.rows[0];
        }
    }

    async setInterviewTypeTimeDateAndLocation(interviewType, panelistId, date, time, location,  pool){
        const client = await pool.connect();
        const query = 'UPDATE interview_panelists SET date=$1, time=$2, location=$3 WHERE interview_id=$4 AND questions_type=$5 and panelist_id=$6 AND active=$7';
        const values = [date, time, location, this.id, interviewType , panelistId, 1];
        await client.query(query,values );
        client.release();
    }

    async isPanelists(panelistId, pool) {
        const client = await pool.connect();
        const query = 'SELECT id FROM interview_panelists WHERE interview_id=$1 AND panelist_id=$2 AND active=$3';
        const values = [this.id, panelistId, 1];
        let result = await client.query(query, values );
        client.release();

        return result.rows.length > 0;
    }

    async isInterviewOwner(user_id, pool) {
        const client = await pool.connect();
        const query = 'SELECT id FROM interviews WHERE id=$1 AND owner_id=$2';
        const values = [this.id, user_id];
        let result = await client.query(query, values);
        client.release();

        return result.rows.length > 0;
    }


    async updateSlackChannelID(channel_id, pool) {
        const client = await pool.connect();
        const query = 'UPDATE interviews SET slack_channel_id =$1 WHERE id=$2  RETURNING slack_channel_id';
        const values = [channel_id, this.id];
        const result1 = await client.query(query, values);
        this.slack_channel_id = result1.rows[0].slack_channel_id;
        client.release();
        return this;
    }

    async updateStatus(status, pool) {
        const client = await pool.connect();
        const query = 'UPDATE interviews SET status =$1 WHERE id=$2  RETURNING status';
        const values = [status, this.id];
        const result1 = await client.query(query, values);
        this.status = result1.rows[0].status;
        client.release();
        return this;
    }


    async updateDashboardIdAndLink(ts,link, pool) {
        const client = await pool.connect();
        const query = 'UPDATE interviews SET slack_dashboard_msg_id =$1, link_to_dashboard=$2 WHERE id=$3  RETURNING slack_dashboard_msg_id';
        const values = [ts, link, this.id ];
        const result1 = await client.query(query, values);
        this.slack_dashboard_msg_id = result1.rows[0].slack_dashboard_msg_id;
        client.release();
        return this;
    }

    async getCachedRoleName(pool) {
        if (this.role_name) {
            return this.role_name
        }
        const client = await pool.connect();
        const query = 'SELECT name FROM roles WHERE id=$1';
        const values = [this.role_id];
        let result = await client.query(query, values);
        client.release();
        this.role_name = result.rows[0].name
        return result.rows[0].name;
    }


    async getCachedRoleLevelName(pool) {
        if (this.role_level_name) {
            return this.role_level_name
        }
        const client = await pool.connect();
        const query = 'SELECT name FROM levels WHERE id=$1';
        const values = [this.role_level_id];
        let result = await client.query(query,values) ;
        client.release();
        this.role_level_name = result.rows[0].name;
        return result.rows[0].name;
    }


    async getCachedOwnerName(pool) {
        if (this.owner_name) {
            return this.owner_name
        }
        const client = await pool.connect();
        const query = 'SELECT name FROM users WHERE id=$1';
        const values = [this.owner_id];
        let result = await client.query(query, values);
        client.release();
        this.owner_name = result.rows[0].name;
        return result.rows[0].name;
    }


}


module.exports = Interview;