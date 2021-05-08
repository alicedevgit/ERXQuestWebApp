import React from 'react';
import ReactSelect from 'react-select'

export const SearchableDropDownList = (props) => {
    //const { mode, userToken, label } = props;
    return (
        <ReactSelect
            value={""}
            options={[{ value: "1", label: "1111" }, { value: "2", label: "222" }]}
            //onChange={handleChange}
            placeholder="Search..."
            openMenuOnClick={false}
        />
    );
}