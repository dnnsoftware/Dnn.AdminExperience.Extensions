import React, {Component, PropTypes} from "react";
import styles from "./style.less";
import Localization from "../../localization";
import RadioButtons from "dnn-radio-buttons";
import utils from "../../utils";

class PageTypeSelector extends Component {

    getComponents() {
        const {props} = this;
        if (props.components && props.components.length > 0) {
            return this.props.components.map((component, index) => {
                const Component = component.component;
                return <Component key={index} page={props.page} />;
            });
        }
        return false;
    }
    _getHierarchyLabel() {
        const page = this.props.page;
        if (page.hierarchy === null || page.hierarchy === "" || page.hierarchy === Localization.get("NoneSpecified")) {
            return Localization.get("TopPage");
        } else {
            return page.hierarchy;
        }
    }
    render() {
        const {page, onChangePageType} = this.props;
        const createdDate = Localization.get("CreatedValue")
                                .replace("[CREATEDDATE]", utils.formatDateNoTime(page.createdOnDate))
                                .replace("[CREATEDUSER]", page.created || "System");
        
        const hierarchy = this._getHierarchyLabel();        
        const components = this.getComponents(); 

        let pageParentInfoStyle = null;
        let parentPageStyleLabel = null;
        let parentPageStyleContent = null;
        

        if (hierarchy.length < 31) {
            parentPageStyleLabel = {"display":"inline"};
            parentPageStyleContent = {
                "display":"inline"
            };
        } else {
            pageParentInfoStyle = {"margin":"10px 0px 10px 0px"};
            parentPageStyleLabel = {
                "display":"inline-block",
                "width":"50px;",
                "vertical-align":"top"
            };
            
            parentPageStyleContent = {
                "display":"inline-block",
                "width":"600px",
                "word-wrap":"break-word",
                "padding-left":"10px"
            };
        }

        return (
            <div className={styles.pageTypeSelector}>
                <div>
                    {components}
                </div>
                <div>
                    <div className="page-info-row page-name">
                        {page.name}
                    </div>
                    <div className="page-info-row">
                        <div className="page-info-item">
                            <span className="page-info-item-label">
                                {Localization.get("Created") + ": "}
                            </span>
                            <span className="page-info-item-value">
                                {createdDate}
                            </span>
                        </div>
                        <div className="page-info-item" style={pageParentInfoStyle}>
                            <div className="page-info-item-label" style={parentPageStyleLabel}>
                                {Localization.get("PageParent") + ": "}
                            </div>
                            <div className="page-info-item-value parent-page-name" style={parentPageStyleContent}>
                                {hierarchy}
                            </div>
                        </div>
                        <div className="page-info-item">
                            <span className="page-info-item-label">
                                {Localization.get("Status") + ": "}
                            </span>
                            <span className="page-info-item-value">
                                {Localization.get("Status_" + page.status)}
                            </span>
                        </div>
                    </div>
                    <div className="page-info-row">
                        <div className="page-info-item page-type">
                            <span className="page-info-item-label">
                                {Localization.get("PageType") + ": "}
                            </span>
                            <span className="page-info-item-value">
                                <RadioButtons
                                    options={[{value: "normal", label: Localization.get("Standard")},
                                            {value: "tab", label: Localization.get("Existing")},
                                            {value: "url", label: Localization.get("Url")},
                                            {value: "file", label: Localization.get("File")}]}
                                    onChange={onChangePageType}
                                    value={page.pageType}/>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

PageTypeSelector.propTypes = {
    page: PropTypes.object.isRequired,
    onChangePageType: PropTypes.func.isRequired,
    components: PropTypes.array.isRequired
};

export default PageTypeSelector;
