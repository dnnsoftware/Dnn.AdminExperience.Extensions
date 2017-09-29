import React, { Component, PropTypes } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import PersonaBarPageHeader from "dnn-persona-bar-page-header";
import PersonaBarPageBody from "dnn-persona-bar-page-body";
import PersonaBarPage from "dnn-persona-bar-page";
import {
    pageActions as PageActions,
    addPagesActions as AddPagesActions,
    templateActions as TemplateActions,
    visiblePanelActions as VisiblePanelActions,
    languagesActions as LanguagesActions,
    pageHierarchyActions as PageHierarchyActions
} from "../actions";
import PageSettings from "./PageSettings/PageSettings";
import AddPages from "./AddPages/AddPages";
import Localization from "../localization";
import PageList from "./PageList/PageList";
import SaveAsTemplate from "./SaveAsTemplate/SaveAsTemplate";
import Button from "dnn-button";
import utils from "../utils";
import panels from "../constants/panels";
import Sec from "./Security/Sec";
import securityService from "../services/securityService";
import permissionTypes from "../services/permissionTypes";
import BreadCrumbs from "./BreadCrumbs";

import GridCell from "dnn-grid-cell";

import PageDetails from "./PageDetails/PageDetails";
import Promise from "promise";

import { PagesSearchIcon, PagesVerticalMore, CalendarIcon } from "dnn-svg-icons";
import Dropdown from "dnn-dropdown";
import DayPicker from "./DayPicker/src/DayPicker";

import "./style.less";


import { PersonaBarPageTreeviewInteractor } from "./dnn-persona-bar-page-treeview";

function getSelectedTabBeingViewed(viewTab) {
    switch (viewTab) {
        case "details":
            return 0;
        case "permissions":
            return 1;
        case "localization":
            return 2;
        case "advanced":
            return 3;
    }
}


class App extends Component {
    constructor() {
        super();
        this.state = {
            referral: "",
            referralText: "",
            busy: false,
            headerDropdownSelection: "Save Page Template",
            toggleSearchMoreFlyout:false,
            toggleDropdownCalendar:null,
            inSearch: false,
            searchTerm: false
        };
    }

    componentDidMount() {
        const { props } = this;
        const viewName = utils.getViewName();
        const viewParams = utils.getViewParams();
        window.dnn.utility.setConfirmationDialogPosition();
        window.dnn.utility.closeSocialTasks();
        window.dnn.utility.expandPersonaBarPage();
        this.props.getPageList();

        if (viewName === "edit") {
            props.onLoadPage(utils.getCurrentPageId());
        }

        //Resolve tab being viewed, if view params are present.
        this.resolveTabBeingViewed(viewParams);

        //Listen to event fired to view page settings (from site settings)
        document.addEventListener("viewPageSettings", this.resolveTabBeingViewed.bind(this), false);
    }

    //Update referral text if coming from a referral. (ex: "SiteSettings", resx.get("BackToLanguages"))
    updateReferral(referral, referralText) {
        this.setState({
            referral,
            referralText
        });
    }

    //Method to go back to referral panel.
    goToReferralPanel(referral) {
        let personaBar = window.parent.dnn ? window.parent.dnn.PersonaBar : null;
        if (personaBar) {
            personaBar.openPanel(referral, {}); //Open, panel should already be rendered, so no need to pass params.
            this.updateReferral("", "");
        }
    }

    //Call method to go back to referral panel
    backToReferral(referral) {
        this.goToReferralPanel(referral);
    }

    //Resolves tab being viewed if view params are present.
    resolveTabBeingViewed(viewParams) {

        if (!viewParams) {
            return;
        }
        if (viewParams.pageId) {
            this.props.onLoadPage(viewParams.pageId);

        }
        if (viewParams.viewTab) {
            this.selectPageSettingTab(getSelectedTabBeingViewed(viewParams.viewTab));
        }
        if (viewParams.referral) {
            this.updateReferral(viewParams.referral, viewParams.referralText);
        }
    }

    componentWillMount() {
        this.props.getContentLocalizationEnabled();

    }

    componentWillUnmount() {
        document.removeEventListener("viewPageSettings");
    }


    componentWillReceiveProps(newProps) {
        this.notifyErrorIfNeeded(newProps);
        window.dnn.utility.closeSocialTasks();
        window.dnn.utility.expandPersonaBarPage();

    }

    notifyErrorIfNeeded(newProps) {
        if (newProps.error !== this.props.error) {
            const errorMessage = (newProps.error && newProps.error.message) || Localization.get("AnErrorOccurred");
            utils.notifyError(errorMessage);
        }
    }

    onPageSettings(pageId) {
        const { props } = this;
        props.onLoadPage(pageId);
    }

    onCreatePage(input) {
        this.props.onCreatePage(input);
    }

