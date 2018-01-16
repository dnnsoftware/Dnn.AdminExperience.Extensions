import React, { Component } from "react";
import GridCell from "dnn-grid-cell";
import { PropTypes } from "prop-types";
import { DragSource } from 'react-dnd';


import "./styles.less";

import PersonaBarPageIcon from "./_PersonaBarPageIcon";
import PersonaBarSelectionArrow from "./_PersonaBarSelectionArrow";
import PersonaBarExpandCollapseIcon from "./_PersonaBarExpandCollapseIcon";
import PersonaBarDraftPencilIcon from "./_PersonaBarDraftPencilIcon";

export class PersonaBarPageTreeMenu extends Component {

    constructor() {
        super();
        this.state = {};
    }



    renderTree(childListItems) {
        return (
            <PersonaBarPageTreeMenu
                CallCustomAction={this.props.CallCustomAction}
                onAddPage={this.props.onAddPage}
                onViewPage={this.props.onViewPage}
                onViewEditPage={this.props.onViewEditPage}
                onDuplicatePage={this.props.onDuplicatePage}
                listItems={childListItems}
                traverse={this.props.traverse}
                pageInContextComponents={this.props.pageInContextComponents}
            />
        );
    }

    renderLi() {
        const { listItems, traverse } = this.props;

        return listItems.map((item) => {
            return (
                <li className="list-item-menu">
                    <div
                        className={(item.selected) ? "list-item-highlight" : null}
                        style={{ height: "28px", lineHeight: "35px" }}>
                        <div className="draft-pencil">
                            {item.canViewPage && <PersonaBarSelectionArrow
                                CallCustomAction={this.props.CallCustomAction}
                                onAddPage={this.props.onAddPage}
                                onViewPage={this.props.onViewPage}
                                onViewEditPage={this.props.onViewEditPage}
                                onDuplicatePage={this.props.onDuplicatePage}
                                item={item}
                                pageInContextComponents={this.props.pageInContextComponents}
                                traverse={traverse} />
                            }
                        </div>
                    </div>
                    {item.childListItems && item.isOpen ? this.renderTree(item.childListItems) : null}
                </li>
            );
        });
    }

    render() {

        return (
            <ul className="dnn-persona-bar-treeview-menu dnn-persona-bar-treeview-ul">
                {this.renderLi()}
            </ul>
        );
    }

}

PersonaBarPageTreeMenu.propTypes = {
    CallCustomAction: PropTypes.func.isRequired,
    onAddPage: PropTypes.func.isRequired,
    onViewPage: PropTypes.func.isRequired,
    onViewEditPage: PropTypes.func.isRequired,
    onDuplicatePage: PropTypes.func.isRequired,
    traverse: PropTypes.func.isRequired,
    listItems: PropTypes.array.isRequired,
    pageInContextComponents: PropTypes.array.isRequired
};