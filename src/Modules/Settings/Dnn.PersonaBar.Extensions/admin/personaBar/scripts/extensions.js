'use strict';
define(['jquery',
    'main/config'
],
    function ($, cf) {
        var utility;
        var config = cf.init();

        function loadScript() {
            var url = "modules/extensions/scripts/bundles/extensions-bundle.js";
             //var url = "http://localhost:8080/dist/extensions-bundle.js";
            
            $.ajax({
                dataType: "script",
                cache: true,
                url: url
            });
        }

        return {
            init: function (wrapper, util, params, callback) {
                utility = util;

                window.dnn.initExtensions = function initializeExtensions() {
                    return {
                        utility: utility,
                        settings: params.settings,
                        moduleName: 'Extensions'
                    };
                };
                loadScript();

                if (typeof callback === "function") {
                    callback();
                }
            },

            initMobile: function (wrapper, util, params, callback) {
                this.init(wrapper, util, params, callback);
            },

            load: function (params, callback) {
            },

            loadMobile: function (params, callback) {
                this.load(params, callback);
            }
        };
    });


