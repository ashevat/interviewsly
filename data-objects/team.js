class Team {
    
    async getTeamBySlackID(slackID, pool){
        
        const client = await pool.connect();
        let result = await client.query(`SELECT * FROM teams WHERE slack_team_id='${slackID}'`);        
        
        if(result.rows[0]){
            let u = new Team()
            u.id = result.rows[0].id;
            u.slack_team_id = result.rows[0].slack_team_id;
            u.name = result.rows[0].name;
            u.owner_id = result.rows[0].owner_id;
            u.raw = result.rows[0].raw;
            u.owner_slack_id = result.rows[0].owner_slack_id;
            u.token = result.rows[0].token;
            u.plan_id = result.rows[0].plan_id;
            u.status = result.rows[0].status;
            client.release(); 
            return u;
        }else{
            client.release(); 
            return null; 
        }
    }


    async getTeam(id, pool){
        
        const client = await pool.connect();
        let result = await client.query(`SELECT * FROM teams WHERE id='${id}'`);        
        
        if(result.rows[0]){
            let u = new Team()
            u.id = result.rows[0].id;
            u.slack_team_id = result.rows[0].slack_team_id;
            u.name = result.rows[0].name;
            u.owner_id = result.rows[0].owner_id;
            u.raw = result.rows[0].raw;
            u.owner_slack_id = result.rows[0].owner_slack_id;
            u.token = result.rows[0].token;
            u.plan_id = result.rows[0].plan_id;
            u.status = result.rows[0].status;
            client.release(); 
            return u;
        }else{
            client.release(); 
            return null; 
        }
    }

    async getActiveTeamData(pool){
        const client = await pool.connect();
        let res1 = await client.query(`SELECT * FROM teams WHERE status='1'`);
        client.release(); 
        return res1.rows;
    }

    async create(params, pool) {
        
        this.slack_team_id = params.slack_team_id;
        this.name = params.name;
        this.owner_id = params.owner_id;
        this.owner_slack_id = params.owner_slack_id;
        this.raw = params.raw;
        this.token = params.token
        this.status = -1;
        const client = await pool.connect();
        let res1 = await client.query(`INSERT INTO teams(id, slack_team_id, name, owner_id, owner_slack_id, token, raw )VALUES(DEFAULT, '${this.slack_team_id}', '${this.name}', '${this.owner_id}', '${this.owner_slack_id}', '${this.token}',  '${this.raw}'  ) RETURNING id`);
        this.id = res1.rows[0].id;
        client.release(); 
        return this;
    }



    async updateToken(token, pool) {
        
        const client = await pool.connect();
        let res1 = await client.query(`UPDATE teams SET token='${token}' WHERE id='${this.id}' RETURNING id`);
        this.id = res1.rows[0].id;
        client.release(); 
        return this;
    }

    async updateRaw(raw, pool) {
        
        const client = await pool.connect();
        let res1 = await client.query(`UPDATE teams SET raw='${raw}' WHERE id='${this.id}' RETURNING id`);
        this.id = res1.rows[0].id;
        client.release(); 
        return this;
    }

    async activateTeam(plan, raw, pool){
        const client = await pool.connect();
        let res1 = await client.query(`UPDATE teams SET billing_data_raw='${raw}', status='1', plan_id='${plan}'  WHERE id='${this.id}' RETURNING id`);
        this.id = res1.rows[0].id;
        client.release(); 
        return this;

    }

    async deactivateTeam(pool){
        const client = await pool.connect();
        let res1 = await client.query(`UPDATE teams SET  status='-2'  WHERE id='${this.id}' RETURNING billing_data_raw`);
        
        client.release(); 
        return res1.rows[0].billing_data_raw;

    }



  }

  module.exports = Team;


  