    onUpdatePage(input) {
        return new Promise((resolve) => {
            const update = (input && input.tabId) ? input : this.props.selectedPage;
            let newList = null;
            let cachedItem = null;

            const removeFromOldParent = () => {
                const left = () => {
                    const { pageList } = this.props;
                    pageList.forEach((item, index) => {
                        if (item.id == update.tabId) {
                            cachedItem = item;
                            const arr1 = pageList.slice(0, index);
                            const arr2 = pageList.slice(index + 1);
                            const newPageList = [...arr1, ...arr2];
                            this.props.updatePageListStore(newPageList);
                        }
                    });
                };


                const right = () => {
                    this._traverse((item, list, updateStore) => {
                        if (item.id == update.oldParentId) {
                            item.childListItems.forEach((child, index) => {
                                if (child.id === update.tabId) {
                                    cachedItem = child;
                                    const arr1 = item.childListItems.slice(0, index);
                                    const arr2 = item.childListItems.slice(index + 1);
                                    item.childListItems = [...arr1, ...arr2];
                                    item.childCount--;
                                    updateStore(list);
                                }
                            });
                        }
                    });
                };

                (update.oldParentId == -1 || update.parentId == -1) ? left() : right();
            };

            const addToNewParent = () => {

                this._traverse((item, list, updateStore) => {
                    if (item.id == update.parentId) {
                        (cachedItem) ? cachedItem.parentId = item.id : null;

                        switch (true) {
                            case item.childCount > 0 && !item.childListItems:
                                this.props.getChildPageList(item.id).then((data) => {
                                    item.isOpen = true;
                                    item.childListItems = data;
                                    updateStore(list);
                                });
                                break;
                            case item.childCount == 0 && !item.childListItems:
                                item.childCount++;
                                item.childListItems = [];
                                item.childListItems.push(cachedItem);
                                break;
                            case Array.isArray(item.childListItems) === true:
                                item.childCount++;
                                item.childListItems.push(cachedItem);
                                this.props.onLoadPage(cachedItem.id);
                                break;


                        }
                        item.isOpen = true;
                        updateStore(list);
                    }
                });
            };

            this.props.onUpdatePage(update, (page) => {
                if (update.oldParentId) {
                    removeFromOldParent();
                    addToNewParent();
                }

                this._traverse((item, list, updateStore) => {
                    if (item.id == update.tabId) {
                        item.name = update.name;
                        item.pageType = update.pageType;
                        updateStore(list);
                    }
                });

                this.props.onLoadPage(update.tabId);
                resolve();
            });
        });
    }

    onChangeParentId(newParentId) {
        this.onChangePageField('oldParentId', this.props.selectedPage.parentId);
    }

    onSearchClick(){
        const {searchTerm} = this.state;
        this.props.searchPageList(searchTerm);
    }

    onSearchFocus(){

    }

    onSearchFieldChange(e){
        this.setState({searchTerm:e.target.value}, ()=>{
            const {searchTerm} = this.state;
            switch(true){
                case searchTerm.length > 3:
                    this.onSearchClick();
                    this.setState({inSearch:true});
                return;
                case searchTerm.length === 0:
                    this.setState({inSearch:false});
                return;

            }
        });
    }

    onSearchBlur(){
        const {searchTerm} = this.state;
        searchTerm ? this.setState({inSearch:true}) : this.setState({inSearch:false});
    }

    onAddPage(parentPage) {
        this.clearEmptyStateMessage();

        const addPage = () => {
            const { props } = this;
            const { selectedPage } = props;
            let runUpdateStore = null;
            let pageList = null;

            this._traverse((item, list, updateStore) => {
                item.selected = false;
                pageList = list;
                runUpdateStore = updateStore;
            });

            runUpdateStore(pageList);

            if (selectedPage && selectedPage.tabId !== 0 && props.selectedPageDirty) {
                const onConfirm = () => this.props.getNewPage(parentPage);
                utils.confirm(
                    Localization.get("CancelWithoutSaving"),
                    Localization.get("Close"),
                    Localization.get("Cancel"),
                    onConfirm);

            } else {
                props.getNewPage(parentPage);
            }
        };

        const noPermission = () => this.setEmptyStateMessage("You do not have permission to add a child page to this parent");
        parentPage.canAddPage === undefined || parentPage.canAddPage ? addPage() : noPermission();
    }

    onCancelSettings() {
        if (this.props.selectedPageDirty) {
            this.showCancelWithoutSavingDialog();
        }
        else {
            this.props.onCancelPage();
        }
    }

    onDeleteSettings() {
        const { props } = this;
        const { selectedPage } = props;

        const left = () => {
            return () => {
                this.props.onDeletePage(props.selectedPage);
                this._traverse((item, list, updateStore) => {
                    if (item.id === props.selectedPage.parentId) {
                        let itemIndex = null;
                        item.childCount--;
                        (item.childCount === 0) ? item.isOpen = false : null;

                        item.childListItems.forEach((child, index) => {
                            if (child.id === props.selectedPage.tabId) {
                                itemIndex = index;
                            }
                        });
                        const arr1 = item.childListItems.slice(0, itemIndex);
                        const arr2 = item.childListItems.slice(itemIndex + 1);
                        item.childListItems = [...arr1, ...arr2];
                        updateStore(list);
                        props.onCancelPage();
                    }
                });
            };
        };

        const right = () => {
            return () => {
                let itemIndex;
                const pageList = JSON.parse(JSON.stringify(this.props.pageList));
                pageList.forEach((item, index) => {
                    if (item.id === selectedPage.tabId) {
                        itemIndex = index;
                    }
                });

                const arr1 = pageList.slice(0, itemIndex);
                const arr2 = pageList.slice(itemIndex + 1);
                const update = [...arr1, ...arr2];
                this.props.onDeletePage(props.selectedPage);
                this.props.updatePageListStore(update);
                this.props.onCancelPage();

            };
        };

        const onDelete = (selectedPage.parentId !== -1) ? left() : right();

        utils.confirm(
            Localization.get("DeletePageConfirm"),
            Localization.get("Delete"),
            Localization.get("Cancel"),
            onDelete);
    }

