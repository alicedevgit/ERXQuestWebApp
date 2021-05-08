import React from 'react'; 
import Alert from '@material-ui/lab/Alert';
import {
    TextField, Stepper, Step, StepLabel, Button,
    Typography, InputLabel, MenuItem, FormControl,
    Select, makeStyles
} from '@material-ui/core';

import { API_ROOT } from './GlobalVariables'; 
import { ExportCSV } from './ExportCSV';
import ReactSelect from 'react-select' 
 
import Cookies from 'universal-cookie';

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
    },
    backButton: {
        marginRight: theme.spacing(1),
    },
    instructions: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(10),
    },
    textField: {
        width: '100%',
        marginLeft: 'auto',
        marginRight: 'auto', 
        marginBottom: '10px', 
    },
    input: {  
        fontWeight: 600
    },
    stepContentContainer: {
        border: '1px solid #EEF0F1',
        borderRadius: '5px',
        padding: '30px',
        marginBottom: '30px'
    }, 
    formControl: {
        width: '100%', 
        minWidth: 120,
    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    },
}));

let currentToken = "";
export const HorizontalLabelPositionBelowStepper = (props) => {
    const cookies = new Cookies();

    if (!cookies.get('UserToken')) {
        var randomToken = require('random-token').create('abcdefghijklmnopqrstuvwxzyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
        var token = randomToken(16);
        cookies.set('UserToken', token, { path: '/', maxAge: 3600 });
    }

    const { questionCategories, initQuestions, initQuestionChoices, initQuestionRestrictions } = props;
    const classes = useStyles();

    const existingAnswers = cookies.get('Answers');
    const [answers, setAnswers] = React.useState(existingAnswers && existingAnswers.length ? existingAnswers: [])
     
    const handleSetCookies = () => {
        cookies.set('Answers', answers, { path: '/', maxAge: 3600 });
    };

    const handleClearCookies = () => {
        cookies.remove('UserToken', { path: '/', maxAge: 3600 });
        cookies.remove('Answers', { path: '/', maxAge: 3600 });
    }

    const [activeStep, setActiveStep] = React.useState(0);
    const [questions, setQuestions] = React.useState(null);
    const [choices, setChoices] = React.useState(null);
    const [restrictions, setRestrictions] = React.useState(null);
    const [currentRestriction, setCurrentRestriction] = React.useState(null);
    const [sendAnswersSuccess, setSendAnswersSuccess] = React.useState(false);

    React.useEffect(() => {
        async function fetchQuestions() {
            var selectCategory = questionCategories[activeStep];
            if (selectCategory) {
                const returnedQuestions = await fetch(`${API_ROOT}question/cat/${selectCategory.id}`).then(response => response.json()); 
                setQuestions(returnedQuestions); 
            }
        } 

        fetchQuestions();

        return () => {
            console.log("This will be logged on unmount");
        }
    }, [activeStep]);

    React.useEffect(() => {
        async function fetchQuestionChoices() {
            if (questions) {
                var tmpQChoices = [];
                for (const question of questions) {
                    await fetch(`${API_ROOT}question/choices/${question.id}`)
                        .then(response => response.json())
                        .then(retChoices => {
                            try {
                                if (retChoices && !retChoices.status)
                                    tmpQChoices.push({ questionId: question.id, choices: retChoices })
                            } catch { }
                        })  
                }
                setChoices(tmpQChoices);
            }
        }

        fetchQuestionChoices();

        return () => {
            console.log("This will be logged on unmount");
        }
    }, [questions]); 

    React.useEffect(() => {
        async function fetchQuestionRestriction() {
            if (questions) { 
                var tmpQRestrictions = [];
                for (const question of questions) {
                    await fetch(`${API_ROOT}question/restriction/${question.id}`)
                        .then(response => response.json())
                        .then(retRestrictions => { tmpQRestrictions = [...tmpQRestrictions, ...retRestrictions] })
                }
                setRestrictions(tmpQRestrictions)
            }
        }

        fetchQuestionRestriction();

        return () => {
            console.log("This will be logged on unmount");
        }
    }, [questions]); 

    React.useEffect(() => {
        async function postAnswers() { 
            if (answers && answers.length) {
                const success = await fetch(`${API_ROOT}answer`, {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/ json'
                    },
                    body: JSON.stringify(answers)
                }).then(response => response.json());

                if (success && !success.status) {
                    currentToken = cookies.get('UserToken');
                    setAnswers([]);
                    handleClearCookies();
                    setSendAnswersSuccess(true);
                }
                else
                    setSendAnswersSuccess(false);
            }
            else setSendAnswersSuccess(false);
        }

        if (questionCategories
            && questionCategories.length > 0
            && activeStep === questionCategories.length) 
            postAnswers();

        return () => {
            console.log("This will be logged on unmount");
        }
    }, [activeStep]);

    React.useEffect(() => {
        handleSetCookies();
    }, [answers]);
   
    const updateAnswers = (questionId, value, label) => {
        var questRestrictions = restrictions ? restrictions : initQuestionRestrictions;
        let validAnswer = true;
        if (questRestrictions) {
            for (const qRest of questRestrictions) {
                if (qRest.questionId === questionId) {
                    if (qRest.restriction.notAllowedValue.includes(label)) {
                        setCurrentRestriction(qRest.restriction);
                        setActiveStep(-1);
                        validAnswer = false;
                    }
                }
            }
        }

        if (validAnswer) {
            var answerIndex = answers.findIndex(x => x.questionId === questionId);

            if (answerIndex === -1) {
                setAnswers([...answers, { token: cookies.get('UserToken'), questionId: questionId, value: value, text: label }]);
            }
            else {
                let existingAnswer = answers[answerIndex];
                existingAnswer["token"] = cookies.get('UserToken');
                existingAnswer["value"] = value;
                existingAnswer["text"] = label;
                setAnswers([
                    ...answers.slice(0, answerIndex),
                    existingAnswer,
                    ...answers.slice(answerIndex + 1)
                ]
                );
            } 
        }
    }

    const getStepContent = () => {
        var contents = questions ? questions : initQuestions;
        var questChoices = choices ? choices : initQuestionChoices;
   
        return (
            <div>
                <p>{ questionCategories && questionCategories[activeStep] ? questionCategories[activeStep].remark : "" }</p>
                {
                    contents ? contents.map((content, index) => ( 
                        <div key={index}> { getAnswerControl(content, questChoices, classes)} </div>
                    )) : <div></div>
                }
            </div>
        );
    }

    const getAnswersValue = (questionId) => {
        let index = answers.findIndex(x => x.questionId === questionId);
        if (index > -1)
            return answers[index].value; 
        else return "";
    }

    const getSelectObject = (questionId) => {
        let index = answers.findIndex(x => x.questionId === questionId);
        if (index > -1)
            return {
                value: answers[index].value, label: answers[index].text
            };
        else return null;
    }

    const searchList = (questionId, qChoices) => {
        let tmpChoices = [];
        if (qChoices) {
            qChoices
                .filter(function (item) {
                    return item.questionId === questionId;
                })
                .map(item => {
                    if (item.choices)
                        item.choices.map(choice => {
                            tmpChoices.push({
                                value: choice.value,
                                label: choice.text
                            });
                        })
                })
        }
        return tmpChoices;
    }

    const customStyles = () => {  
        return {
            menuPortal: provided => ({ ...provided, zIndex: 9999 }),
            menu: provided => ({ ...provided, zIndex: 9999 })
        }
    }

    const getAnswerControl = (content, qChoices, classes) => {
        switch (content.answerTypeId) {
            case 1: return <TextField id={"text-" + content.id}
                    label={content.name}
                    variant="outlined"
                    className={classes.textField}
                    value={getAnswersValue(content.id)}
                    onChange={event => {
                        const { value } = event.target;
                        updateAnswers(content.id, value, value);
                    }}
                    margin='normal' 
                    InputProps={{
                        className: classes.input,
                    }} />;
            case 2: return <FormControl variant="outlined" className={classes.formControl} margin='normal'>
                    <InputLabel id={"select-label-" + content.id}>{content.name}</InputLabel>
                    <Select id={"select-" + content.id}
                        labelId={"select-label-" + content.id}
                        value={getAnswersValue(content.id)} 
                        onChange={event => {
                            const { value } = event.target;
                            const { label } = event.currentTarget.dataset;
                            updateAnswers(content.id, value, label);
                        }}>
                        <MenuItem value="" data-label="" >
                            <em>None</em>
                        </MenuItem>
                        {
                            qChoices ? qChoices
                                .filter(function (item) { 
                                    return item.questionId === content.id;
                                })
                                .map(item => {
                                    return item.choices ? item.choices.map(choice => <MenuItem value={choice.value} data-label={choice.text} >{choice.text}</MenuItem>) : <div></div>

                                }) : <div></div>
                        }
                    </Select>
            </FormControl>
            case 3: return <div style={{ margin: '20px 0px 10px 0px' }}><ReactSelect
                        name={"react-select-" + content.id}
                        value={getSelectObject(content.id)}
                        options={searchList(content.id, qChoices)}
                        onChange={selectedOption => updateAnswers(content.id, selectedOption.value, selectedOption.label)} 
                        placeholder={content.name} 
                        openMenuOnClick={false}
                        menuPortalTarget={document.body}
                        menuPosition={'fixed'}
                    styles={customStyles}
                /></div>
            case 4: return <TextField
                    variant="outlined"
                    id={"date-picker-" + content.id}
                    label={content.name}
                    type="date" 
                    className={classes.textField}
                    InputLabelProps={{
                        shrink: true,
                    }}
                    margin='normal'
                    value={getAnswersValue(content.id)}
                    onChange={event => {
                        const { value } = event.target;
                        updateAnswers(content.id, value, value);
                    }}
                />
            case 5: return <TextField
                id={"outlined-multiline-static-" + content.id} 
                label={content.name}
                className={classes.textField}
                margin='normal'
                multiline
                rows={4}
                value={getAnswersValue(content.id)}
                variant="outlined"
                onChange={event => {
                    const { value } = event.target;
                    updateAnswers(content.id, value, value);
                }}/>
            default: return <div></div>;
        };
    }

    const handleFirst = () => {
        setActiveStep(0);
    };

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1); 
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReset = () => {
        setAnswers([]);
        handleClearCookies();
        setCurrentRestriction(null); 
        setActiveStep(0); 
    };

    return (
        <div className={classes.root}>
            <Stepper activeStep={activeStep} alternativeLabel>
                {questionCategories.map((questCat) => (
                    <Step key={questCat.id}>
                        <StepLabel>{questCat.name}</StepLabel>
                    </Step>
                ))}
            </Stepper>
            <div className={classes.stepContentContainer}>{
                questionCategories && questionCategories.length > 0 && activeStep === questionCategories.length ? (
                    <div>
                        {
                            sendAnswersSuccess ? (
                                <div>
                                    <Typography className={classes.instructions}><Alert severity="success">We've got your information. Thank you for participation :)</Alert></Typography>
                                    <Button onClick={handleReset}>Reset</Button>
                                    <ExportCSV mode={"individual"} userToken={currentToken} label={"Export CSV"} />
                                </div>
                            ) : (
                                    <div>
                                        <Typography className={classes.instructions}><Alert severity={!(answers && answers.length) ? "warning" : "error"}>{
                                            !(answers && answers.length) ? "Please answer at least one question :)"
                                                : "Your information didn't come yet, please recheck and retry..."
                                        }</Alert></Typography>
                                        <Button onClick={handleFirst}>Retry</Button>
                                </div>
                            )
                        }
                    </div>
                    
                ) : activeStep === -1 && currentRestriction ? (
                    <div>
                        <Typography className={classes.instructions}><Alert severity="error">{currentRestriction.warningMessage }</Alert></Typography>
                        <Button onClick={handleReset}>{currentRestriction.operation}</Button>
                    </div>
                ) : (
                        <div>
                            <Typography className={classes.instructions}>{ getStepContent() }</Typography>
                            <div>
                                <Button
                                    disabled={activeStep === 0}
                                    onClick={handleBack}
                                    className={classes.backButton}
                                >
                                        Back
                                </Button>
                                    <Button variant="contained" color="primary" onClick={handleNext}>
                                    {activeStep === questionCategories.length - 1 ? 'Finish' : 'Next'}
                                </Button>
                            </div>
                        </div>
                    )}
            </div>
        </div>
    );
}