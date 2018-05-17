using System.Collections.Generic;
using System.Net;
using Dnn.PersonaBar.Library.Prompt.Models;
using DotNetNuke.Entities.Portals;
using DotNetNuke.Entities.Users;
using DotNetNuke.Services.Localization;
using Dnn.PersonaBar.Library.Helper;

namespace Dnn.PersonaBar.Users.Components.Prompt
{
    public class Utilities
    {
        public static ConsoleErrorResultModel ValidateUser(int? userId, PortalSettings portalSettings, UserInfo currentUserInfo, out UserInfo userInfo)
        {
            userInfo = null;
            if (!userId.HasValue) return new ConsoleErrorResultModel(Localization.GetString("Prompt_NoUserId", Constants.LocalResourcesFile));

            KeyValuePair<HttpStatusCode, string> response;
            userInfo = UsersController.GetUser(userId.Value, portalSettings, currentUserInfo, out response);

            if (userInfo == null)
            {
                var portals = PortalController.Instance.GetPortals();

                foreach (var portal in portals)
                {
                    var portalInfo = portal as PortalInfo;
                    userInfo = UserController.GetUserById(portalInfo.PortalID, userId.Value);

                    if (userInfo != null) break;
                }

                if (userInfo != null &&
                    !new ContentVerifier().IsContentExistsForRequestedPortal(
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