    onClearCache() {
        const { props } = this;
        props.onClearCache();
    }

    showCancelWithoutSavingDialog() {
        const onConfirm = () => {
            this.props.onCancelPage();

        };

        utils.confirm(
            Localization.get("CancelWithoutSaving"),
            Localization.get("Close"),
            Localization.get("Cancel"),
            onConfirm);
    }


    showCancelWithoutSavingDialogInEditMode(input) {
        const id = (input.hasOwnProperty('parentId')) ? input : this.props.selectedPage.tabId;

        if (this.props.selectedPageDirty) {
            const onConfirm = () => {
                this.props.onLoadPage(id).then((data) => {
                    this._traverse((item, list, updateStore) => {
                        if (item.id === id) {
                            Object.keys(this.props.selectedPage).forEach((key) => item[key] = this.props.selectedPage[key]);
                            this.props.updatePageListStore(list);
                            this.selectPageSettingTab(0);
                        }
                    });
                });
            };

            utils.confirm(
                Localization.get("CancelWithoutSaving"),
                Localization.get("Continue"),
                Localization.get("Go Back"),
                onConfirm);

        } else {
            this.props.onLoadPage(id);
        }
    }

    isNewPage() {
        const { selectedPage } = this.props;
        return selectedPage.tabId === 0;
    }

    getPageTitle() {
        const { selectedPage } = this.props;
        return this.isNewPage() ?
            Localization.get("AddPage") :
            selectedPage.name;
    }

    getSettingsButtons() {
        const { settingsButtonComponents, onLoadSavePageAsTemplate, onDuplicatePage, onShowPanel, onHidePanel } = this.props;
        const SaveAsTemplateButton = settingsButtonComponents.SaveAsTemplateButton || Button;
        const deleteAction = this.onDeleteSettings.bind(this);

        return (
            <div className="heading-buttons">
                <Sec permission={permissionTypes.ADD_PAGE} onlyForNotSuperUser={true}>
                    <Button type="primary" size="large" onClick={this.onAddPage.bind(this)}>{Localization.get("AddPage")}</Button>
                </Sec>
                <Sec permission={permissionTypes.EXPORT_PAGE}>
                    <SaveAsTemplateButton
                        type="secondary"
                        size="large"
                        onClick={onLoadSavePageAsTemplate}
                        onShowPanelCallback={onShowPanel}
                        onHidePanelCallback={onHidePanel}
                        onSaveAsPlatformTemplate={onLoadSavePageAsTemplate}>
                        {Localization.get("SaveAsTemplate")}
                    </SaveAsTemplateButton>
                </Sec>
                <Sec permission={permissionTypes.COPY_PAGE}>
                    <Button
                        type="secondary"
                        size="large"
                        onClick={onDuplicatePage}>
                        {Localization.get("DuplicatePage")}
                    </Button>
                </Sec>
                {!securityService.userHasPermission(permissionTypes.MANAGE_PAGE) &&
                    <Sec permission={permissionTypes.DELETE_PAGE} onlyForNotSuperUser={true}>
                        <Button
                            type="secondary"
                            size="large"
                            onClick={deleteAction}>
                            {Localization.get("Delete")}
                        </Button>
                    </Sec>
                }
            </div>
        );
    }

    selectPageSettingTab(index) {
        this.props.selectPageSettingTab(index);
    }


    getAddPages() {
        const { props } = this;

        return (<PersonaBarPage isOpen={props.selectedView === panels.ADD_MULTIPLE_PAGES_PANEL} fullWidth={true}>
            <PersonaBarPageHeader title={Localization.get("AddMultiplePages")}>
            </PersonaBarPageHeader>
            <PersonaBarPageBody backToLinkProps={{
                text: securityService.isSuperUser() && Localization.get("BackToPages"),
                onClick: props.onCancelAddMultiplePages
            }}>
                <AddPages
                    bulkPage={props.bulkPage}
                    onCancel={props.onCancelAddMultiplePages}
                    onSave={props.onSaveMultiplePages}
                    onChangeField={props.onChangeAddMultiplePagesField}
                    components={props.multiplePagesComponents} />
            </PersonaBarPageBody>
        </PersonaBarPage>);
    }

