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
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using Dnn.PersonaBar.Library;
using Dnn.PersonaBar.Recyclebin.Components.Dto;
using DotNetNuke.Common.Utilities;
using DotNetNuke.Entities.Modules;
using DotNetNuke.Entities.Portals;
using DotNetNuke.Entities.Tabs;
using DotNetNuke.Entities.Tabs.TabVersions;
using DotNetNuke.Entities.Users;
using DotNetNuke.Framework;
using DotNetNuke.Instrumentation;
using DotNetNuke.Security.Permissions;
using DotNetNuke.Services.Localization;

namespace Dnn.PersonaBar.Recyclebin.Components
{
    public class RecyclebinController : ServiceLocator<IRecyclebinController, RecyclebinController>,
        IRecyclebinController
    {
        public static string PageDateTimeFormat = "yyyy-MM-dd hh:mm tt";
        private static readonly ILog Logger = LoggerSource.Instance.GetLogger(typeof (RecyclebinController));

        #region Fields

        private readonly ITabController _tabController;
        private readonly ITabVersionSettings _tabVersionSettings;
        private readonly ITabChangeSettings _tabChangeSettings;
        private readonly ITabWorkflowSettings _tabWorkflowSettings;
        private readonly IModuleController _moduleController;

        #endregion

        public RecyclebinController()
        {
            _tabController = TabController.Instance;
            _tabVersionSettings = TabVersionSettings.Instance;
            _tabWorkflowSettings = TabWorkflowSettings.Instance;
            _moduleController = ModuleController.Instance;
            _tabChangeSettings = TabChangeSettings.Instance;
        }

        #region Properties

        private static string LocalResourcesFile => 
            Path.Combine(Constants.PersonaBarRelativePath, "Modules/Dnn.Recyclebin/App_LocalResources/Recyclebin.resx");

        private static PortalSettings PortalSettings => PortalSettings.Current;
        
        #endregion

        #region ServiceLocator

        protected override Func<IRecyclebinController> GetFactory()
        {
            return () => new RecyclebinController();
        }

        #endregion

        #region Public Methods

        public string LocalizeString(string key)
        {
            return Localization.GetString(key, LocalResourcesFile);
        }

        public void DeleteTabs(IEnumerable<PageItem> tabs, StringBuilder errors, bool deleteDescendants = false)
        {
            if (tabs == null || !tabs.Any())
            {
                return;
            }

            foreach (
                var tab in
                    tabs.OrderByDescending(t => t.Level)
                        .Select(page => _tabController.GetTab(page.Id, PortalSettings.PortalId)))
            {
                if (tab == null)
                {
                    continue;
                }

                if (TabPermissionController.CanDeletePage(tab) && tab.IsDeleted)
                {
                    if (tab.HasChildren)
                    {
                        errors.Append(string.Format(LocalizeString("Service_RemoveTabError"), tab.TabName));
                    }
                    else
                    {
                        HardDeleteTab(tab, deleteDescendants);
                    }
                }
            }

        }

        public void DeleteTabs(IEnumerable<TabInfo> tabs, StringBuilder errors, bool deleteDescendants = false)
        {
            if (tabs == null || !tabs.Any())
            {
                return;
            }

            foreach (
                var tab in
                    tabs.OrderByDescending(t => t.Level)
                        .Select(page => _tabController.GetTab(page.TabID, PortalSettings.PortalId)))
            {
                if (tab == null)
                {
                    continue;
                }

                if (TabPermissionController.CanDeletePage(tab) && tab.IsDeleted)
                {
                    if (tab.HasChildren)
                    {
                        errors.Append(string.Format(LocalizeString("Service_RemoveTabError"), tab.TabName));
                    }
                    else
                    {
                        HardDeleteTab(tab, deleteDescendants);
                    }
                }
            }
        }

        public void DeleteModules(IEnumerable<ModuleItem> modules, StringBuilder errors)
        {
            if (modules != null && modules.Any())
            {
                foreach (
                    var module in modules.Select(mod => ModuleController.Instance.GetModule(mod.Id, mod.TabID, true)))
                {
                    if (module == null)
                    {
                        continue;
                    }
                    if (ModulePermissionController.CanDeleteModule(module) && module.IsDeleted)
                    {
                        HardDeleteModule(module);
                    }
                }
            }
        }

        public void DeleteModules(IEnumerable<ModuleInfo> modules, StringBuilder errors)
        {
            if (modules != null && modules.Any())
            {
                foreach (
                    var module in
                        modules.Select(mod => ModuleController.Instance.GetModule(mod.ModuleID, mod.TabID, true)))
                {
                    if (module == null)
                    {
                        continue;
                    }
                    if (ModulePermissionController.CanDeleteModule(module) && module.IsDeleted)
                    {
                        HardDeleteModule(module);
                    }
                }
            }
        }

        private void HardDeleteTab(TabInfo tab, bool deleteDescendants)
        {
            //get tab modules before deleting page
            var tabModules = _moduleController.GetTabModules(tab.TabID);

            //hard delete the tab
            _tabController.DeleteTab(tab.TabID, tab.PortalID, deleteDescendants);

            //delete modules that do not have other instances
            foreach (var kvp in tabModules)
            {
                //check if all modules instances have been deleted
                var delModule = _moduleController.GetModule(kvp.Value.ModuleID, Null.NullInteger, false);
                if (delModule == null || delModule.TabID == Null.NullInteger)
                {
                    try
                    {
                        _moduleController.DeleteModule(kvp.Value.ModuleID);
                    }
                    catch (Exception exc)
                    {
                        Logger.Error(exc);
                    }
                }
            }
        }

        private void HardDeleteModule(ModuleInfo module)
        {
            try
            {
                _moduleController.DeleteTabModule(module.TabID, module.ModuleID, false);
            }
            catch (Exception exc)
            {
                Logger.Error(exc);
            }
            //hard-delete Tab Module Instance
        }

        public bool RestoreTab(TabInfo tab, out string resultmessage)
        {
            var changeControlStateForTab = _tabChangeSettings.GetChangeControlState(tab.PortalID, tab.TabID);
            if (changeControlStateForTab.IsChangeControlEnabledForTab)
            {
                _tabVersionSettings.SetEnabledVersioningForTab(tab.TabID, false);
                _tabWorkflowSettings.SetWorkflowEnabled(tab.PortalID, tab.TabID, false);
            }

            var success = true;
            resultmessage = null;

            //if parent of the page is deleted, then can't restore - parent should be restored first
            var deletedTabs = GetDeletedTabs();
            if (!Null.IsNull(tab.ParentId) && deletedTabs.Any(t => t.TabID == tab.ParentId))
            {
                resultmessage = string.Format(LocalizeString("Service_RestoreTabError"), tab.TabName);
                success = false;
            }
            else
            {
                _tabController.RestoreTab(tab, PortalSettings);

                //restore modules in this tab
                var tabdeletedModules = GetDeletedModules().Where(m => m.TabID == tab.TabID);

                foreach (var m in tabdeletedModules)
                {
                    success = RestoreModule(m.ModuleID, m.TabID, out resultmessage);
                }

                if (changeControlStateForTab.IsChangeControlEnabledForTab)
                {
                    _tabVersionSettings.SetEnabledVersioningForTab(tab.TabID,
                        changeControlStateForTab.IsVersioningEnabledForTab);
                    _tabWorkflowSettings.SetWorkflowEnabled(tab.PortalID, tab.TabID,
                        changeControlStateForTab.IsWorkflowEnabledForTab);
                }
            }
            return success;
        }

        public bool RestoreModule(int moduleId, int tabId, out string errorMessage)
        {
            errorMessage = null;
            // restore module
            var module = _moduleController.GetModule(moduleId, tabId, false);
            if ((module != null))
            {
                var deletedTabs = GetDeletedTabs().Where(t => t.TabID == module.TabID);
                if (deletedTabs.Any())
                {
                    var title = !string.IsNullOrEmpty(module.ModuleTitle)
                        ? module.ModuleTitle
                        : module.DesktopModule.FriendlyName;
                    errorMessage = string.Format(LocalizeString("Service_RestoreModuleError"), title,
                        deletedTabs.SingleOrDefault().TabName);
                    return false;
                }
                _moduleController.RestoreModule(module);

                TrackRestoreModuleAction(module);
            }
            return true;
        }

        private void TrackRestoreModuleAction(ModuleInfo module)
        {
            var currentUser = UserController.Instance.GetCurrentUserInfo();
            var currentModuleVersion = TabVersionBuilder.Instance.GetModuleContentLatestVersion(module);
            TabChangeTracker.Instance.TrackModuleAddition(module, currentModuleVersion, currentUser.UserID);
        }

        public List<TabInfo> GetDeletedTabs()
        {
            var adminTabId = PortalSettings.AdminTabId;
            var tabs = TabController.GetPortalTabs(PortalSettings.PortalId, adminTabId, true, true, true, true);
            var deletedtabs =
                tabs.Where(t => t.ParentId != adminTabId && t.IsDeleted && TabPermissionController.CanDeletePage(t))
                    .ToList();
            return deletedtabs;
        }

        public List<ModuleInfo> GetDeletedModules()
        {
            var deletedModules = _moduleController.GetModules(PortalSettings.PortalId)
                .Cast<ModuleInfo>()
                .Where(module => module.IsDeleted && (
                    TabPermissionController.CanAddContentToPage(TabController.Instance.GetTab(module.TabID, module.PortalID)) || 
                    ModulePermissionController.CanDeleteModule(module))
                )
                .ToList();
            return deletedModules;
        }

        public string GetTabStatus(TabInfo tab)
        {
            if (tab.DisableLink)
            {
                return "Disabled";
            }

            return tab.IsVisible ? "Visible" : "Hidden";
        }

        public List<UserInfo> GetDeletedUsers()
        {
            var deletedusers = UserController.GetDeletedUsers(PortalSettings.PortalId).Cast<UserInfo>().ToList();
            return deletedusers;
        }

        public void DeleteUsers(IEnumerable<UserInfo> users)
        {
            var userInfos = users as IList<UserInfo> ?? users.ToList();
            if (users == null || !userInfos.Any()) return;
            foreach (var user in userInfos.Select(u => UserController.GetUserById(u.PortalID, u.UserID)).Where(user => user != null).Where(user => user.IsDeleted))
            {
                UserController.RemoveUser(user);
            }
        }

        public void DeleteUsers(IEnumerable<UserItem> users)
        {
            var userInfos = users as IList<UserItem> ?? users.ToList();
            if (users == null || !userInfos.Any()) return;
            foreach (var user in userInfos.Select(u => UserController.GetUserById(u.PortalId, u.Id)).Where(user => user != null).Where(user => user.IsDeleted))
            {
                UserController.RemoveUser(user);
            }
        }

        public bool RestoreUser(UserInfo user, out string errorMessage)
        {
            errorMessage = null;
            var deletedusers = UserController.GetDeletedUsers(PortalSettings.PortalId).Cast<UserInfo>().ToList();
            if ((user != null) && deletedusers.Any(u => u.UserID == user.UserID))
            {
                UserController.RestoreUser(ref user);
                return true;
            }
            else
            {
                errorMessage = string.Format(LocalizeString("Service_RestoreUserError"));
                return false;
            }
        }

        #endregion
    }
}