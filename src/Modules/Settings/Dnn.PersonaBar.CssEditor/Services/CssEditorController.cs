﻿#region Copyright

// DotNetNuke® - http://www.dotnetnuke.com
// Copyright (c) 2002-2017
// by DotNetNuke Corporation
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated 
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation 
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and 
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in all copies or substantial portions 
// of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED 
// TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL 
// THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF 
// CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
// DEALINGS IN THE SOFTWARE.

#endregion

using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;
using Dnn.PersonaBar.CssEditor.Services.Dto;
using Dnn.PersonaBar.Library;
using Dnn.PersonaBar.Library.Attributes;
using DotNetNuke.Common;
using DotNetNuke.Entities.Controllers;
using DotNetNuke.Entities.Portals;
using DotNetNuke.Instrumentation;
using DotNetNuke.Services.Exceptions;
using DotNetNuke.Services.Localization;
using DotNetNuke.Web.Api;
using DotNetNuke.Web.Client;

namespace Dnn.PersonaBar.CssEditor.Services
{
    [MenuPermission(Scope = ServiceScope.Admin)]
    public class CssEditorController : PersonaBarApiController
    {
        private static readonly ILog Logger = LoggerSource.Instance.GetLogger(typeof(CssEditorController));

        /// GET: api/CssEditor/GetStyleSheet
        /// <summary>
        /// Gets portal.css of specific portal
        /// </summary>
        /// <param name="portalId">Id of portal</param>
        /// <returns>Content of portal.css</returns>
        [HttpGet]
        public HttpResponseMessage GetStyleSheet(int portalId)
        {
            try
            {
                if (!PortalSettings.Current.UserInfo.IsSuperUser && PortalSettings.Current.UserInfo.PortalID != portalId)
                {
                    throw new SecurityException("No Permission");
                }
                else
                {
                    var activeLanguage = LocaleController.Instance.GetDefaultLocale(portalId).Code;
                    var portal = PortalController.Instance.GetPortal(portalId, activeLanguage);

                    string uploadDirectory = "";
                    string styleSheetContent = "";
                    if (portal != null)
                    {
                        uploadDirectory = portal.HomeDirectoryMapPath;
                    }

                    //read CSS file
                    if (File.Exists(uploadDirectory + "portal.css"))
                    {
                        using (var text = File.OpenText(uploadDirectory + "portal.css"))
                        {
                            styleSheetContent = text.ReadToEnd();
                        }
                    }

                    return Request.CreateResponse(HttpStatusCode.OK, new { Content = styleSheetContent });
                }
            }
            catch (Exception exc)
            {
                Logger.Error(exc);
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, exc);
            }
        }

        /// POST: api/CssEditor/UpdateStyleSheet
        /// <summary>
        /// Updates portal.css of specific portal
        /// </summary>
        /// <param name="request">Content of portal css</param>
        /// <returns></returns>
        [HttpPost]
        [ValidateAntiForgeryToken]
        public HttpResponseMessage UpdateStyleSheet(UpdateCssRequest request)
        {
            if (!PortalSettings.Current.UserInfo.IsSuperUser && PortalSettings.Current.UserInfo.PortalID != request.PortalId)
            {
                throw new SecurityException("No Permission");
            }
            else
            {
                try
                {
                    string strUploadDirectory = "";

                    PortalInfo objPortal = PortalController.Instance.GetPortal(request.PortalId);
                    if (objPortal != null)
                    {
                        strUploadDirectory = objPortal.HomeDirectoryMapPath;
                    }

                    //reset attributes
                    if (File.Exists(strUploadDirectory + "portal.css"))
                    {
                        File.SetAttributes(strUploadDirectory + "portal.css", FileAttributes.Normal);
                    }

                    //write CSS file
                    using (var writer = File.CreateText(strUploadDirectory + "portal.css"))
                    {
                        writer.WriteLine(HttpUtility.UrlDecode(request.StyleSheetContent));
                    }

                    //Clear client resource cache
                    var overrideSetting =
                        PortalController.GetPortalSetting(ClientResourceSettings.OverrideDefaultSettingsKey,
                            request.PortalId, "False");
                    bool overridePortal;
                    if (bool.TryParse(overrideSetting, out overridePortal))
                    {
                        if (overridePortal)
                        {
                            // increment this portal version only
                            PortalController.IncrementCrmVersion(request.PortalId);
                        }
                        else
                        {
                            // increment host version, do not increment other portal versions though.
                            HostController.Instance.IncrementCrmVersion(false);
                        }
                    }

                    return Request.CreateResponse(HttpStatusCode.OK, new {Success = true});
                }
                catch (Exception exc)
                {
                    Logger.Error(exc);
                    return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, exc);
                }
            }
        }

        /// POST: api/CssEditor/RestoreStyleSheet
        /// <summary>
        /// Restores portal.css of specific portal
        /// </summary>
        /// <param name="request">Id of portal</param>
        /// <returns>Content of portal.css</returns>
        [HttpPost]
        [ValidateAntiForgeryToken]
        public HttpResponseMessage RestoreStyleSheet(RestoreCssRequest request)
        {
            if (!PortalSettings.Current.UserInfo.IsSuperUser &&
                PortalSettings.Current.UserInfo.PortalID != request.PortalId)
            {
                throw new SecurityException("No Permission");
            }
            else
            {
                try
                {
                    PortalInfo portal = PortalController.Instance.GetPortal(request.PortalId);
                    if (portal != null)
                    {
                        if (File.Exists(portal.HomeDirectoryMapPath + "portal.css"))
                        {
                            //delete existing style sheet
                            File.Delete(portal.HomeDirectoryMapPath + "portal.css");
                        }

                        //copy file from Host
                        if (File.Exists(Globals.HostMapPath + "portal.css"))
                        {
                            File.Copy(Globals.HostMapPath + "portal.css", portal.HomeDirectoryMapPath + "portal.css");
                        }
                    }
                    var content = LoadStyleSheet(request.PortalId);

                    return Request.CreateResponse(HttpStatusCode.OK, new {Success = true, StyleSheetContent = content});
                }
                catch (Exception exc)
                {
                    Logger.Error(exc);
                    return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, exc);
                }
            }
        }

        #region Private Methods

        private string LoadStyleSheet(int portalId)
        {
            var activeLanguage = LocaleController.Instance.GetDefaultLocale(portalId).Code;
            var portal = PortalController.Instance.GetPortal(portalId, activeLanguage);

            string uploadDirectory = "";
            string styleSheetContent = "";
            if (portal != null)
            {
                uploadDirectory = portal.HomeDirectoryMapPath;
            }

            //read CSS file
            if (File.Exists(uploadDirectory + "portal.css"))
            {
                using (var text = File.OpenText(uploadDirectory + "portal.css"))
                {
                    styleSheetContent = text.ReadToEnd();
                }
            }

            return styleSheetContent;
        }

        #endregion
    }
}
