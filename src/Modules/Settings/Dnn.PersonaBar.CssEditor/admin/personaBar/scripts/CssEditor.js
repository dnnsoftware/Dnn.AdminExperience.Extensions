/*
DotNetNuke® - http://www.dotnetnuke.com
Copyright (c) 2002-2017
by DotNetNuke Corporation
 
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated 
documentation files (the "Software"), to deal in the Software without restriction, including without limitation 
the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and 
to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 
The above copyright notice and this permission notice shall be included in all copies or substantial portions 
of the Software.
 
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED 
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL 
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF 
CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
DEALINGS IN THE SOFTWARE.
*/

/*
* Module responsible to Css Editor
*/
'use strict';
define([
        'jquery',
        'knockout',
        'knockout.mapping',
        'main/codeEditor',
        'main/config',
        'dnn.jquery',
        'main/koBindingHandlers/jScrollPane'
    ],
    function($, ko, koMapping, codeEditor, cf, jScrollPane) {
        var config = cf.init();

        var identifier, utility, $panel, viewModel, cssEditor, curPortalId;

        var requestService = function(type, method, controller, params, callback, failure) {
            utility.sf.moduleRoot = "personaBar";
            utility.sf.controller = controller !== "" ? controller : "CssEditor";

            utility.sf[type].call(utility.sf, method, params, callback, failure);
        }

        var getPortals = function() {
            requestService('get', 'GetPortals', "Portals", {}, function(data) {
                viewModel.portals(data.Results);
                viewModel.portal(data.Results[0]);
            }, function() {
                // failed
                utility.notifyError('Failed...');
            });
        }

        var getStyleSheet = function() {
            requestService('get', 'GetStyleSheet', "", { 'portalId': curPortalId }, function(data) {
                cssEditor.setValue(data.Content);
            }, function() {
                // failed
                utility.notifyError('Failed...');
            });
        }

        var saveStyleSheet = function() {
            requestService('post', 'UpdateStyleSheet', "", { 'portalId': curPortalId, 'styleSheetContent': cssEditor.getValue() }, function(data) {
                utility.notify(utility.resx.CssEditor.StyleSheetSaved);
            }, function() {
                // failed
                utility.notifyError('Failed...');
            });
        }

        var restoreStyleSheet = function() {
            utility.confirm(utility.resx.CssEditor.ConfirmRestore, utility.resx.CssEditor.RestoreButton, utility.resx.CssEditor.CancelButton, function() {
                requestService('post', 'RestoreStyleSheet', "", { 'portalId': curPortalId }, function(data) {
                    cssEditor.setValue(data.StyleSheetContent);
                    utility.notify(utility.resx.CssEditor.StyleSheetRestored);
                }, function() {
                    // failed
                    utility.notifyError('Failed...');
                });
            });
        }

        var initViewModel = function() {
            viewModel = {
                resx: utility.resx.CssEditor,
                stylesheet: ko.observable(''),
                saveStyleSheet: saveStyleSheet,
                restoreStyleSheet: restoreStyleSheet,
                portals: ko.observableArray([]),
                portal: ko.observable('')
            };
        }

        var portalChanged = function(data) {
            if (data != null && data.PortalID != curPortalId) {
                curPortalId = data.PortalID;
                getStyleSheet();
            }
        }

        var init = function(wrapper, util, params, callback) {
            identifier = params.identifier;
            utility = util;
            $panel = wrapper;

            initViewModel();

            ko.applyBindings(viewModel, $panel[0]);

            curPortalId = config.portalId;
            if (params.settings.isHost) {
                getPortals();
            }
            getStyleSheet();

            cssEditor = codeEditor.init($panel.find('textarea'), { mode: 'css' });
            var panelHeight = $('#CssEditor-panel').height();
            if (panelHeight > 400) {
                cssEditor.setSize("100%", panelHeight - 330);
            }

            if (typeof callback === 'function') {
                callback();
            }

            cssEditor.on("blur", function(cm) {
                cm.save();
                return true;
            });

            viewModel.portal.subscribe(portalChanged);
        };

        var load = function(params, callback) {
            if (typeof callback === 'function') {
                callback();
            }
        };

        return {
            init: init,
            load: load
        };
    });