    getSaveAsTemplatePage() {
        const { props } = this;
        const pageName = props.selectedPage && props.selectedPage.name;
        const backToLabel = Localization.get("BackToPageSettings") + ": " + pageName;

        return (<PersonaBarPage isOpen={props.selectedView === panels.SAVE_AS_TEMPLATE_PANEL}>
            <PersonaBarPageHeader title={Localization.get("SaveAsTemplate")}>
            </PersonaBarPageHeader>
            <PersonaBarPageBody backToLinkProps={{
                text: backToLabel,
                onClick: props.onCancelSavePageAsTemplate
            }}>
                <SaveAsTemplate
                    onCancel={props.onCancelSavePageAsTemplate} />
            </PersonaBarPageBody>
        </PersonaBarPage>);
    }

    getAdditionalPanels() {
        const additionalPanels = [];
        const { props } = this;

        if (props.additionalPanels) {
            for (let i = 0; i < props.additionalPanels.length; i++) {
                const panel = props.additionalPanels[i];
                if (props.selectedView === panel.panelId) {
                    const Component = panel.component;
                    additionalPanels.push(
                        <Component
                            onCancel={props.onCancelSavePageAsTemplate}
                            selectedPage={props.selectedPage}
                            store={panel.store} />
                    );
                }
            }
        }

        return additionalPanels;
    }

    _traverse(comparator) {
        let listItems = JSON.parse(JSON.stringify(this.props.pageList));
        const cachedChildListItems = [];
        cachedChildListItems.push(listItems);
        const condition = cachedChildListItems.length > 0;

        const loop = () => {
            const childItem = cachedChildListItems.length ? cachedChildListItems.shift() : null;
            const left = () => childItem.forEach(item => {
                comparator(item, listItems, (pageList) => this.props.updatePageListStore(pageList));
                Array.isArray(item.childListItems) ? cachedChildListItems.push(item.childListItems) : null;
                condition ? loop() : exit();
            });
            const right = () => null;
            childItem ? left() : right();
        };

        const exit = () => null;

        loop();
        return;
    }

    setActivePage(pageInfo) {
        return new Promise((resolve) => {
            this.selectPageSettingTab(0);
            pageInfo.id = pageInfo.id || pageInfo.tabId;
            pageInfo.tabId = pageInfo.tabId || pageInfo.id;
            this.props.onLoadPage(pageInfo.tabId);
            resolve();
        });
    }

    onSelection(pageId) {
        const { selectedPage, selectedPageDirty } = this.props;
        this.selectPageSettingTab(0);
        const left = () => {
            if (!selectedPage || selectedPage.tabId !== pageId) {
                this.props.onLoadPage(pageId).then((data) => {
                    this.getToRootParent();
                });
                this.selectPageSettingTab(0);
            }
        };
        const right = () => (pageId !== selectedPage.tabId) ? this.showCancelWithoutSavingDialogInEditMode(pageId) : null;
        (!selectedPageDirty) ? left() : right();
    }

    onChangePageField(key, value) {
        this.props.onChangePageField(key, value);
    }

    onMovePage({ Action, PageId, ParentId, RelatedPageId }) {
        return PageActions.movePage({ Action, PageId, ParentId, RelatedPageId });
    }

    onDuplicatePage(item){
        const message = Localization.get("NoPermissionCopyPage");
        const duplicate = () => this.props.onDuplicatePage();
        const noPermission = () => this.setEmptyStateMessage(message);
        item.canCopyPage ? duplicate() : noPermission();
    }

    onViewEditPage(item) {
        this.clearEmptyStateMessage();
        const message = Localization.get("NoPermissionEditPage");
        const viewPage = () => PageActions.viewPage(item.id, item.url);
        const noPermission = () => this.setEmptyStateMessage(message);
        item.canManagePage ? viewPage() : noPermission();
    }

    onViewPage(item) {
        this.clearEmptyStateMessage();
        const view = () => {
            window.dnn.PersonaBar.closePanel();
            window.parent.location=item.url;
        };
        const message = Localization.get("NoPermissionViewPage");
        const noPermission = () => this.setEmptyStateMessage(message);
        item.canViewPage ? view() : noPermission();
    }

    setEmptyStateMessage(emptyStateMessage) {
        this.setState({emptyStateMessage});
        this.props.clearSelectedPage();
    }

    clearEmptyStateMessage(){
        this.setState({emptyStateMessage:null});
    }

    onSearchMoreFlyoutClick() {
        this.setState({toggleSearchMoreFlyout: !this.state.toggleSearchMoreFlyout});
    }

    toggleDropdownCalendar(){
        this.setState({toggleDropdownCalendar:!this.state.toggleDropdownCalendar});
    }

    render_PagesTreeViewEditor() {
        return (
            <GridCell columnSize={30} style={{ marginTop: "120px", backgroundColor: "#aaa" }} >
                <p>Tree Controller</p>
            </GridCell>
        );
    }

