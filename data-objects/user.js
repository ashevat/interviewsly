class User {
    
    async getUserBySlackID(slackID, pool){
        
        const client = await pool.connect();
        let result = await client.query(`SELECT * FROM users WHERE slack_user_id='${slackID}'`);        
        
        if(result.rows[0]){
            let u = new User()
            u.id = result.rows[0].id;
            u.slack_user_id = result.rows[0].slack_user_id;
            u.username = result.rows[0].username;
            u.name = result.rows[0].name;
            u.team_id = result.rows[0].team_id;
            client.release(); 
            return u;
        }else{
            client.release(); 
            return null; 
        }
        

    }

    async create(params, pool) {
        
        this.slack_user_id = params.slack_user_id;
        this.username = params.username;
        this.name = params.name;
        this.team_id = params.team_id;

        const client = await pool.connect();
        let res1 = await client.query(`INSERT INTO users(id, slack_user_id, username, name, team_id )VALUES(DEFAULT, '${this.slack_user_id}', '${this.username}', '${this.name}'  , '${this.team_id}'  ) RETURNING id`);
        this.id = res1.rows[0].id;
        client.release(); 
        return this;
    }


  }

  module.exports = User;


  