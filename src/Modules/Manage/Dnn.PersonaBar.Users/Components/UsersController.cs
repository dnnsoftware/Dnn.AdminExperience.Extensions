﻿#region Copyright
// 
// DotNetNuke® - http://www.dotnetnuke.com
// Copyright (c) 2002-2016
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

#region Usings



#endregion

using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Web.Security;
using Dnn.PersonaBar.Users.Components.Comparers;
using Dnn.PersonaBar.Users.Components.Contracts;
using Dnn.PersonaBar.Users.Components.Dto;
using Dnn.PersonaBar.Users.Data;
using DotNetNuke.Common.Utilities;
using DotNetNuke.Data;
using DotNetNuke.Entities.Users;
using DotNetNuke.Entities.Users.Membership;
using DotNetNuke.Framework;
using DotNetNuke.Instrumentation;
using DotNetNuke.Security.Membership;
using DotNetNuke.Services.Installer.Log;
using DotNetNuke.Services.Search.Controllers;
using DotNetNuke.Services.Search.Entities;
using DotNetNuke.Services.Search.Internals;
using DotNetNuke.UI.UserControls;
using DotNetNuke.Services.Localization;
using DotNetNuke.Common;
using DotNetNuke.Entities.Portals;
using DotNetNuke.Security.Roles;
using MembershipProvider = DotNetNuke.Security.Membership.MembershipProvider;

namespace Dnn.PersonaBar.Users.Components
{
    public class UsersController : ServiceLocator<IUsersController, UsersController>, IUsersController
    {
        private static readonly ILog Logger = LoggerSource.Instance.GetLogger(typeof(Services.UsersController));
        private const int SearchPageSize = 500;

        private string LocalResourcesFile => Path.Combine("~/admin/Dnn.PersonaBar/Modules/Users/App_LocalResources/Users.resx");

        private PortalSettings PortalSettings => PortalController.Instance.GetCurrentPortalSettings();

        protected override Func<IUsersController> GetFactory()
        {
            return () => new UsersController();
        }

        #region Public Methods

        public IEnumerable<UserBasicDto> GetUsers(GetUsersContract usersContract, bool isSuperUser, out int totalRecords)
        {
            return !string.IsNullOrEmpty(usersContract.SearchText) && usersContract.Filter == UserFilters.All
                ? GetUsersFromLucene(usersContract, out totalRecords)
                : GetUsersFromDb(usersContract, isSuperUser, out totalRecords);
        }

        public IEnumerable<KeyValuePair<string, int>> GetUserFilters(bool isSuperUser= false)
        {
            var userFilters = new List<KeyValuePair<string, int>>();
            for (var i = 0; i < 5; i++)
            {
                userFilters.Add(
                    new KeyValuePair<string, int>(
                        Localization.GetString(Convert.ToString((UserFilters) i), LocalResourcesFile), i));
            }
            if (!isSuperUser)
            {
                userFilters.Remove(userFilters.FirstOrDefault(x => x.Value == Convert.ToInt32(UserFilters.SuperUsers)));
            }
            userFilters.Remove(userFilters.FirstOrDefault(x => x.Value == Convert.ToInt32(UserFilters.RegisteredUsers)));//Temporarily removed registered users.
            return userFilters;
        }

        public UserDetailDto GetUserDetail(int portalId, int userId)
        {
            var user = UserController.Instance.GetUserById(portalId, userId);
            if (user == null)
            {
                return null;
            }
            user.PortalID = portalId;
            return new UserDetailDto(user);
        }