    render_PagesDetailEditor() {

        const render_emptyState = () => {
            const DefaultMessage = Localization.get("NoPageSelected");
            return (
                <div className="empty-page-state">
                    <div className="empty-page-state-message">
                        <h1>{ this.state.emptyStateMessage || DefaultMessage }</h1>
                        <p>Select a page in the tree to manage its settings here.</p>
                    </div>
                </div>
            );
        };


        const render_pageDetails = () => {
            const { props, state } = this;
            const {isContentLocalizationEnabled} = props;
            return (
                <PageSettings
                    selectedPage={this.props.selectedPage}
                    AllowContentLocalization={isContentLocalizationEnabled}
                    selectedPageErrors={{}}
                    selectedPageDirty={props.selectedPageDirty}
                    onCancel={this.showCancelWithoutSavingDialogInEditMode.bind(this)}
                    onDelete={this.onDeleteSettings.bind(this)}
                    onSave={this.onUpdatePage.bind(this)}
                    selectedPageSettingTab={props.selectedPageSettingTab}
                    selectPageSettingTab={this.selectPageSettingTab.bind(this)}
                    onChangeField={this.onChangePageField.bind(this)}
                    onChangeParentId={this.onChangeParentId.bind(this)}
                    onPermissionsChanged={props.onPermissionsChanged}
                    onChangePageType={props.onChangePageType.bind(this)}
                    onDeletePageModule={props.onDeletePageModule}
                    onEditingPageModule={props.onEditingPageModule}
                    onCancelEditingPageModule={props.onCancelEditingPageModule}
                    editingSettingModuleId={props.editingSettingModuleId}
                    onCopyAppearanceToDescendantPages={props.onCopyAppearanceToDescendantPages}
                    onCopyPermissionsToDescendantPages={props.onCopyPermissionsToDescendantPages}
                    pageDetailsFooterComponents={props.pageDetailsFooterComponents}
                    pageTypeSelectorComponents={props.pageTypeSelectorComponents}
                    onGetCachedPageCount={props.onGetCachedPageCount}
                    onClearCache={props.onClearCache}
                />
            );
        };
        const { selectedPage } = this.props;
        return (
            <GridCell columnSize={70} className="treeview-page-details" >
                {(selectedPage && selectedPage.tabId) ? render_pageDetails() : render_emptyState()}
            </GridCell>
        );
    }

    render_addPageEditor() {
        const { props } = this;
        const cancelAction = this.onCancelSettings.bind(this);
        const deleteAction = this.onDeleteSettings.bind(this);
        const AllowContentLocalization = !!props.isContentLocalizationEnabled;


        if (!props.selectedPageSettingTab || props.selectedPageSettingTab <= 0)
            this.selectPageSettingTab(0);
        return (
            <GridCell columnSize={70} className="treeview-page-details" >
                <PageSettings selectedPage={props.selectedPage || {}}
                    AllowContentLocalization={AllowContentLocalization}
                    selectedPageErrors={props.selectedPageErrors}
                    selectedPageDirty={props.selectedPageDirty}
                    onCancel={cancelAction}
                    onDelete={deleteAction}
                    onSave={this.onCreatePage.bind(this)}
                    selectedPageSettingTab={props.selectedPageSettingTab}
                    selectPageSettingTab={this.selectPageSettingTab.bind(this)}
                    onChangeField={this.onChangePageField.bind(this)}
                    onChangeParentId={this.onChangeParentId.bind(this)}
                    onPermissionsChanged={props.onPermissionsChanged}
                    onChangePageType={props.onChangePageType}
                    onDeletePageModule={props.onDeletePageModule}
                    onEditingPageModule={props.onEditingPageModule}
                    onCancelEditingPageModule={props.onCancelEditingPageModule}
                    editingSettingModuleId={props.editingSettingModuleId}
                    onCopyAppearanceToDescendantPages={props.onCopyAppearanceToDescendantPages}
                    onCopyPermissionsToDescendantPages={props.onCopyPermissionsToDescendantPages}
                    pageDetailsFooterComponents={props.pageDetailsFooterComponents}
                    pageTypeSelectorComponents={props.pageTypeSelectorComponents}
                    onGetCachedPageCount={props.onGetCachedPageCount}
                    onClearCache={props.onClearCache} />
            </GridCell>

        );
    }


    render_pageList() {
        return (
            <PageList onPageSettings={this.onPageSettings.bind(this)} />
        );
    }

