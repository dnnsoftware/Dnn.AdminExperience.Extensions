import React, { Component,PropTypes  } from "react";
import SingleLineInputWithError from "dnn-single-line-input-with-error";
import Localization from "localization";
import passwordStrength from "utils/PasswordStrength";
import "./style.less";

//TODO: Replace with configuration from server
const defaultPasswordOptions = {
    minLength:7,
    minNumberOfSpecialChars:1,
    validationExpression:""
};

class Password extends Component {
    constructor(props) {
        super(props);
        
    }

    _getStrength(){
        let password = this.props.UserDetails.password;
        let pStrength = passwordStrength(password,defaultPasswordOptions);
        if (password.length <= 2 ) {
            return null;
        }
        if (pStrength.rating <3 ) {
            return "weak";
        }
        if (pStrength.rating < 5) {
            return "fair";
        }
        if (pStrength.rating >= 5) {
            return "strong";
        }
        return "weak";
    }

   
    render() {
        
        return (
            <div>
                <SingleLineInputWithError label={Localization.get("Password") }
                                error={this.props.error.password}
                                onChange={this.props.onChangePassword }
                                tooltipMessage={Localization.get("Password.Help")}
                                errorMessage={Localization.get("Password.Required") }
                                style={this.props.style}
                                inputStyle={!this.props.requiresQuestionAndAnswer ? { marginBottom: 15 } : { marginBottom: 0 }}
                                type="password"
                                autoComplete="off"
                                value={this.props.UserDetails.password}  tabIndex={7}/>

                <div id="passwordStrenghBar" className={"passwordStrength " + this._getStrength(this.props.UserDetails.password)}></div>
                <div id="passwordStrengthLabel" className={"passwordStrengthLabel " + this._getStrength(this.props.UserDetails.password)}>{this._getStrength(this.props.UserDetails.password)}</div>
            </div>
        );
    }
}

Password.propTypes = {
    error:PropTypes.object,
    style: PropTypes.object.isRequired,
    UserDetails: PropTypes.object.isRequired,
    requiresQuestionAndAnswer : PropTypes.bool.isRequired,
    onChangePassword : PropTypes.func.isRequired

};

export default Password;