        public bool ChangePassword(int portalId, int userId, string newPassword, out string errorMessage)
        {
            if (MembershipProviderConfig.RequiresQuestionAndAnswer)
            {
                errorMessage = Localization.GetString("CannotChangePassword", LocalResourcesFile);
                return false;
            }

            errorMessage = string.Empty;
            var user = UserController.Instance.GetUserById(portalId, userId);
            if (user == null)
            {
                return false;
            }

            var membershipPasswordController = new MembershipPasswordController();
            var settings = new MembershipPasswordSettings(user.PortalID);

            if (settings.EnableBannedList)
            {
                if (membershipPasswordController.FoundBannedPassword(newPassword) || user.Username == newPassword)
                {
                    errorMessage = Localization.GetString("PasswordResetFailed", LocalResourcesFile);
                    return false;
                }

            }

            //check new password is not in history
            if (membershipPasswordController.IsPasswordInHistory(user.UserID, user.PortalID, newPassword, false))
            {
                errorMessage = Localization.GetString("PasswordResetFailed_PasswordInHistory", LocalResourcesFile);
                return false;
            }

            try
            {
                var passwordChanged = UserController.ResetAndChangePassword(user, newPassword);
                if (!passwordChanged)
                {
                    errorMessage = Localization.GetString("PasswordResetFailed", LocalResourcesFile);
                }

                return passwordChanged;
            }
            catch (MembershipPasswordException exc)
            {
                //Password Answer missing
                Logger.Error(exc);
                errorMessage = Localization.GetString("PasswordInvalid", LocalResourcesFile);
                return false;
            }
            catch (ThreadAbortException)
            {
                return true;
            }
            catch (Exception exc)
            {
                //Fail
                Logger.Error(exc);
                errorMessage = Localization.GetString("PasswordResetFailed", LocalResourcesFile);
                return false;
            }
        }

        public UserBasicDto UpdateUserBasicInfo(UserBasicDto userBasicDto)
        {
            var user = UserController.Instance.GetUser(PortalSettings.PortalId, userBasicDto.UserId);
            int portalId = PortalSettings.PortalId;
            if (user == null)
            {
                throw new ArgumentException("UserNotExist");
            }

            if (userBasicDto.UserId == PortalSettings.AdministratorId)
            {
                //Clear the Portal Cache
                DataCache.ClearPortalCache(portalId, true);
            }
            user.DisplayName = userBasicDto.Displayname;
            user.Email = userBasicDto.Email;

            //Update DisplayName to conform to Format
            if (!string.IsNullOrEmpty(PortalSettings.Registration.DisplayNameFormat))
            {
                user.UpdateDisplayName(PortalSettings.Registration.DisplayNameFormat);
            }
            //either update the username or update the user details

            if (CanUpdateUsername(user) && !PortalSettings.Registration.UseEmailAsUserName)
            {
                UserController.ChangeUsername(user.UserID, userBasicDto.Username);
                user.Username = userBasicDto.Username;
            }

            //DNN-5874 Check if unique display name is required
            if (PortalSettings.Registration.RequireUniqueDisplayName)
            {
                var usersWithSameDisplayName = (List<UserInfo>)MembershipProvider.Instance().GetUsersBasicSearch(portalId, 0, 2, "DisplayName", true, "DisplayName", user.DisplayName);
                if (usersWithSameDisplayName.Any(u => u.UserID != user.UserID))
                {
                    throw new ArgumentException("DisplayNameNotUnique");
                }
            }

            UserController.UpdateUser(portalId, user);

            if (PortalSettings.Registration.UseEmailAsUserName && (user.Username.ToLowerInvariant() != user.Email.ToLowerInvariant()))
            {
                UserController.ChangeUsername(user.UserID, user.Email);
            }
            return
                UserBasicDto.FromUserInfo(UserController.Instance.GetUser(PortalSettings.PortalId, userBasicDto.UserId));
        }

        #endregion

        #region Private Methods

