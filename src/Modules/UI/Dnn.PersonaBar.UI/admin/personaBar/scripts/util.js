'use strict';
define(['jquery'], function ($) {
    var initializedModules = {};
    return {
        init: function (config) {
            var loadTempl;

            loadTempl = function (identifier, template, wrapper, params, self, cb, isMobile) {
                var callbackInit, moduleFolder, scriptFolder, templateSuffix, cssSuffix, initMethod, moduleJs, loadMethod;

                if (!initializedModules[template]) {
                    templateSuffix = isMobile ? '.mobi.html' : '.html';
                    cssSuffix = isMobile ? '.mobi.css' : '.css';
                    initMethod = isMobile ? 'initMobile' : 'init';
                    moduleFolder = identifier ? 'modules/' + identifier + '/' : '';
                    scriptFolder = moduleFolder ? moduleFolder + 'scripts/' : 'scripts/';
                    var requiredArray = ['../../' + scriptFolder + template, 'text!../../' + moduleFolder + template + templateSuffix];
                    requiredArray.push('css!../../' + moduleFolder + 'css/' + template + cssSuffix);

                    window.require(requiredArray, function (module, html) {
                        if (module === undefined) return;

                        wrapper.html(html);

                        // Create objects or Initicialize objects and store
                        if (module.type === 'Class') {
                            initializedModules[template] = new module(wrapper, self, params, isMobile, cb);
                        } else {
                            module[initMethod].call(module, wrapper, self, params, cb);
                            initializedModules[template] = module;
                        }
                    });
                } else {
                    moduleJs = initializedModules[template];
                    if (typeof moduleJs.load !== 'function') return;

                    loadMethod = isMobile ? 'loadMobile' : 'load';

                    if (moduleJs.type === 'Class') {
                        moduleJs.load(moduleJs, params, isMobile, cb);
                    } else {
                        moduleJs[loadMethod].call(moduleJs, params, cb);
                    }
                }
            };

            return {
                loadTemplate: function (identifier, template, wrapper, params, cb) {
                    var self = this;
                    loadTempl(identifier, template, wrapper, params, self, cb, false);
                },

                loadMobileTemplate: function (identifier, template, wrapper, params, cb) {
                    var self = this;
                    loadTempl(identifier, template, wrapper, params, self, cb, true);
                },

                loadResx: function (cb) {
                    var self = this;

                    self.sf.moduleRoot = 'personaBar';
                    self.sf.controller = 'localization';
                    self.sf.getsilence('gettable', { culture: config.culture }, function (d) {
                        self.resx = d;
                        if (typeof cb === 'function') cb();
                    });
                },

                getResx: function (moduleName, key) {
                    if (this.resx[moduleName] && this.resx[moduleName].hasOwnProperty(key)) {
                        return this.resx[moduleName][key];
                    }

                    return key;
                },

                getModuleNameByParams: function (params) {
                    return params ? (params.moduleName || '') : '';
                },

                getIdentifierByParams: function (params) {
                    return params ? (params.identifier || '') : '';
                },

                asyncParallel: function (deferreds, callback) {
                    var i = deferreds.length;
                    if (i === 0) callback();
                    var call = function () {
                        i--;
                        if (i === 0) {
                            callback();
                        }
                    };

                    $.each(deferreds, function (ii, d) {
                        d(call);
                    });
                },

                asyncWaterfall: function (deferreds, callback) {
                    var call = function () {
                        var deferred = deferreds.shift();
                        if (!deferred) {
                            callback();
                            return;
                        }
                        deferred(call);
                    };
                    call();
                },

                confirm: function (text, confirmBtn, cancelBtn, confirmHandler, cancelHandler) {
                    $('#confirmation-dialog > p').html(text);
                    $('#confirmation-dialog a#confirmbtn').html(confirmBtn).unbind('click').bind('click', function () {
                        if (typeof confirmHandler === 'function') confirmHandler.apply();
                        $('#confirmation-dialog').fadeOut(200, 'linear', function () { $('#mask').hide(); });
                    });
                    $('#confirmation-dialog a#cancelbtn').html(cancelBtn).unbind('click').bind('click', function () {
                        if (typeof cancelHandler === 'function') cancelHandler.apply();
                        $('#confirmation-dialog').fadeOut(200, 'linear', function () { $('#mask').hide(); });
                    });
                    $('#mask').show();
                    $('#confirmation-dialog').fadeIn(200, 'linear');

                    $(window).off('keydown.confirmDialog').on('keydown.confirmDialog', function (evt) {

                        if (evt.keyCode === 27) {
                            $(window).off('keydown.confirmDialog');
                            $('#confirmation-dialog a#cancelbtn').trigger('click');
                        }
                    });
                },

                notify: function (text, timeout) {
                    timeout = timeout || 2000;
                    $('#notification-dialog > p').removeClass().html(text);
                    $('#notification-dialog').fadeIn(200, 'linear', function () {
                        setTimeout(function () {
                            $('#notification-dialog').fadeOut(200, 'linear');
                        }, timeout);
                    });
                },

                notifyError: function (text, timeout) {
                    timeout = timeout || 2000;
                    $('#notification-dialog > p').removeClass().addClass('errorMessage').html(text);
                    $('#notification-dialog').fadeIn(200, 'linear', function () {
                        setTimeout(function () {
                            $('#notification-dialog').fadeOut(200, 'linear');
                        }, timeout);
                    });
                },

                localizeErrMessages: function (validator) {
                    var self = this;
                    validator.errorMessages = {
                        'required': self.resx.PersonaBar.err_Required,
                        'minLength': self.resx.PersonaBar.err_Minimum,
                        'number': self.resx.PersonaBar.err_Number,
                        'nonNegativeNumber': self.resx.PersonaBar.err_NonNegativeNumber,
                        'positiveNumber': self.resx.PersonaBar.err_PositiveNumber,
                        'nonDecimalNumber': self.resx.PersonaBar.err_NonDecimalNumber,
                        'email': self.resx.PersonaBar.err_Email
                    };
                },

                trimContentToFit: function (content, width) {
                    if (!content || !width) return '';
                    var charWidth = 8.5;
                    var max = Math.floor(width / charWidth);

                    var arr = content.split(' ');
                    var trimmed = '', count = 0;
                    $.each(arr, function (i, v) {
                        count += v.length;
                        if (count < max) {
                            if (trimmed) trimmed += ' ';
                            trimmed += v;
                            count++;
                        } else {
                            trimmed += '...';
                            return false;
                        }
                    });
                    return trimmed;
                },

                deserializeCustomDate: function (str) {
                    if (this.moment) {
                        return this.moment(str, 'YYYY-MM-DD').toDate();
                    }
                },

                serializeCustomDate: function (dateObj) {
                    if (this.moment) {
                        return this.moment(dateObj).format('YYYY-MM-DD');
                    }
                },

                getObjectCopy: function (object) {
                    if (typeof object === "object") {
                        return JSON.parse(JSON.stringify(object));
                    } else {
                        throw new Error("The object " + object + " passed in is not an object.");
                    }
                },

                throttleExecution: function (callback) {
                    if (typeof callback === "function") {
                        setTimeout(callback, 0);
                    }
                },

                ONE_THOUSAND: 1000,
                ONE_MILLION: 1000000,

                formatAbbreviateBigNumbers: function (number) {
                    var size = number;
                    var suffix;

                    if (size >= this.ONE_MILLION) {
                        size = size / this.ONE_MILLION;
                        suffix = this.resx.PersonaBar.label_OneMillionSufix;
                    } else if (size >= this.ONE_THOUSAND) {
                        size = size / this.ONE_THOUSAND;
                        suffix = this.resx.PersonaBar.label_OneThousandSufix;
                    } else {
                        return this.formatCommaSeparate(size);
                    }

                    return this.formatCommaSeparate(size.toFixed(1)) + ' ' + suffix;
                },
                getNumbersSeparatorByLocale: function () {
                    var numberWithSeparator = (1000).toLocaleString(config.culture);
                    return numberWithSeparator.indexOf(",") > 0 ? "," : ".";
                },
                formatCommaSeparate: function (number) {
                    var numbersSeparatorByLocale = this.getNumbersSeparatorByLocale();
                    while (/(\d+)(\d{3})/.test(number.toString())) {
                        number = number.toString().replace(/(\d+)(\d{3})/, '$1' + numbersSeparatorByLocale + '$2');
                    }
                    return number;
                },
                secondsFormatter: function (seconds) {
                    var oneHour = 3600;
                    var format = seconds >= oneHour ? "H:mm:ss" : "mm:ss";
                    return moment().startOf('day').add(seconds, 'seconds').format(format);
                },
                getApplicationRootPath: function getApplicationRootPath() {
                    var rootPath = location.protocol + '//' + location.host + (location.port ? (':' + location.port) : '');
                    if (rootPath.substr(rootPath.length - 1, 1) === '/') {
                        rootPath = rootPath.substr(0, rootPath.length - 1);
                    }
                    return rootPath;
                },
                getPanelIdFromPath: function getPanelIdFromPath(path) {
                    return path + '-panel';
                },
                parseQueryParameter: function (item) {
                    item.Query = '';
                    var pathInfo;
                    if (typeof item.Path !== "undefined" && item.Path.indexOf("?") > -1) {
                        pathInfo = item.Path.split('?');
                        item.Path = pathInfo[0];
                        item.Query = pathInfo[1];
                    } else if (typeof item.path !== "undefined" && item.path.indexOf("?") > -1) {
                        pathInfo = item.path.split('?');
                        item.path = pathInfo[0];
                        item.query = pathInfo[1];
                    }
                },

                /**
                * Builds the view model that will be used to
                * create the DOM structure for the Persona Bar menu
                *
                * @method buildMenuViewModel
                * @param {Object} menuStructure the menu structured stored in config object
                * @param {Boolean} isMobile flag that tell you if you are in mobile version of the Persona Bar
                * @return {Object} view model that will be used to build the HTML DOM of the menu 
                */
                buildMenuViewModel: function buildMenuViewModel(menuStructure, isMobile) {

                    var menu = {
                        menuItems: []
                    };

                    var util = this;
                    menuStructure.MenuItems.forEach(function (menuItem) {
                        if (isMobile && !menuItem.MobileSupport) {
                            return;
                        }
                        util.parseQueryParameter(menuItem);
                        var topMenuItem = {
                            id: menuItem.Identifier,
                            resourceKey: menuItem.ResourceKey,
                            moduleName: menuItem.ModuleName,
                            path: menuItem.Path,
                            query: menuItem.Query,
                            link: menuItem.Link,
                            css: menuItem.CssClass,
                            displayName: menuItem.DisplayName,
                            settings: menuItem.Settings,
                            menuItems: []
                        }
                        if (menuItem.Children) {
                            menuItem.Children.forEach(function (menuItem) {
                                if (isMobile && !menuItem.MobileSupport) {
                                    return;
                                }

                                util.parseQueryParameter(menuItem);
                                var subMenuItem = {
                                    id: menuItem.Identifier,
                                    resourceKey: menuItem.ResourceKey,
                                    moduleName: menuItem.ModuleName,
                                    path: menuItem.Path,
                                    query: menuItem.Query,
                                    link: menuItem.Link,
                                    css: menuItem.CssClass,
                                    displayName: menuItem.DisplayName,
                                    settings: menuItem.Settings
                                }
                                topMenuItem.menuItems.push(subMenuItem);
                            });
                        }

                        //parse menu items into columns
                        var firstColumn, secondColumn;
                        if (topMenuItem.menuItems.length === 0) {
                            topMenuItem.menuItems = [];
                        } else if (topMenuItem.menuItems.length < 9) {
                            topMenuItem.menuItems = [topMenuItem.menuItems];
                        } else if (topMenuItem.menuItems.length <= 18) {
                            var count = topMenuItem.menuItems.length / 2;
                            if (topMenuItem.menuItems.length % 2 !== 0) {
                                count++;
                            }
                            firstColumn = topMenuItem.menuItems.splice(0, count);
                            topMenuItem.menuItems = [firstColumn, topMenuItem.menuItems];
                            topMenuItem.css += " two-columns-menu";
                        } else {
                            firstColumn = topMenuItem.menuItems.splice(0, 7);
                            secondColumn = topMenuItem.menuItems.splice(0, 7);
                            topMenuItem.menuItems = [firstColumn, secondColumn, topMenuItem.menuItems];
                            topMenuItem.css += " three-columns-menu";
                        }

                        menu.menuItems.push(topMenuItem);
                    });

                    return {
                        menu: menu
                    };
                },

                /**
                * Gets the path defined by the first menu item with a 
                * given module name
                *
                * @method getPathByModuleName
                * @param {Object} menuStructure the menu structured stored in config object
                * @param {String} moduleName moduleName
                * @return {String} path 
                */
                getPathByModuleName: function getPathByModuleName(menuStructure, moduleName) {
                    var path = null;
                    menuStructure.MenuItems.forEach(function (menuItem) {
                        if (menuItem.ModuleName === moduleName) {
                            path = menuItem.Path;
                            return;
                        }

                        if (menuItem.Children) {
                            menuItem.Children.forEach(function (menuItem) {
                                if (menuItem.ModuleName === moduleName) {
                                    path = menuItem.Path;
                                    return;
                                }
                            });
                        }
                    });
                    return path;
                }
            };
        }
    };
});

define('css', {
    load: function (name, require, load, config) {
        function inject(filename) {
            var head = document.getElementsByTagName('head')[0];
            var link = document.createElement('link');
            link.href = filename;
            link.rel = 'stylesheet';
            link.type = 'text/css';
            head.appendChild(link);
        }

        var path = name;
        for (var i in config.paths) {
            if (path.indexOf(i) === 0) {
                path = path.replace(i, config.paths[i]);
                break;
            }
        }

        if (path.indexOf('://') === -1) {
            path = config.baseUrl + path;
        }

        inject(path + '?' + config.urlArgs);
        load(true);
    },
    pluginBuilder: './css-build'
});;
