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
* Module responsible to manage the Recycle Bin
*/
define(['jquery',
    'knockout',
    'knockout.mapping',
    './RecycleBin.ViewModel',
	'dnn.jquery',
	'dnn.extensions',
	'dnn.jquery.extensions',
	'jquery.tokeninput',
	'dnn.jScrollBar',
    'jquery-ui.min'],
    function ($, ko, koMapping, DnnPageRecycleBin) {
        'use strict';

        var dnnPageRecycleBin;

        var init, load,
            initRecycleBin, viewRecycleBin;

        var utility = null;

        ko.mapping = koMapping;

        init = function (wrapper, util, params, callback) {
            utility = util;

            dnnPageRecycleBin = new DnnPageRecycleBin(utility.resx.Recyclebin, utility.sf, utility);

            initRecycleBin(wrapper);

            if (typeof callback === 'function') {
                callback();
            }
        };

        load = function (params, callback) {
            viewRecycleBin();

            if (dnn && dnn.dnnPageHierarchy) {
                dnn.dnnPageHierarchy.load();
            }
        };

        initRecycleBin = function (wrapper) {
            dnnPageRecycleBin.init(wrapper);
            viewRecycleBin();
        };

        viewRecycleBin = function () {
            if (typeof dnn.dnnPageHierarchy != "undefined" && dnn.dnnPageHierarchy.hasPendingChanges()) {
                return dnn.dnnPageHierarchy.handlePendingChanges();
            }
            dnnPageRecycleBin.show();
        };

        return {
            init: init,
            load: load
        };
    });
