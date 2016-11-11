/*
DotNetNuke® - http://www.dotnetnuke.com
Copyright (c) 2002-2016
by DotNetNuke Corporation
All Rights Reserved
*/

/*
* Module responsible to Css Editor
*/
'use strict';
define(['jquery',
        'knockout',
        'knockout.mapping',
        'main/codeEditor',
		'main/config',
        'dnn.jquery',
        'main/koBindingHandlers/jScrollPane'],
    function ($, ko, koMapping, codeEditor, cf, jScrollPane) {
        var config = cf.init();

        var isMobile, identifier, utility, $panel, viewModel, cssEditor, curPortalId;

        var requestService = function (type, method, params, callback, failure) {
            utility.sf.moduleRoot = "personaBar";
            utility.sf.controller = "CssEditor";

            utility.sf[type].call(utility.sf, method, params, callback, failure);
        }

        var getPortals = function () {
            requestService('get', 'GetPortals', {}, function (data) {
                viewModel.portals(data.Results);
                viewModel.portal(data.Results[0]);
            }, function () {
                // failed
                utility.notifyError('Failed...');
            });
        }

        var getStyleSheet = function () {
            requestService('get', 'GetStyleSheet', { 'portalId': curPortalId }, function (data) {
                cssEditor.setValue(data.Content);
            }, function () {
                // failed
                utility.notifyError('Failed...');
            });
        }

        var saveStyleSheet = function () {
            requestService('post', 'UpdateStyleSheet', { 'portalId': curPortalId, 'styleSheetContent': cssEditor.getValue() }, function (data) {
                utility.notify(utility.resx.CssEditor.StyleSheetSaved);
            }, function () {
                // failed
                utility.notifyError('Failed...');
            });
        }

        var restoreStyleSheet = function () {
            utility.confirm(utility.resx.CssEditor.ConfirmRestore, utility.resx.CssEditor.RestoreButton, utility.resx.CssEditor.CancelButton, function () {
                requestService('post', 'RestoreStyleSheet', { 'portalId': curPortalId }, function (data) {
                    cssEditor.setValue(data.StyleSheetContent);
                    utility.notify(utility.resx.CssEditor.StyleSheetRestored);
                }, function () {
                    // failed
                    utility.notifyError('Failed...');
                });
            });
        }

        var initViewModel = function () {
            viewModel = {
                resx: utility.resx.CssEditor,
                stylesheet: ko.observable(''),
                saveStyleSheet: saveStyleSheet,
                restoreStyleSheet: restoreStyleSheet,
                portals: ko.observableArray([]),
                portal: ko.observable('')
            };
        }

        var portalChanged = function (data) {
            if (data != null && data.PortalID != curPortalId) {
                curPortalId = data.PortalID;
                getStyleSheet();
            }
        }

        var init = function (wrapper, util, params, callback) {
            identifier = params.identifier;
            utility = util;
            $panel = wrapper;

            initViewModel();

            ko.applyBindings(viewModel, $panel[0]);

            curPortalId = config.portalId;

            getPortals();
            getStyleSheet();

            cssEditor = codeEditor.init($panel.find('textarea'), { mode: 'css' });
            var panelHeight = $('#CssEditor-panel').height();
            if (panelHeight > 400) {
                cssEditor.setSize("100%", panelHeight - 330);
            }

            if (typeof callback === 'function') {
                callback();
            }

            cssEditor.on("blur", function (cm) {
                cm.save();
                return true;
            });

            viewModel.portal.subscribe(portalChanged);
        };

        var initMobile = function (wrapper, util, params, callback) {
            isMobile = true;
            this.init(wrapper, util, params, callback);
        };

        var load = function (params, callback) {
            if (typeof callback === 'function') {
                callback();
            }
        };

        var loadMobile = function (params, callback) {
            isMobile = true;
            this.load(params, callback);
        };

        return {
            init: init,
            load: load,
            initMobile: initMobile,
            loadMobile: loadMobile
        };
    });
