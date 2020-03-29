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
            u.raw = result.rows[0].raw;
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
        this.raw = params.raw;

        const client = await pool.connect();
        let res1 = await client.query(`INSERT INTO users(id, slack_user_id, username, name, team_id, raw )VALUES(DEFAULT, '${this.slack_user_id}', '${this.username}', '${this.name}'  , '${this.team_id}' , '${this.raw}' ) RETURNING id`);
        this.id = res1.rows[0].id;
        client.release(); 
        return this;
    }

    async updateTeamId(team_id, pool){
        const client = await pool.connect();
        let result = await client.query(`UPDATE users SET team_id='${team_id}' WHERE id='${this.id}'`);
        this.team_id = team_id;
        client.release(); 
        return this;

    }

    async getTodaysPanelistsToNotify(team_id, pool){
        const client = await pool.connect();
        var moment = require('moment');
        let date =  moment().startOf('day').format("YYYY-MM-DD");
        //console.log(`SELECT * from interview_panelists INNER JOIN users ON interview_panelists.panelist_id = users.id  WHERE interview_panelists.date='${date}' AND users.team_id='${team_id}' AND interview_panelists.notified='0'`);
        let result = await client.query(`SELECT * from interview_panelists INNER JOIN users ON interview_panelists.panelist_id = users.id INNER JOIN interviews ON interviews.id = interview_panelists.interview_id  WHERE interviews.status='1' AND interview_panelists.date='${date}' AND users.team_id='${team_id}' AND interview_panelists.active='1' AND interview_panelists.notified='0'`);
        this.team_id = team_id;
        client.release(); 
        return result.rows;        

    }

    async panalistNotified(panelist_id, interview_id, pool){
        const client = await pool.connect();
        let result = await client.query(`UPDATE interview_panelists SET notified='1' WHERE panelist_id='${panelist_id}' AND interview_id='${interview_id}'`);
        client.release(); 
    }

  }

  module.exports = User;


  