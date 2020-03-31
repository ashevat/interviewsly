
class Template {
    constructor(pool) {
        this.id = 0
        this.pool = pool;
        this.description = "";
        this.interviewTypes = [];
        this.public = 0;
        this.team_id = -1;

    }


    async getPublicTemplates(role_id, level_id) {
        const client = await this.pool.connect();
        const query = 'SELECT * FROM templates WHERE role_id=$1 AND level_id=$2 AND is_public=$3 AND active=$4';
        const values = [role_id, level_id,1,1 ];
        let result = await client.query(query,values );
        client.release();
        let templates = [];
        for (let index = 0; index < result.rows.length; index++) {
            let template = new Template(this.pool);
            template = this.populateTemplate(template, result.rows[index]);
            templates.push(template)
        }
        return templates;
    }

    async copyPublicTemplate(role_id, role_level_id, team_id) {

    }

    async createTemplate(role_id, level_id, team_id, description, user_id) {
        let template = new Template(this.pool);
        template.role_id = role_id;
        template.level_id = level_id;
        template.team_id = team_id;
        template.description = description;
        template.user_id = user_id;
        template.active = 1;
        const client = await this.pool.connect();
        const query = 'INSERT INTO templates( role_id, level_id, team_id, description, user_id, active, is_public )VALUES( $1, $2, $3, $4, $5, $6, $7) RETURNING id';
        const values = [template.role_id, template.level_id, template.team_id, template.description, template.user_id,1,0];
        let res1 = await client.query(query, values);
        template.id = res1.rows[0].id;
        client.release();
        return template;
    }


    async getRoleName(){
        const client = await this.pool.connect();
        const query = 'SELECT name FROM roles WHERE id=$1';
        const values = [this.role_id];
        let result = await client.query(query, values);
        client.release();
        return result.rows[0].name;

    }

    async getLevelName(){
        const client = await this.pool.connect();
        const query = 'SELECT name FROM levels WHERE id=$1';
        const values = [this.level_id];
        let result = await client.query(query, values);
        client.release();
        return result.rows[0].name;

    }

    async getPublicTemplate(template_id) {
        const client = await this.pool.connect();
        const query = 'SELECT * FROM templates WHERE id=$1 AND is_public=$2';
        const values = [template_id, 1];
        let result = await client.query(query, values);
        client.release();
        let template = new Template(this.pool);
        template = this.populateTemplate(template, result.rows[0]);
        return template;
    }

    // todo: think about defaulting to public templates
    async getTemplate(role_id, level_id, team_id) {
        const client = await this.pool.connect();
        const query = 'SELECT * FROM templates WHERE role_id=$1 AND level_id=$2 AND team_id=$3 AND active=$4';
        const values = [role_id,level_id,team_id, 1 ];
        let result = await client.query(query, values);
        client.release();
        let template = new Template(this.pool);
        template = this.populateTemplate(template, result.rows[0]);
        return template;
    }

    async getTemplateById(id) {
        const client = await this.pool.connect();
        const query = 'SELECT * FROM templates WHERE id=$1';
        const values = [id];
        let result = await client.query(query,values );
        client.release();
        let template = new Template(this.pool);
        template = this.populateTemplate(template, result.rows[0]);
        return template;
    }

    async getInterviewTypes() {
        const client = await this.pool.connect();
        const query = 'SELECT * FROM template_interview_types WHERE template_id=$1 AND active=$2';
        const values = [this.id, 1];
        let result = await client.query(query,values );
        client.release();
       
        return result.rows;
    }

    async getInterviewTypeById(id) {
        const client = await this.pool.connect();
        const query = 'SELECT * FROM template_interview_types WHERE id=$1';
        const values = [id];
        let result = await client.query(query, values);
        client.release();
        
        return result.rows[0];
    }

    // returns ID
    async addInterviewType(name) {
        
        const client = await this.pool.connect();
        const query = 'INSERT INTO template_interview_types(template_id, name, active )VALUES($1, $2, $3 ) RETURNING id';
        const values = [this.id, name, 1 ];
        let res1 = await client.query(query,values );
        
        client.release();
        return  res1.rows[0].id;
        
    }

