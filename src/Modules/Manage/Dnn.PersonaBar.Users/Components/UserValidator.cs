using Dnn.PersonaBar.Library.Helper;
using Dnn.PersonaBar.Library.Prompt.Models;
using DotNetNuke.Entities.Portals;
using DotNetNuke.Entities.Users;
using DotNetNuke.Services.Localization;
using System.Collections.Generic;
using System.Net;

namespace Dnn.PersonaBar.Users.Components
{
    public class UserValidator : IUserValidator
    {
        private IPortalController _portalController;
        private IUserControllerWrapper _userControllerWrapper;
        private IContentVerifier _contentVerifier;
        private int _userPortalId;

        public UserValidator() : this(PortalController.Instance, new UserControllerWrapper(), new ContentVerifier())
        {
        }

        public UserValidator(IPortalController portalController, IUserControllerWrapper userControllerWrapper, IContentVerifier contentVerifier)
        {
            this._portalController = portalController;
            this._userControllerWrapper = userControllerWrapper;
            this._contentVerifier = contentVerifier;
        }

        public int GetValidPortalId()
        {
            return _userPortalId;
        }

        public ConsoleErrorResultModel ValidateUser(int? userId, PortalSettings portalSettings, UserInfo currentUserInfo, out UserInfo userInfo)
        {
            userInfo = null;

            if (!userId.HasValue)
            {
                return new ConsoleErrorResultModel(Localization.GetString("Prompt_NoUserId", Constants.LocalResourcesFile));
            }

            _userPortalId = portalSettings.PortalId;

            KeyValuePair<HttpStatusCode, string> response;
            userInfo = _userControllerWrapper.GetUser(userId.Value, portalSettings, currentUserInfo, out response);

            if (userInfo == null)
            {
                var portals = _portalController.GetPortals();

                foreach (var portal in portals)
                {
                    var portalInfo = portal as PortalInfo;
                    userInfo = _userControllerWrapper.GetUserById(portalInfo.PortalID, userId.Value);

                    if (userInfo != null)
                    {
                        _userPortalId = portalInfo.PortalID;
                        break;
                    }
                }

                if (userInfo != null &&
                    !_contentVerifier.IsContentExistsForRequestedPortal(
                        userInfo.PortalID,
                        portalSettings,
                        true
                        )
                   )
                {
                    userInfo = null;
                }
            }

            return userInfo == null ? new ConsoleErrorResultModel(response.Value) : null;
        }
    }
}