    /* eslint-disable react/no-danger */
    render_more_flyout(){
        const options = [{value:true, label:"test"}];
        const date = Date.now();
        return(
            <div className="search-more-flyout">
                <GridCell columnSize={70} style={{padding: "5px 5px 5px 10px"}}>
                    <h1>GENERAL FILTERS</h1>
                </GridCell>
                <GridCell columnSize={30} style={{paddingLeft: "10px"}}>
                    <h1>TAG FILTERS</h1>
                </GridCell>
                <GridCell columnSize={70} style={{padding: "5px"}}>
                    <GridCell columnSize={100} >
                        <GridCell columnSize={50} style={{padding: "5px"}}>
                             <Dropdown className="more-dropdown" options={options} label="Filter by Page Type" onSelect={(data) => console.log(data) } withBorder={true} />
                        </GridCell>
                        <GridCell columnSize={50} style={{padding: "5px 5px 5px 15px"}}>
                            <Dropdown className="more-dropdown" options={options} label="Filter by Publish Status" onSelect={(data) => console.log(data) } withBorder={true} />
                        </GridCell>
                    </GridCell>
                    <GridCell columnSize={100}>
                        <GridCell columnSize={50} style={{padding: "5px"}}>
                            <div className="date-picker">
                                <GridCell className="calendar-dropdown-container" columnSize={100} style={{padding: "0px 5px"}}>
                                    <GridCell className="selected-date" columnSize={90}>
                                        <p>Filter by Published Date Range</p>
                                    </GridCell>
                                    <GridCell columnSize={10}>
                                        <div className="calendar-icon" dangerouslySetInnerHTML={{__html:CalendarIcon}} onClick={()=>this.toggleDropdownCalendar()}/>
                                    </GridCell>

                                    <div className={this.state.toggleDropdownCalendar ? "calendar-dropdown expand-down" : `calendar-dropdown ${this.state.toggleDropdownCalendar != null ? 'expand-up' : ''} ` }>
                                        <GridCell columnSize={100} style={{padding:"20px"}}>
                                            <GridCell columnSize={50}  className="calendar">
                                                 <DayPicker/>
                                            </GridCell>
                                            <GridCell columnSize={50} className="calendar">
                                                 <DayPicker onDayClick={(data) => {}} />
                                            </GridCell>
                                            <GridCell columnSize={100}>
                                                <Button type="primary" onClick={()=>{}}>Apply</Button>
                                            </GridCell>
                                        </GridCell>
                                    </div>
                                </GridCell>
                            </div>
                        </GridCell>
                        <GridCell columnSize={50} style={{padding: "5px 5px 5px 15px"}}>
                            <Dropdown className="more-dropdown" options={options} label="Filter by Workflow" onSelect={(data) => console.log(data) } withBorder={true} />
                        </GridCell>
                    </GridCell>
                </GridCell>
                <GridCell columnSize={30} style={{paddingLeft: "10px", paddingTop: "10px"}}>
                        <textarea></textarea>
                </GridCell>
                <GridCell columnSize={100} style={{textAlign:"right"}}>
                        <Button style={{marginRight: "5px"}} onClick={()=>{}}>Cancel</Button>
                        <Button type="primary" onClick={()=>{}}>Save</Button>
                </GridCell>
            </div>);
    }

    render_searchResults(){
        const {searchList} = this.props;
        const render_card = (item) => {

            return (
                <div className="search-item-card">
                    <div className="search-item-thumbnail">
                        <img src={item.thumbnail} />
                    </div>
                    <div className="search-item-details">
                        <h1>{item.name}</h1>
                        <h2>{item.tabpath}</h2>
                        <div className="search-item-details-list">
                            <ul>
                                <li>
                                    <p>Page Type:</p>
                                    <p>{item.pageType}</p>
                                </li>
                                <li>
                                    <p>Publish Status:</p>
                                    <p>{item.status}</p>
                                </li>
                                <li>
                                    <p>Publish Date:</p>
                                    <p>{item.publishDate}</p>
                                </li>
                            </ul>
                        </div>
                        <div className="search-item-details-list">
                            <ul>
                                <li>
                                    <p>Workflow:</p>
                                    <p>{item.workflowName}</p>
                                </li>
                                <li>
                                    <p>Tags:</p>
                                    <p>{
                                        item.tags.map((tag)=>{
                                        return(
                                            <span>
                                                {tag},
                                            </span>
                                            );
                                    })}</p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            );
        };

        return(
            <GridCell columnSize={70} className="fade-in">
                <GridCell columnSize={100} style={{padding:"20px"}}>
                    <GridCell columnSize={100} style={{textAlign:"right", padding:"10px", fontWeight:"bold", animation: "fadeIn .15s ease-in forwards"}}>
                        <p>{`${searchList.length} PAGES FOUND` }</p>
                    </GridCell>
                    <GridCell columnSize={100}>

                        {searchList.map((item)=>{
                            return render_card(item);
                        })}
                    </GridCell>
                </GridCell>
            </GridCell>
        );
    }

    render_details(){
        const {selectedPage} = this.props;
        const {inSearch} = this.state;

        switch(true){
            case inSearch:
                return this.render_searchResults();
            case selectedPage && selectedPage.tabId === 0:
                return this.render_addPageEditor();
            case !selectedPage:
            default:
                return this.render_PagesDetailEditor();
        }
    }

