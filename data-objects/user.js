class User {
    
    async getUserBySlackID(slackID, pool){
        
        //const client = await pool.connect();
        const query = 'SELECT * FROM users WHERE slack_user_id=$1';
        const values = [slackID];
        let result = await pool.query(query,values );        
        
        if(result.rows[0]){
            let u = new User()
            u.id = result.rows[0].id;
            u.slack_user_id = result.rows[0].slack_user_id;
            u.username = result.rows[0].username;
            u.name = result.rows[0].name;
            u.team_id = result.rows[0].team_id;
            u.raw = result.rows[0].raw;
            //client.release(); 
            return u;
        }else{
            //client.release(); 
            return null; 
        }
        

    }

    async create(params, pool) {
        
        this.slack_user_id = params.slack_user_id;
        this.username = params.username;
        this.name = params.name;
        this.team_id = params.team_id;
        this.raw = params.raw;

        //const client = await pool.connect();
        const query = 'INSERT INTO users(slack_user_id, username, name, team_id, raw )VALUES( $1, $2, $3 , $4 , $5) RETURNING id';
        const values = [this.slack_user_id, this.username, this.name, this.team_id, this.raw ];
        let res1 = await pool.query(query, values);
        this.id = res1.rows[0].id;
        //client.release(); 
        return this;
    }

    async updateTeamId(team_id, pool){
        //const client = await pool.connect();
        const query = 'UPDATE users SET team_id=$1 WHERE id=$2';
        const values = [team_id, this.id];
        let result = await pool.query(query, values);
        this.team_id = team_id;
        //client.release(); 
        return this;

    }

    async getTodaysPanelistsToNotify(team_id, pool){
        //const client = await pool.connect();
        var moment = require('moment');
        let date =  moment().startOf('day').format("YYYY-MM-DD");
        const query = 'SELECT * from interview_panelists INNER JOIN users ON interview_panelists.panelist_id = users.id INNER JOIN interviews ON interviews.id = interview_panelists.interview_id  WHERE interviews.status=$1 AND interview_panelists.date=$2 AND users.team_id=$3 AND interview_panelists.active=$4 AND interview_panelists.notified=$5';
        const values = [1, date, team_id,1, 0];
        let result = await pool.query(query, values);
        this.team_id = team_id;
        //client.release(); 
        return result.rows;        

    }

    async panalistNotified(panelist_id, interview_id, pool){
        //const client = await pool.connect();
        const query = 'UPDATE interview_panelists SET notified=$1 WHERE panelist_id=$2 AND interview_id=$3';
        const values = [1, panelist_id,interview_id ];
        let result = await pool.query(query, values);
        //client.release(); 
    }

  }

  module.exports = User;


  