    async editInterviewType(interview_type_id ,name) {
        
        const client = await this.pool.connect();
        const query = 'UPDATE template_interview_types SET name=$1 WHERE id=$2';
        const values = [name, interview_type_id ];
        let res1 = await client.query(query, values);
        console.log()
        client.release();
        return this;
        
    }

    async removeInterviewType(interview_type_id) {
        
        const client = await this.pool.connect();
        const query = 'UPDATE template_interview_types SET active=$1 WHERE id= $2';
        const values = [0, interview_type_id ];
        let res1 = await client.query(query, values);
        client.release();
        return  this;
    }

    async getCompetencies(interview_type_id) {
        const client = await this.pool.connect();
        const query = 'SELECT * FROM template_interview_type_competencies WHERE template_id=$1 AND interview_type_id=$2 AND active=$3';
        const values = [this.id, interview_type_id, 1 ];
        let result = await client.query(query, values);
        client.release();
       
        return result.rows;
    }
    
    async editCompetency(competency_id, competency) {
        const client = await this.pool.connect();
        const query = 'UPDATE template_interview_type_competencies SET competency=$1  WHERE id=$2';
        const values = [competency, competency_id ];
        let result = await client.query(query, values );
        client.release();
       
        return result.rows;
    }


    async removeQuestions(competency_id) {
        const client = await this.pool.connect();
        const query = 'UPDATE template_competency_questions SET active=$1  WHERE competency_id=$2';
        const values = [0, competency_id ];
        let result = await client.query(query, values);
        client.release();
       
        return result.rows;
    }

    async getCompetency(id) {
        const client = await this.pool.connect();
        const query = 'SELECT * FROM template_interview_type_competencies WHERE id=$1 AND active=$2';
        const values = [id, 1 ];
        let result = await client.query(query, values);
        client.release();
       
        return result.rows[0];
    }
    // returns ID
    async addCompetency(interview_type_id, competency_name) {
        const client = await this.pool.connect();
        const query = 'INSERT INTO template_interview_type_competencies( template_id, interview_type_id, competency, active )VALUES( $1, $2, $3, $4 ) RETURNING id';
        const values = [this.id, interview_type_id,competency_name, 1 ];
        let res1 = await client.query(query, values );
        
        client.release();
        return  res1.rows[0].id;
    }

    async removeCompetency(competency_id) {
        const client = await this.pool.connect();
        const query = 'UPDATE template_interview_type_competencies SET active=$1 WHERE id= $2';
        const values = [0, competency_id];
        let res1 = await client.query(query, values);
        client.release();
        return  this;
    }

    async getQuestions(competency_id) {
        const client = await this.pool.connect();
        const query = 'SELECT * FROM template_competency_questions WHERE template_id=$1 AND competency_id=$2 AND active=$3';
        const values = [this.id, competency_id, 1];
        let result = await client.query(query, values);
        client.release();
       
        return result.rows;
    }

    async addQuestion(competency_id, question_text, author_id) {
        const client = await this.pool.connect();
        const query = 'INSERT INTO template_competency_questions(template_id, competency_id, question, author_id, active )VALUES( $1, $2, $3, $4, $5 ) RETURNING id'
        const values = [ this.id, competency_id, question_text, author_id, 1 ];
        let res1 = await client.query(query, values);
        
        client.release();
        return  res1.rows[0].id;
    }

    async removeQuestion(question_id) {
        const client = await this.pool.connect();
        const query = 'DELETE FROM template_competency_questions WHERE id= $1 ';
        const values = [question_id];
        let res1 = await client.query(query, values );
        client.release();
        return  this;
    }


    populateTemplate(template, data) {
        
        if(!data) return null;

        template.id = data.id;
        template.description = data.description;
        template.public = data.is_public;
        template.role_id = data.role_id;
        template.level_id = data.level_id;
        template.team_id = data.team_id;
        template.user_id = data.user_id;
        template.active = data.active
        return template;
    }



}


module.exports = Template;