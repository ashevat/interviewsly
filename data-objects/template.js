
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
        let result = await client.query(`SELECT * FROM templates WHERE role_id='${role_id}' AND level_id='${level_id}' AND is_public='1' AND active='1'`);
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
        let res1 = await client.query(`INSERT INTO templates(id, role_id, level_id, team_id, description, user_id, active, is_public )VALUES(DEFAULT, '${template.role_id}', '${template.level_id}', '${template.team_id}'  , '${template.description}', '${template.user_id}', '1', '0' ) RETURNING id`);
        template.id = res1.rows[0].id;
        client.release();
        return template;
    }


    async getRoleName(){
        const client = await this.pool.connect();
        let result = await client.query(`SELECT name FROM roles WHERE id='${this.role_id}'`);
        client.release();
        return result.rows[0].name;

    }

    async getLevelName(){
        const client = await this.pool.connect();
        let result = await client.query(`SELECT name FROM levels WHERE id='${this.level_id}'`);
        client.release();
        return result.rows[0].name;

    }

    async getPublicTemplate(template_id) {
        const client = await this.pool.connect();
        let result = await client.query(`SELECT * FROM templates WHERE id='${template_id}'`);
        client.release();
        let template = new Template(this.pool);
        template = this.populateTemplate(template, result.rows[0]);
        return template;
    }

    // todo: think about defaulting to public templates
    async getTemplate(role_id, level_id, team_id) {
        const client = await this.pool.connect();
        let result = await client.query(`SELECT * FROM templates WHERE role_id='${role_id}' AND level_id='${level_id}' AND team_id='${team_id}' AND active='1' `);
        client.release();
        let template = new Template(this.pool);
        template = this.populateTemplate(template, result.rows[0]);
        return template;
    }

    async getTemplateById(id) {
        const client = await this.pool.connect();
        let result = await client.query(`SELECT * FROM templates WHERE id='${id}'`);
        client.release();
        let template = new Template(this.pool);
        template = this.populateTemplate(template, result.rows[0]);
        return template;
    }

    async getInterviewTypes() {
        const client = await this.pool.connect();
        let result = await client.query(`SELECT * FROM template_interview_types WHERE template_id='${this.id}' AND active='1'`);
        client.release();
       
        return result.rows;
    }

    async getInterviewTypeById(id) {
        const client = await this.pool.connect();
        let result = await client.query(`SELECT * FROM template_interview_types WHERE id='${id}'`);
        client.release();
        
        return result.rows[0];
    }

    // returns ID
    async addInterviewType(name) {
        
        const client = await this.pool.connect();
        let res1 = await client.query(`INSERT INTO template_interview_types(id, template_id, name, active )VALUES(DEFAULT, '${this.id}', '${name}', '1' ) RETURNING id`);
        
        client.release();
        return  res1.rows[0].id;
        
    }

    async editInterviewType(interview_type_id ,name) {
        
        const client = await this.pool.connect();
        let res1 = await client.query(`UPDATE template_interview_types SET name='${name}' WHERE id='${interview_type_id}' `);
        console.log()
        client.release();
        return this;
        
    }

    async removeInterviewType(interview_type_id) {
        
        const client = await this.pool.connect();
        let res1 = await client.query(`UPDATE template_interview_types SET active='0' WHERE id= '${interview_type_id}'`);
        client.release();
        return  this;
    }

    async getCompetencies(interview_type_id) {
        const client = await this.pool.connect();
        let result = await client.query(`SELECT * FROM template_interview_type_competencies WHERE template_id='${this.id}' AND interview_type_id='${interview_type_id}' AND active='1'`);
        client.release();
       
        return result.rows;
    }
    
    async editCompetency(competency_id, competency) {
        const client = await this.pool.connect();
        let result = await client.query(`UPDATE template_interview_type_competencies SET competency='${competency}'  WHERE id='${competency_id}' `);
        client.release();
       
        return result.rows;
    }


    async removeQuestions(competency_id) {
        const client = await this.pool.connect();
        let result = await client.query(`UPDATE template_competency_questions SET active='0'  WHERE competency_id='${competency_id}' `);
        client.release();
       
        return result.rows;
    }

    async getCompetency(id) {
        const client = await this.pool.connect();
        let result = await client.query(`SELECT * FROM template_interview_type_competencies WHERE id='${id}' AND active='1'`);
        client.release();
       
        return result.rows[0];
    }
    // returns ID
    async addCompetency(interview_type_id, competency_name) {
        const client = await this.pool.connect();
        let res1 = await client.query(`INSERT INTO template_interview_type_competencies(id, template_id, interview_type_id, competency, active )VALUES(DEFAULT, '${this.id}', '${interview_type_id}', '${competency_name}', '1' ) RETURNING id`);
        
        client.release();
        return  res1.rows[0].id;
    }

    async removeCompetency(competency_id) {
        const client = await this.pool.connect();
        let res1 = await client.query(`UPDATE template_interview_type_competencies SET active='0' WHERE id= '${competency_id}'`);
        client.release();
        return  this;
    }

    async getQuestions(competency_id) {
        const client = await this.pool.connect();
        let result = await client.query(`SELECT * FROM template_competency_questions WHERE template_id='${this.id}' AND competency_id='${competency_id}' AND active='1'`);
        //console.log(`SELECT * FROM template_competency_questions WHERE template_id='${this.id}' AND competency_id='${competency_id}' AND active='1'`);
        client.release();
       
        return result.rows;
    }

    async addQuestion(competency_id, question_text, author_id) {
        const client = await this.pool.connect();
        let res1 = await client.query(`INSERT INTO template_competency_questions(id, template_id, competency_id, question, author_id, active )VALUES(DEFAULT, '${this.id}', '${competency_id}', '${question_text}', '${author_id}', '1' ) RETURNING id`);
        
        client.release();
        return  res1.rows[0].id;
    }

    async removeQuestion(question_id) {
        const client = await this.pool.connect();
        let res1 = await client.query(`DELETE FROM template_competency_questions WHERE id= '${question_id}'`);
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