        private static IEnumerable<UserBasicDto> GetUsersFromDb(GetUsersContract usersContract, bool isSuperUser, out int totalRecords)
        {
            totalRecords = 0;
            var users = new List<UserBasicDto>();
            ArrayList dbUsers = null;
            IEnumerable<UserInfo> userInfos = null;
            switch (usersContract.Filter)
            {
                case UserFilters.All:
                    dbUsers = UserController.GetUsers(usersContract.PortalId, usersContract.PageIndex,
                        usersContract.PageSize, ref totalRecords, true,
                        false);
                    users = dbUsers?.OfType<UserInfo>().Select(UserBasicDto.FromUserInfo).ToList();
                    break;
                case UserFilters.SuperUsers:
                    if (isSuperUser)
                    {
                        dbUsers = UserController.GetUsers(Null.NullInteger, usersContract.PageIndex,
                            usersContract.PageSize, ref totalRecords, true, true);
                        users = dbUsers?.OfType<UserInfo>().Select(UserBasicDto.FromUserInfo).ToList();
                    }
                    break;
                case UserFilters.UnAuthorized:
                    dbUsers = UserController.GetUnAuthorizedUsers(usersContract.PortalId, true, false);
                    userInfos = dbUsers?.OfType<UserInfo>().ToList();
                    if (!isSuperUser)
                    {
                        userInfos = userInfos?.Where(x => !x.IsSuperUser);
                    }
                    users = userInfos?.Select(UserBasicDto.FromUserInfo).ToList();
                    break;
                case UserFilters.Deleted:
                    dbUsers = UserController.GetDeletedUsers(usersContract.PortalId);
                    userInfos = dbUsers?.OfType<UserInfo>().ToList();
                    if (!isSuperUser)
                    {
                        userInfos = userInfos?.Where(x => !x.IsSuperUser);
                    }
                    users = userInfos?.Select(UserBasicDto.FromUserInfo).ToList();
                    break;
//                    case UserFilters.Online:
//                        dbUsers = UserController.GetOnlineUsers(usersContract.PortalId);
//                        break;
                case UserFilters.RegisteredUsers:
                    userInfos = RoleController.Instance.GetUsersByRole(usersContract.PortalId,
                        PortalController.Instance.GetCurrentPortalSettings().RegisteredRoleName);
                    if (!isSuperUser)
                    {
                        userInfos = userInfos?.Where(x => !x.IsSuperUser);
                    }
                    users = userInfos?.Select(UserBasicDto.FromUserInfo).ToList();
                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            }
            return users;
        }

        private static IList<UserBasicDto> GetUsersFromLucene(GetUsersContract usersContract, out int totalRecords)
        {
            var query = new SearchQuery
            {
                KeyWords = usersContract.SearchText, PortalIds = new List<int> {usersContract.PortalId}, PageIndex = 1, SearchTypeIds = new List<int> {SearchHelper.Instance.GetSearchTypeByName("user").SearchTypeId}, PageSize = SearchPageSize, WildCardSearch = true, CultureCode = null, NumericKeys = new Dictionary<string, int> {{"superuser", 0}}
            };

            var searchResults = SearchController.Instance.SiteSearch(query);
            var userIds = searchResults.Results.Distinct(new UserSearchResultComparer()).Take(SearchPageSize).Select(r =>
            {
                int userId;
                TryConvertToInt32(r.UniqueKey.Split('_')[0], out userId);
                return userId;
            }).Where(u => u > 0).ToList();
            totalRecords = userIds.Count;

            var currentIds = string.Join(",", userIds.Skip(usersContract.PageIndex*usersContract.PageSize).Take(usersContract.PageSize));
            return UsersDataService.Instance.GetUsersByUserIds(usersContract.PortalId, currentIds);
        }

        private static bool TryConvertToInt32(string paramValue, out int intValue)
        {
            if (!string.IsNullOrEmpty(paramValue) && Int32.TryParse(paramValue, out intValue))
            {
                return true;
            }

            intValue = Null.NullInteger;
            return false;
        }

    private bool CanUpdateUsername(UserInfo user)
    {
        //can only update username if a host/admin and account being managed is not a superuser
        if (UserController.Instance.GetCurrentUserInfo().IsSuperUser)
        {
            //only allow updates for non-superuser accounts
            if (user.IsSuperUser == false)
            {
                return true;
            }
        }

        //if an admin, check if the user is only within this portal
        if (UserController.Instance.GetCurrentUserInfo().IsInRole(PortalSettings.AdministratorRoleName))
        {
            //only allow updates for non-superuser accounts
            if (user.IsSuperUser)
            {
                return false;
            }
            if (PortalController.GetPortalsByUser(user.UserID).Count == 1) return true;
        }

        return false;
    }


    #endregion
}
}