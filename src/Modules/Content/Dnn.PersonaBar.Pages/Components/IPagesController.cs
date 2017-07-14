﻿using System.Collections.Generic;
using Dnn.PersonaBar.Pages.Components.Dto;
using Dnn.PersonaBar.Pages.Services.Dto;
using DotNetNuke.Entities.Modules;
using DotNetNuke.Entities.Tabs;

namespace Dnn.PersonaBar.Pages.Components
{
    public interface IPagesController
    {
        bool IsValidTabPath(TabInfo tab, string newTabPath, string newTabName, out string errorMessage);

        IEnumerable<TabInfo> GetPageList(int parentId = -1, string searchKey = "", string pageType = "", bool isPublished = true, 
            string tags = "", string publishedOnStartDate = "", string publishedOnEndDate = "", int workflowId = -1, int pageIndex = -1, int pageSize = -1);

        List<int> GetPageHierarchy(int pageId);

        TabInfo MovePage(PageMoveRequest request);

        void DeletePage(PageItem page);

        void EditModeForPage(int pageId, int userId);

        TabInfo SavePageDetails(PageSettings pageSettings);

        IEnumerable<ModuleInfo> GetModules(int pageId);

        PageSettings GetDefaultSettings();

        void DeleteTabModule(int pageId, int moduleId);

        /// <summary>
        /// Returns a clean tab relative url based on Advanced Management Url settings
        /// </summary>
        /// <param name="url">Url not cleaned, this could containes blank space or invalid characters</param>
        /// <returns>Cleaned Url</returns>
        string CleanTabUrl(string url);

        /// <summary>
        /// Copy the given theme to all descendant pages
        /// </summary>
        /// <param name="pageId">page identifier</param>
        /// <param name="theme">Theme</param>
        void CopyThemeToDescendantPages(int pageId, Theme theme);

        /// <summary>
        /// Copy the current page permissions to all descendant pages
        /// </summary>
        /// <param name="pageId">page identifier</param>
        void CopyPermissionsToDescendantPages(int pageId);

        IEnumerable<Url> GetPageUrls(int tabId);
        PageSettings GetPageSettings(int pageId);
        PageUrlResult CreateCustomUrl(SeoUrl dto);
        PageUrlResult UpdateCustomUrl(SeoUrl dto);
        PageUrlResult DeleteCustomUrl(UrlIdDto dto);

        PagePermissions GetPermissionsData(int pageId);
    }
}