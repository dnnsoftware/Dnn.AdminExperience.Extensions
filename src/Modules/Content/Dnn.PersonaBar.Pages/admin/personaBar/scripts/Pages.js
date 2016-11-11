﻿define(['jquery', 'knockout', 'main/extension', 'main/config', 'jquery-ui.min', 'dnn.jquery'], function ($, ko, ext, cf) {
    'use strict';
    window.ko = ko;

    var isMobile;
    var identifier;
    var config = cf.init();
    function loadScript() {
        //var url = "http://localhost:8080/dist/pages-bundle.js"
        var url = "modules/pages/scripts/bundles/pages-bundle.js";
        $.ajax({
            dataType: "script",
            cache: true,
            url: url
        });
    }
    var init = function (wrapper, util, params, callback) {
        identifier = params.identifier;
        window.dnn.initPages = function initializePages() {
            return {
                utilities: util,
                moduleName: "Pages",
                config: config,
                viewName: (params && params.viewName) ? params.viewName : null
            };
        };

        loadScript();

        if (typeof callback === 'function') {
            callback();
        }
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
