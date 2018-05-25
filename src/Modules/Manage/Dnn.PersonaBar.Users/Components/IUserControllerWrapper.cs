using System.Collections.Generic;
using System.Net;
using DotNetNuke.Entities.Portals;
using DotNetNuke.Entities.Users;

namespace Dnn.PersonaBar.Users.Components
{
    public interface IUserControllerWrapper
    {
        UserInfo GetUser(int value, PortalSettings portalSettings, UserInfo currentUserInfo, out KeyValuePair<HttpStatusCode, string> response);
        UserInfo GetUserById(int portalID, int value);
    }
}