    render() {

        const { props } = this;
        const { selectedPage } = props;
        const {inSearch, headerDropdownSelection, toggleSearchMoreFlyout} = this.state;

        const additionalPanels = this.getAdditionalPanels();
        const isListPagesAllowed = securityService.canSeePagesList();
        let defaultLabel = "Save Page Template";
        const options = [{value:true, label:"Evoq Page Template"}, {value:true, label:"Export as XML"}];
        const onSelect = (selected) => this.setState({headerDropdownSelection:selected.label});

         /* eslint-disable react/no-danger */



        return (
            <div className="pages-app personaBar-mainContainer">
                {props.selectedView === panels.MAIN_PANEL && isListPagesAllowed &&
                    <PersonaBarPage fullWidth={true} isOpen={props.selectedView === panels.MAIN_PANEL}>
                        <PersonaBarPageHeader title={Localization.get("Pages")}>
                          {securityService.isSuperUser() && <Button type="primary" disabled={(selectedPage && selectedPage.tabId === 0) ? true : false} size="large" onClick={this.onAddPage.bind(this)}>{Localization.get("AddPage")}</Button>}
                            <Dropdown options={options} className="header-dropdown" label={defaultLabel} onSelect={(data)=> onSelect(data) } withBorder={true} />
                            <BreadCrumbs items={this.props.selectedPagePath} onSelectedItem={props.selectPage} />
                        </PersonaBarPageHeader>
                         { toggleSearchMoreFlyout ?  this.render_more_flyout() : null}
                        <GridCell columnSize={100} style={{padding:"20px"}}>
                            <div className="search-container">
                                <div className="search-box">
                                    <div className="search-input">
                                        <input
                                            type="text"
                                            onFocus={this.onSearchFocus.bind(this)}
                                            onChange={this.onSearchFieldChange.bind(this)}
                                            onBlur={this.onSearchBlur.bind(this)}
                                            onKeyPress={(e)=>{e.key ==="Enter" ? this.onSearchClick() : null; }}
                                            placeholder="Search"/>
                                    </div>
                                    <div
                                        className="btn search-btn"
                                        dangerouslySetInnerHTML={{ __html: PagesSearchIcon }}
                                        onClick={this.onSearchClick.bind(this)}
                                        >
                                    </div>
                                    <div
                                        className="btn search-btn"
                                        dangerouslySetInnerHTML={{ __html: PagesVerticalMore }}
                                        onClick={()=>{this.onSearchMoreFlyoutClick(); }}
                                        />
                                </div>
                            </div>
                        </GridCell>
                        <GridCell columnSize={100} style={{ padding: "0px 20px 20px 20px" }} >
                            <GridCell columnSize={100} className="page-container">
                                <div className={(selectedPage && selectedPage.tabId === 0 || inSearch) ? "tree-container disabled" : "tree-container"}>
                                    <div>
                                        <PersonaBarPageTreeviewInteractor
                                            Localization={Localization}
                                            pageList={this.props.pageList}
                                            getChildPageList={this.props.getChildPageList}
                                            getPage={this.props.getPage.bind(this)}
                                            _traverse={this._traverse.bind(this)}
                                            showCancelDialog={this.showCancelWithoutSavingDialogInEditMode.bind(this)}
                                            selectedPageDirty={this.props.selectedPageDirty}
                                            activePage={this.props.selectedPage}
                                            setEmptyPageMessage={this.setEmptyStateMessage.bind(this)}
                                            setActivePage={this.setActivePage.bind(this)}
                                            saveDropState={this.onUpdatePage.bind(this)}
                                            onMovePage={this.onMovePage.bind(this)}
                                            onViewPage={this.onViewPage.bind(this)}
                                            onViewEditPage={this.onViewEditPage.bind(this)}
                                            onDuplicatePage={this.onDuplicatePage.bind(this)}
                                            onAddPage={this.onAddPage.bind(this)}
                                            onSelection={this.onSelection.bind(this)}
                                            pageInContextComponents={props.pageInContextComponents} />
                                    </div>
                                </div>
                                {this.render_details()}
                            </GridCell>
                        </GridCell>
                    </PersonaBarPage>
                }
                {props.selectedView === panels.PAGE_SETTINGS_PANEL && props.selectedPage &&
                    this.getSettingsPage()
                }
                {props.selectedView === panels.ADD_MULTIPLE_PAGES_PANEL &&
                    this.getAddPages()
                }
                {props.selectedView === panels.SAVE_AS_TEMPLATE_PANEL &&
                    this.getSaveAsTemplatePage()
                }
                {additionalPanels}
            </div>
        );
    }
}

