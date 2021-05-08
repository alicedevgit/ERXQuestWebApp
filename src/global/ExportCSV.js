import React from 'react';
import { Fab, makeStyles, Button } from '@material-ui/core';
import { API_ROOT } from './GlobalVariables'; 
import { CSVLink } from "react-csv";

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
        display: 'flex'
    },
    backButton: {
        marginRight: theme.spacing(1),
    },
    instructions: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
    } 
}));

export const ExportCSV = (props) => {
    const { mode, userToken, label } = props;
    const [refresh, setRefresh] = React.useState(0);

    const [headers, setHeaders] = React.useState([]);
    const [data, setData] = React.useState([]);

    const classes = useStyles();
    const csvLink = React.useRef();

    React.useEffect(() => {
        async function fetchReport() { 
            var URL;
            if (mode === "all")
                URL = `${API_ROOT}answer/all`;
            else if (mode === "individual" && userToken)
                URL = `${API_ROOT}answer/${userToken}`;

            if (URL) {
                const report = await fetch(URL)
                    .then(response => response.json())
                    .catch((e) => console.log(e));

                if (report && !report.status) {
                    setHeaders(report.headers);
                    setData(report.data);
                    handleRefresh(0);
                    csvLink.current.link.click();
                }
            }
        }
        if(refresh === 1)
            fetchReport();

        return () => {
            console.log("This will be logged on unmount");
        }
    }, [refresh]); 

    const csvReport = {
        data: data,
        headers: headers,
        filename: 'ERXQuestionnaire.csv'
    }

    const handleRefresh = (value) => {
        setRefresh(value);
    };

    return (
        <div className={classes.root} >
            <Fab color="primary" variant="extended" aria-label="export" style={{ marginLeft: "auto" }}>
                <Button onClick={() => handleRefresh(1)} style={{ color: "white" }}>{label}</Button> 
                <CSVLink {...csvReport} ref={csvLink}></CSVLink>
            </Fab>
        </div>
    );
}