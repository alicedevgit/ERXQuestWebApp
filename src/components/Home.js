import React, { Component } from 'react';
import { HorizontalLabelPositionBelowStepper } from '../global/Stepper';
import { ExportCSV } from '../global/ExportCSV';
import { API_ROOT } from '../global/GlobalVariables'; 
export class Home extends Component {

    constructor(props) {
        super(props);
        this.state = { QuestionCategories: [], loading: true };
    }

    static displayName = Home.name;  

    async getSteps() {
        //Retrieve all question categories from API
        const questCategories = await fetch(`${API_ROOT}question/categories`)
            .then(response => response.json());

        this.setState({ QuestionCategories: questCategories });

        //Initial questions od the first category (if exists)
        if (questCategories && questCategories[0]) {
            const questions = await fetch(`${API_ROOT}question/cat/${questCategories[0].id}`).then(response => response.json());

            this.setState({ InitQuestions: questions });

            if (questions) {
                var tmpQChoices = [];
                for (const question of questions) {
                    await fetch(`${API_ROOT}question/choices/${question.id}`)
                        .then(response => response.json())
                        .then(retChoices => { try { if (retChoices && !retChoices.status) tmpQChoices.push({ questionId: question.id, choices: retChoices }) } catch { } })
                        .then(this.setState({ InitQuestionChoices: tmpQChoices }));

                    await fetch(`${API_ROOT}question/restriction/${question.id}`)
                        .then(response => response.json())
                        .then(retRestrictions => this.setState({ InitQuestionRestrictions: retRestrictions })) 
               }
            }
            
        } 
    }

    componentDidMount() {
        this.getSteps();
    }

    render() {
        const { QuestionCategories, InitQuestions, InitQuestionChoices, InitQuestionRestrictions } = this.state;

    return (
        <div>
            <div>
                <ExportCSV label={"Export all Responses"} mode={"all"}/>
            </div>
            <div>
                <h3>Hello, Guy!</h3>
                <p>Welcome to ERX Questionnaire, please try it: </p>
            </div> 
            <HorizontalLabelPositionBelowStepper
                questionCategories={QuestionCategories}
                initQuestions={InitQuestions}
                initQuestionChoices={InitQuestionChoices}
                    initQuestionRestrictions={InitQuestionRestrictions} />  
        </div>
        
    );
  }
}
