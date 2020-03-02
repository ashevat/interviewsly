
class Interview {
    
    async getInterviewById(id, pool){
        
        const client = await pool.connect();
        let result = await client.query(`SELECT * FROM interviews WHERE id='${id}'`);        
        
        if(result.rows[0]){
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
            client.release(); 
            return i;
        }else{
            client.release(); 
            return null; 
        }
        

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

    async addPannelist(pannelist_id, questions_type, pool){
         const client = await pool.connect();
         //console.log(`INSERT INTO interview_pannelists (id, interview_id, pannelist_id, questions_type )VALUES(DEFAULT, '${this.id}' ,'${pannelist_id}', '${questions_type}'`);
         const result1 = await client.query(
             `INSERT INTO interview_pannelists (id, interview_id, pannelist_id, questions_type )VALUES(DEFAULT, '${this.id}' ,'${pannelist_id}', '${questions_type}')`);
         client.release();        
        
        return this;
    }


    async getPannelists(pool){
        const client = await pool.connect();
        let result = await client.query(`SELECT * FROM interview_pannelists INNER JOIN users ON interview_pannelists.pannelist_id = users.id INNER JOIN question_type ON interview_pannelists.questions_type = question_type.id WHERE interview_id='${this.id}'`);
        client.release();        
       
       return result.rows;
   }


    async updateSlackChannelID(channel_id, pool){
        const client = await pool.connect();
        const result1 = await client.query(
            `UPDATE interviews SET slack_channel_id ='${channel_id}' WHERE id='${this.id}'  RETURNING slack_channel_id`);
        this.slack_channel_id = result1.rows[0].slack_channel_id;
        client.release(); 
        return this;
    }

    async getCachedRoleName(pool){
        if(this.role_name){
            return this.role_name
        }
        const client = await pool.connect();
        //console.log(`this = '${JSON.stringify(this)}'`);
        let result = await client.query(`SELECT name FROM roles WHERE id='${this.role_id}'`);
        client.release();  
        this.role_name =  result.rows[0].name
        return result.rows[0].name;
    }


    async getCachedRoleLevelName(pool){
        if(this.role_level_name){
            return this.role_level_name
        }
        const client = await pool.connect();
        //console.log(`this = '${JSON.stringify(this)}'`);
        let result = await client.query(`SELECT name FROM levels WHERE id='${this.role_level_id}'`);
        client.release(); 
        this.role_level_name =   result.rows[0].name; 
        return result.rows[0].name;
    }


    async getCachedOwnerName(pool){
        if(this.owner_name){
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