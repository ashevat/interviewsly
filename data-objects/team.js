class Team {
    
    async getTeamBySlackID(slackID, pool){
        
        //const client = await pool.connect();
        const query = 'SELECT * FROM teams WHERE slack_team_id=$1';
        const values = [slackID];
        let result = await pool.query(query, values);        
        
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
           // client.release(); 
            return u;
        }else{
            //client.release(); 
            return null; 
        }
    }


    async getTeam(id, pool){
        
        //const client = await pool.connect();
        const query = 'SELECT * FROM teams WHERE id=$1';
        const values = [id];
        let result = await pool.query(query, values);        
        
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
            //client.release(); 
            return u;
        }else{
            //client.release(); 
            return null; 
        }
    }

    async getActiveTeamData(pool){
        //const client = await pool.connect();
        const query = 'SELECT * FROM teams WHERE status=$1';
        const values = [1];
        let res1 = await pool.query(query, values);
        //client.release(); 
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
        //const client = await pool.connect();
        const query = 'INSERT INTO teams(slack_team_id, name, owner_id, owner_slack_id, token, raw )VALUES( $1, $2, $3, $4, $5, $6) RETURNING id';
        const values = [this.slack_team_id,this.name, this.owner_id, this.owner_slack_id, this.token, this.raw ];
        let res1 = await pool.query(query, values);
        this.id = res1.rows[0].id;
        //client.release(); 
        return this;
    }



    async updateToken(token, pool) {
        
        //const client = await pool.connect();
        const query = 'UPDATE teams SET token=$1 WHERE id=$2 RETURNING id';
        const values = [token, this.id];
        let res1 = await pool.query(query, values);
        this.id = res1.rows[0].id;
        //client.release(); 
        return this;
    }

    async updateRaw(raw, pool) {
        
        //const client = await pool.connect();
        const query = 'UPDATE teams SET raw=$1 WHERE id=$2 RETURNING id';
        const values = [raw, this.id];
        let res1 = await pool.query(query, values);
        this.id = res1.rows[0].id;
        //client.release(); 
        return this;
    }

    async activateTeam(plan, raw, pool){
        //const client = await pool.connect();
        const query = 'UPDATE teams SET billing_data_raw=$1, status=$2, plan_id=$3  WHERE id=$4 RETURNING id';
        const values = [raw, 1, plan, this.id];
        let res1 = await pool.query(query, values);
        this.id = res1.rows[0].id;
        //client.release(); 
        return this;

    }

    async activateTeamTrial(plan, raw, pool){
        //const client = await pool.connect();
        const query = 'UPDATE teams SET billing_data_raw=$1, status=$2, plan_id=$3  WHERE id=$4 RETURNING id';
        const values = [raw, 2, plan, this.id];
        let res1 = await pool.query(query, values);
        this.id = res1.rows[0].id;
        //client.release(); 
        return this;

    }

    async deactivateTeam(pool){
        //const client = await pool.connect();
        const query = 'UPDATE teams SET  status=$1  WHERE id=$2 RETURNING billing_data_raw';
        const values = [-2, this.id];
        let res1 = await pool.query(query, values);
        
        //client.release(); 
        return res1.rows[0].billing_data_raw;

    }



  }

  module.exports = Team;


  