App.propTypes = {
    dispatch: PropTypes.func.isRequired,
    pageList: PropTypes.array.isRequired,
    searchList: PropTypes.array.isRequired,
    searchPageList: PropTypes.func.isRequired,
    getChildPageList: PropTypes.func.isRequired,
    selectedView: PropTypes.number,
    selectedPage: PropTypes.object,
    selectedPageErrors: PropTypes.object,
    selectedPageDirty: PropTypes.boolean,
    bulkPage: PropTypes.object,
    editingSettingModuleId: PropTypes.number,
    onCancelPage: PropTypes.func.isRequired,
    onCreatePage: PropTypes.func.isRequired,
    onUpdatePage: PropTypes.func.isRequired,
    onDeletePage: PropTypes.func.isRequired,
    getPageList: PropTypes.func.isRequired,
    getPage: PropTypes.func.isRequired,
    updatePageListStore: PropTypes.func.isRequire,
    getNewPage: PropTypes.func.isRequired,
    onLoadPage: PropTypes.func.isRequired,
    onCancelAddMultiplePages: PropTypes.func.isRequired,
    onSaveMultiplePages: PropTypes.func.isRequired,
    onLoadAddMultiplePages: PropTypes.func.isRequired,
    onChangeAddMultiplePagesField: PropTypes.func.isRequired,
    onChangePageField: PropTypes.func.isRequired,
    onChangePageType: PropTypes.func.isRequired,
    onPermissionsChanged: PropTypes.func.isRequired,
    onDeletePageModule: PropTypes.func.isRequired,
    onEditingPageModule: PropTypes.func.isRequired,
    onCancelEditingPageModule: PropTypes.func.isRequired,
    onCopyAppearanceToDescendantPages: PropTypes.func.isRequired,
    onCopyPermissionsToDescendantPages: PropTypes.func.isRequired,
    onLoadSavePageAsTemplate: PropTypes.func.isRequired,
    onCancelSavePageAsTemplate: PropTypes.func.isRequired,
    onDuplicatePage: PropTypes.func.isRequired,
    error: PropTypes.object,
    multiplePagesComponents: PropTypes.array.isRequired,
    pageDetailsFooterComponents: PropTypes.array.isRequired,
    settingsButtonComponents: PropTypes.object.isRequired,
    pageTypeSelectorComponents: PropTypes.array.isRequired,
    pageInContextComponents: PropTypes.array.isRequired,
    selectedPageSettingTab: PropTypes.number,
    selectPageSettingTab: PropTypes.func,
    additionalPanels: PropTypes.array.isRequired,
    onShowPanel: PropTypes.func.isRequired,
    onHidePanel: PropTypes.func.isRequired,
    isContentLocalizationEnabled: PropTypes.object.isRequired,
    getContentLocalizationEnabled: PropTypes.func.isRequired,
    selectPage: PropTypes.func.isRequired,
    selectedPagePath: PropTypes.array.isRequired,
    onGetCachedPageCount: PropTypes.array.isRequired,
    onClearCache: PropTypes.func.isRequired,
    clearSelectedPage: PropTypes.func.isRequired
};

function mapStateToProps(state) {
 
    return {
        pageList: state.pageList.pageList,
        searchList: state.searchList.searchList,
        selectedView: state.visiblePanel.selectedPage,
        selectedPage: state.pages.selectedPage,
        selectedPageErrors: state.pages.errors,
        selectedPageDirty: state.pages.dirtyPage,
        bulkPage: state.addPages.bulkPage,
        editingSettingModuleId: state.pages.editingSettingModuleId,
        error: state.errors.error,
        multiplePagesComponents: state.extensions.multiplePagesComponents,
        pageDetailsFooterComponents: state.extensions.pageDetailsFooterComponents,
        pageInContextComponents: state.extensions.pageInContextComponents,
        settingsButtonComponents: state.extensions.settingsButtonComponents,
        pageTypeSelectorComponents: state.extensions.pageTypeSelectorComponents,
        selectedPageSettingTab: state.pages.selectedPageSettingTab,
        additionalPanels: state.extensions.additionalPanels,
        isContentLocalizationEnabled: state.languages.isContentLocalizationEnabled,
        selectedPagePath: state.pageHierarchy.selectedPagePath
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        getNewPage: PageActions.getNewPage,
        getPageList: PageActions.getPageList,
        searchPageList: PageActions.searchPageList,
        getPage: PageActions.getPage,
        viewPage: PageActions.viewPage,
        getChildPageList: PageActions.getChildPageList,
        updatePageListStore: PageActions.updatePageListStore,
        onCancelPage: PageActions.cancelPage,
        onCreatePage: PageActions.createPage,
        onUpdatePage: PageActions.updatePage,
        onDeletePage: PageActions.deletePage,
        selectPageSettingTab: PageActions.selectPageSettingTab,
        onLoadPage: PageActions.loadPage,
        onSaveMultiplePages: AddPagesActions.addPages,
        onCancelAddMultiplePages: AddPagesActions.cancelAddMultiplePages,
        onLoadAddMultiplePages: AddPagesActions.loadAddMultiplePages,
        onChangeAddMultiplePagesField: AddPagesActions.changeAddMultiplePagesField,
        onChangePageField: PageActions.changePageField,
        onChangePageType: PageActions.changePageType,
        onPermissionsChanged: PageActions.changePermissions,
        onDeletePageModule: PageActions.deletePageModule,
        onEditingPageModule: PageActions.editingPageModule,
        onCancelEditingPageModule: PageActions.cancelEditingPageModule,
        onCopyAppearanceToDescendantPages: PageActions.copyAppearanceToDescendantPages,
        onCopyPermissionsToDescendantPages: PageActions.copyPermissionsToDescendantPages,
        onLoadSavePageAsTemplate: TemplateActions.loadSavePageAsTemplate,
        onCancelSavePageAsTemplate: TemplateActions.cancelSavePageAsTemplate,
        onDuplicatePage: PageActions.duplicatePage,
        onShowPanel: VisiblePanelActions.showPanel,
        onHidePanel: VisiblePanelActions.hidePanel,
        getContentLocalizationEnabled: LanguagesActions.getContentLocalizationEnabled,
        selectPage: PageHierarchyActions.selectPage,
        onGetCachedPageCount: PageActions.getCachedPageCount,
        onClearCache: PageActions.clearCache,
        clearSelectedPage: PageActions.clearSelectedPage

    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
